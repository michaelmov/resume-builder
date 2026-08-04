---
name: resume-pdf-templates
description: >
  Build, edit, and debug the @react-pdf/renderer resume templates in
  src/templates/ (Duo, Linea, Aria, Mono). Use this skill whenever the task
  touches a resume template at all — adding a new template, restyling an
  existing one, wiring a new resume section into the templates, registering
  fonts, changing accents or page margins, or investigating anything about how
  the generated PDF paginates: headings stranded at the bottom of a page,
  entries jumping wholesale to the next page, stray bullet markers, unexpected
  whitespace at the foot of a page, lines drawn on top of each other at the
  foot of a page, or a section splitting in the wrong place.
  Also use it when someone reaches for `minPresenceAhead`, `wrap`, or `break`
  on a react-pdf node, asks why a PDF layout looks fine on screen but breaks
  badly across pages, or wants a two-column, sidebar, or multi-column resume
  layout — the templates are deliberately single-column and this skill explains
  what to build instead. These templates have hard-won structural rules that are
  invisible in review and easy to undo by accident, so consult this skill
  before editing template JSX even if the change looks purely cosmetic.
---

# Resume PDF templates

Templates render the resume to PDF with `@react-pdf/renderer` primitives
(`Page`/`View`/`Text`/`StyleSheet`) — not DOM. There is no CSS, no cascade
beyond a little inheritance, and layout is Yoga flexbox.

Every template is a `TemplateDefinition` in `src/templates/index.ts` and
receives `TemplateProps = { resume, accent, marginScale }`.

```
src/templates/
├── index.ts        registry — id, name, defaultAccentId, supportsAccent?, Component
├── accents.ts      AccentPalette ramps (soft / muted / strong / swatch)
├── margins.ts      Narrow/Normal/Wide as multipliers on each template's base padding
├── pagination.tsx  KeepTogether, withSectionHeading, splitHighlights, SectionAnchor  ← read this first
├── Duo.tsx  Linea.tsx  Aria.tsx  Mono.tsx
```

## The rule that matters most

**A section heading must never be stranded at the foot of a page while its
content starts the next one.**

react-pdf gives you no "keep with next". The prop that looks like it —
`minPresenceAhead` — **does not work here**, and this has been verified
empirically rather than assumed. If you are about to reach for it, read
`references/pagination-internals.md` first; it shows the source path that
defeats it and the measurements proving it.

What works is making the heading and the start of its first entry a single
unsplittable box, and keeping it out of a page that has no room for it. Four
pieces in `pagination.tsx` do this:

- **`KeepTogether`** — a `View wrap={false}`. Nothing inside it can split.
- **`withSectionHeading(entries, heading)`** — hands the heading *to the first
  entry* via a `leading` prop rather than rendering it as a sibling. This is the
  crux: siblings are exactly what react-pdf is free to break between, so a
  heading that sits beside its content can always be abandoned. A heading that
  sits *inside* its content cannot. Sections with no entries render the heading
  alone.
- **`splitHighlights(highlights, hasSummary)`** — decides how much of the bullet
  list is glued down. When bullets come first, one is glued so the heading
  always has a real line of content beneath it. When a summary comes first,
  nothing extra is glued: a long paragraph inside a `wrap={false}` box could not
  wrap, which would create the page-hogging block we are trying to avoid.
- **`SectionAnchor`** — a zero-height `View` that `withSectionHeading` prepends
  to every section, so the section is never laid out with an empty child list.
  react-pdf keeps an entry whose children all moved to the next page *on the
  current page* when its container has nothing on that page yet — which is
  always true of a section's first entry — and Yoga then shrinks the entry into
  whatever room is left, drawing every line on top of the next. The anchor makes
  the section look started so the entry moves instead. Details in
  `references/pagination-internals.md`.

### Four structural rules

**1. Wrap each section in a `View`, never a `Fragment`.**

react-pdf flattens fragments. A flattened section makes the heading-carrying
entry a direct `Page` child sitting at `top > 0` — precisely where react-pdf's
break logic may push the *entire* entry to the next page instead of splitting
it. Inside a section wrapper the same entry is the first child at `top === 0`,
where that push is suppressed and the entry splits as intended, so the heading
and entry head stay put while the bullets flow.

Duo used a `Fragment` and was the one template that dumped its whole first entry
onto the next page, leaving ~210pt of dead space. It looked like a fitting
problem; it wasn't.

**2. Entries split; single bullets and skill rows don't.**

