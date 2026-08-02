# How react-pdf decides page breaks

Read this before changing `templates/pagination.tsx`, before using
`minPresenceAhead`, or when a new pagination bug doesn't fit the rules in
SKILL.md. Everything here was verified against **@react-pdf/renderer 4.3** by
rendering PDFs and reading back text positions with `pdfjs-dist`, not inferred
from documentation.

## Contents

- [The algorithm](#the-algorithm)
- [Why `minPresenceAhead` does not work](#why-minpresenceahead-does-not-work)
- [Why the section wrapper matters](#why-the-section-wrapper-matters)
- [How to investigate a new pagination bug](#how-to-investigate-a-new-pagination-bug)

## The algorithm

Pagination lives in `@react-pdf/layout` (`splitNodes` / `shouldBreak`). For each
child of a node being laid out, in order:

```js
if (isFixed(child))              → keep on both pages
if (isOutside)                   → move to next page
if (!fitsInsidePage && !canWrap) → render anyway and CLIP, warn
if (shouldBreak(...))            → push the WHOLE child to the next page
if (shouldSplit)                 → split the child, recurse into its children
otherwise                        → keep on this page
```

Two things follow from the order. `shouldBreak` is checked **before**
`shouldSplit`, so a node that could have been split usefully may be pushed whole
instead. And recursion into children happens **only** on the split path — a node
that is pushed never has its children examined, so props on those children are
never read.

`shouldBreak` itself:

```js
const shouldSplit = height < child.box.top + child.box.height;
const canWrap = getWrap(child);
const endOfPresence = getEndOfPresence(child, futureElements);
const breakingImprovesPresence = child.box.top > child.box.marginTop;

return (
  getBreak(child) ||                    // explicit break prop
  (shouldSplit && !canWrap) ||          // doesn't fit and can't be split
  (!shouldSplit && endOfPresence > height && breakingImprovesPresence)
);
```

Three details drive everything else in this document:

- **`breakingImprovesPresence`** is false when a node is the first child of its
  parent (`top === 0`, `marginTop === 0`). The reasoning upstream is that moving
  a node that is already at the top of its container to the top of the next page
  improves nothing. The side effect is that **the first child of a container is
  immune to being pushed.**
- **`endOfPresence`** is `min(child's own end + minPresenceAhead, end of the
  furthest future sibling)`. When a node is the last child, `futureElements` is
  empty, `Math.max(...[])` is `-Infinity`, and the clause can never fire. **A
  node with nothing after it is never pushed** — which is why synthetic
  reproductions with a single trailing element silently fail to reproduce real
  bugs.
- **`wrap={false}` is inherited in effect.** Everything inside an unsplittable
  box is unsplittable, and if that box exceeds the page it is clipped rather
  than moved.

## Why `minPresenceAhead` does not work

It is read only by `getEndOfPresence`, inside the third clause, which is guarded
by `!shouldSplit`. So it applies only to a node that **fits** in the space left.

A section taller than the remaining space fails that guard, takes the split path
instead, and recurses into its children — where the heading is the first child
at `top === 0` and `breakingImprovesPresence` is false. Both routes bypass it.

Measured, by rendering the variants and recording which page each element landed
on (filler height in points, tuned so the heading lands near the page foot):

```
variant                                          640    660    680    700
nested baseline (section wrapper, no guards)  ORPHAN ORPHAN ORPHAN ORPHAN
nested, minPresenceAhead=120 on heading       ORPHAN ORPHAN ORPHAN ORPHAN
nested, minPresenceAhead=120 on section       ORPHAN ORPHAN ORPHAN ORPHAN
nested, wrap=false group (heading + entry1)       ok     ok     ok     ok
flat baseline (no section wrapper)            ORPHAN ORPHAN ORPHAN ORPHAN
flat, minPresenceAhead=120 on the Page child      ok     ok     ok     ok
wrap=false on the whole section                   ok     ok     ok     ok
```

`minPresenceAhead` works in exactly one configuration — on a short node that is
a direct `Page` child — which is not how any of these templates are built, and
is incompatible with the section wrapper required for correct splitting. Gluing
is the only approach that holds in every structure.

`wrap={false}` on the whole section also "works", but makes an entire section
unsplittable: a long Work section then jumps to the next page as one block, or
exceeds a page and gets clipped. Never do this.

## Why the section wrapper matters

This is the subtlest rule, and it produced a bug that looked like something else
entirely.

With sections grouped in a `Fragment` (which react-pdf flattens), the entry
carrying the heading is a **direct `Page` child** at `top > 0`. There
`breakingImprovesPresence` is true, so the third `shouldBreak` clause can fire
and push the whole entry — and because `shouldBreak` is tested before
`shouldSplit`, it never gets the chance to split.

Wrapped in a section `View`, the same entry is the **first child** of that
wrapper at `top === 0`. `breakingImprovesPresence` is false, the push is
suppressed, and the node falls through to the split path: the glued box stays on
the page and the bullets flow.

Duo was the only template using a `Fragment`. Measured with the default resume,
page 1's lowest baseline (page bottom padding is y=40, so lower is a fuller
page):

| template | before | after |
|---|---|---|
| Duo | y=252 | **y=65** |
| Linea | y=63 | y=63 |
| Aria | y=82 | y=82 |
| Mono | y=78 | y=78 |

The misleading part: with a description present the glued box is *smaller* and
the entry moved; with the description removed the glued box is *larger* and the
entry stayed. Anything that looks like "it doesn't fit" should be checked
against that observation before being believed.

## How to investigate a new pagination bug

**Bisect against the real template, not a reproduction.** Synthetic examples of
these layouts repeatedly failed to reproduce real bugs, because the break
decision depends on the extent of following siblings and on exact geometry. A
toy page with one entry and nothing after it can never trigger the third clause
at all.

The approach that worked: render the real component with the real mock, then
vary one input at a time and watch where the break moves.

```
a. real mock (baseline)                  Projects on p2 | p1 filled to y=252
b. no trailing sections                  Projects on p2 | p1 filled to y=252
c. only 1 project                        Projects on p2 | p1 filled to y=252
d. first project has no description      Projects on p1 | p1 filled to y=62
e. first project has no highlights       Projects on p1 | p1 filled to y=64
f. work trimmed by one bullet            Projects on p1 | p1 filled to y=48
```

(d) and (e) isolated it to the entry's own composition rather than to available
space or to what followed — which ruled out the fitting explanation and pointed
at structure.

Useful measurements, all obtainable from a rendered buffer via `pdfjs-dist`:

- **Which page an element is on** — find its text, note the page index.
- **Page fill** — the lowest text baseline on a page. Compare templates against
  each other; a large outlier means that template is pushing rather than
  splitting.
- **Element geometry** — `item.transform[4]` and `[5]` are x and y. Use these to
  confirm a restructure didn't move anything visually: Aria's rail rewrite was
  accepted because the title stayed at exactly `x=40.0 / y=670.0`.

Two measurement traps that cost time:

- **`letterSpacing` fragments text into many items.** Rebuild lines by grouping
  items that share a rounded baseline before matching a title, or a search for
  "Projects" will silently miss `P R O J E C T S`.
- **Match on how a line starts, not on what it contains.** A substring search
  for a section title matches body copy — `"…open source projects moving."`
  matches "Projects", sits mid-page with text beneath it, and reports a pass
  while the actual stranded heading is never examined. This is not hypothetical:
  the bundled check harness shipped with this bug and cheerfully passed the
  known-broken templates. Headings begin with their title (after any leading
  index like Linea's `01`); body copy essentially never does. Fall back to the
  title's last word for titles that wrap in a narrow column, as Aria's rail
  does.

  Whenever you write a pagination check, **run it against a known-bad version
  first.** A check that cannot fail is worse than no check, because it converts
  an open question into false confidence.

Also confirm the font actually embedded (search the raw PDF buffer for the
family name). If it didn't, react-pdf falls back to Helvetica, every height
changes, and the run tells you nothing about the real document.