A long bullet list should flow across pages — an entry that can't split jumps
whole and leaves a gap. Two things stay atomic:

- **individual bullet rows**, or the marker strands at the foot of the page
  while its text moves on (a lone `–` at the bottom of the page);
- **skill and interest rows**, which are a line or two — splitting one
  mid-keyword-list reads as a mistake rather than a page break.

**3. Keep glued boxes small.** Anything inside `wrap={false}` is unsplittable,
and a box taller than a page is *clipped* — content silently disappears, with
only a console warning (`can't wrap between pages and it's bigger than
available page height`). Glue a heading, an entry head, and at most one bullet.

**4. Build single-column templates.** Do not add a template whose page content
flows down side-by-side columns — no sidebar-plus-main, no two-column section
layout. Vary templates through type, spacing, rules, and color instead. That is
how Duo, Linea, Aria, and Mono differ from each other, and it is not a
stylistic preference:

- **Columns break independently.** When a tall row overflows, react-pdf
  continues each column at the top of the next page on its own terms. A sidebar
  shorter than the main column leaves a ragged, misaligned continuation you have
  no control over, and every rule above stops helping — gluing a heading inside
  one column cannot hold anything in a sibling column.
- **A resume PDF gets parsed by machines.** Many applicant tracking systems
  read straight across the full page width, which interleaves the columns and
  scrambles the content. A layout that reads beautifully can extract as
  nonsense.

**This is about columns that content flows down, not about horizontal
arrangement.** A `flexDirection: 'row'` that lays out one line — an entry head
with the title left and dates right, a skill row with a label beside its
keywords, a contact line, a bullet marker beside its text — is fine and used
throughout. Those rows are short or explicitly atomic, so they never split and
never have a continuation to misalign. The test is simple: **if the row is tall
enough to break across a page, its columns will diverge; if it can't break,
it's just layout.**

**The one exception is a label gutter** — a narrow band holding just the section
title, as Aria has. Even then, do not implement it as a real column, because a
sibling column *is* free to strand its title while the entries move on; that was
a real bug in Aria. Implement it the way Aria does now: a single column with
`paddingLeft: '20%'`, and the title positioned into the gutter with
`position: 'absolute', left: '-25%', width: '25%'` *inside* the first entry's
glued box, so the title physically travels with the content it labels.

The `-25%` is not a typo: the gutter is 20% of the section, but `left` resolves
against the padded 80% column, and 20/80 = 25%. The section carries a
`minHeight` so a title wrapping to two lines can't spill into the next section's
gutter.

If someone asks for a two-column resume template, say what the cost is —
unpredictable page breaks and likely ATS mangling — and offer a label gutter or
a stronger typographic hierarchy instead.

## The shape of an entry component

Every entry component takes `leading?: ReactNode` (`LeadingEntryProps`) and
renders it inside its own `KeepTogether`. Follow this shape and the pagination
rules hold automatically:

```tsx
const WorkExperience = ({
  work,
  styles,
  leading,
}: { work: Work; styles: Styles } & LeadingEntryProps) => {
  const { glued, flowing } = splitHighlights(
    work.highlights,
    Boolean(work.summary)
  );

  return (
    <View style={styles.entry}>
      <KeepTogether>
        {leading}
        <View style={styles.entryHead}>…</View>
        {work.position && <Text style={styles.entryMeta}>{work.position}</Text>}
        {glued.map((h, i) => (
          <Highlight key={i} value={h.value} styles={styles} />
        ))}
      </KeepTogether>
      {work.summary && <Text style={styles.entrySummary}>{work.summary}</Text>}
      {flowing.map((h, i) => (
        <Highlight key={i} value={h.value} styles={styles} />
      ))}
    </View>
  );
};
```

Entries with no body (education, a one-line simple entry, a skill row) can put
the whole thing inside `KeepTogether` — they're small enough to stay atomic.

Two things to avoid, both of which cost real debugging time:

- **Don't wrap a paragraph in a `View`.** Render summaries as a bare `Text` so
  react-pdf can split them line by line.
- **Don't wrap the bullet list in a container `View`.** Put the list's top
  margin on the first row instead. A container forces a choice between
  double-margins and conditional styles once the list is split into glued and
  flowing halves.

## The shape of a section

```tsx
{sections.map((section) => (
  <View key={section.title} style={styles.section}>
    {withSectionHeading(
      section.body ?? [],
      <SectionHeader title={section.title} styles={styles} />
    )}
  </View>
))}
```

`sectionContent` holds **entries only** — `Partial<Record<SectionTypes, ReactNode[]>>`.
The heading is injected at render time, so don't pre-compose heading + body into
the map.

Read section titles through `getSectionTitle(type, resume.sectionTitles)`, never
`SECTION_TITLES[type]`, so a user's custom name wins. Route persisted order
through `resolveSectionOrder(resume.sectionOrder)`. An active-but-empty section
still renders its heading.

## Fonts

Register **static TTFs**. react-pdf cannot subset variable fonts, and a variable
font will either fail or render wrong — so verify the family actually ships
static weights before choosing it.

Prefer `raw.githubusercontent.com/google/fonts/main/ofl/<family>/<Family>-<Weight>.ttf`
(what Aria, Linea, and Mono use) over the Google Fonts CDN, which increasingly
serves variable files. Duo predates this and uses pinned static
`fonts.gstatic.com` hashes; leave it alone unless you're changing its type.

`Font.registerHyphenationCallback((word) => [word])` is a **global** react-pdf
setting — registering it in one template disables mid-word hyphenation
everywhere. It lives in Aria. Don't fight it per-template.

## Accents and margins

`makeStyles(accent, marginScale)` builds the `StyleSheet` per render. The accent
is an `AccentPalette` with a `soft`/`muted`/`strong`/`swatch` ramp; "Auto"
resolves to the template's `defaultAccentId`.

`marginScale` is a **multiplier on the template's own base page padding**, not an
absolute value — that's how each template keeps its distinctive spacing while
still responding to the setting. Normal is ×1.

A monochrome template sets `supportsAccent: false` in the registry, which
disables the accent picker while it's active, and can use a module-level
`StyleSheet` instead of `makeStyles` (Mono does both).

## Adding a new template

1. Build `src/templates/<Name>.tsx` following the entry and section shapes above
   — **single column** (rule 4), distinguished by type, spacing, rules, and
   color rather than by layout columns.
2. Register fonts at module scope (static TTFs).
3. `makeStyles(accent, marginScale)` — multiply the base page padding by
   `marginScale`.
4. Build `sectionContent` as entries-only arrays covering **all 12 section
   types**, reusing a `SimpleEntry`/`InterestGroup` adapter for the simpler ones.
5. Render sections with the `View` + `withSectionHeading` shape.
6. Add the definition to the `templates` array in `index.ts`.
7. Run the pagination check below and look at the PDF.

## Verifying pagination

Pagination bugs are invisible until a resume spills onto a second page, and the
symptoms are geometric — you cannot spot them by reading JSX. Check them by
rendering.

`assets/pagination-check.test.ts` renders every template with the mock resume,
padding the profile summary a line at a time so every break slides down the
page, and reports per render: page count, how far each page fills, any section
heading that is the last line on its page, any entry squashed into the bottom
margin, and any stranded bullet marker. The sweep is the point — a single
render of the default resume passes on builds that break as soon as a line of
text is added.

```bash
cp .agents/skills/resume-pdf-templates/assets/pagination-check.test.ts \
   src/templates/__pagination-check.test.ts
npx vitest run src/templates/__pagination-check.test.ts --reporter=verbose
rm src/templates/__pagination-check.test.ts
```

It is a temporary harness, not a committed test — it needs network access to
fetch fonts, and the repo's pre-commit hook runs `npm test` on every commit.
Delete it when you're done.

Reading the output:

- **A stranded heading** is the bug this whole skill exists to prevent.
- **Page fill** is the lowest text baseline on a page; the page bottom is the
  padding value. A page filling to y≈60 on A4 is healthy. One template filling
  to y≈250 while its siblings reach y≈70 means it is pushing entries instead of
  splitting them — check rule 1.
- Confirm fonts embedded. If they didn't load, react-pdf silently falls back to
  Helvetica and every measurement is meaningless.

For a visual check, render to PNG and look at it:

```bash
sips -s format png --out /tmp/duo.png /tmp/duo.pdf   # macOS
```

## When pagination misbehaves in a new way

Reason about react-pdf's actual break algorithm rather than guessing, and
**bisect against the real component** — synthetic reproductions of these layouts
are unreliable, because the break decision depends on the extent of *following*
siblings and on exact geometry that a toy example won't reproduce. Vary one
input at a time on the real template (drop a description, drop the bullets,
shorten the preceding section) and watch where the break moves.

`references/pagination-internals.md` documents the break algorithm, why
`minPresenceAhead` fails, and the measurements behind each rule above. Read it
before changing anything in `pagination.tsx` or concluding that a rule here is
wrong.
