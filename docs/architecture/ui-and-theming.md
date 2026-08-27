# UI & theming

UI is **Chakra UI v3** (`createSystem` theme in `theme.ts`). Forms are
**`react-hook-form`** (`useFieldArray` for repeatable entries like work
highlights / skill keywords). Drag-and-drop is **`@dnd-kit`**.

## Colour ramps

Three raw ramps drive the whole app: **`brand`** (indigo — the accent, consumed
as `colorPalette="brand"` / `brand.solid` / `brand.fg`) plus two neutrals —
**`gray`** (overridden from Chakra's default zinc to a cool slate) for light
mode and **`zinc`** (near-neutral) for dark.

Overriding `gray` retunes every light neutral, because Chakra's own semantic
tokens (`bg.subtle`, `bg.panel`, `fg.muted`, `border`, …) and the `gray`
colorPalette are all defined as `{colors.gray.N}` references; the dark half of
those tokens is repointed at `zinc` explicitly (see below). **Nothing consumes
`zinc.N` directly** — it exists only to feed `_dark` conditions.

**Style components with the semantic names** (`bg.panel`, `fg.muted`, `border`,
`brand.solid`) rather than raw steps like `gray.200`, so a retune stays a
one-file change and each component works in both modes. `app.rail` /
`app.railHover` / `app.railFg` / `app.canvas` name the chrome roles Chakra has
no token for (left icon rail, its hover, its icon color, the PDF backdrop).

## Color mode

The app ships light and dark chrome. `ColorModeProvider`
(`context/ColorModeContext`) owns the choice; read it with **`useColorMode()`**
(`colorMode`, `preference`, `setPreference`, `toggleColorMode`) and toggle it
from the left rail (`Navbar.tsx`). The persisted preference is
`'light' | 'dark' | 'system'` and defaults to **`system`** — it keeps following
the OS (via a `matchMedia` listener) until the toggle pins an explicit mode.

The provider mirrors the resolved mode onto `<html>` as the `dark`/`light` class
that Chakra's `_dark`/`_light` conditions select on (`.dark &`), plus native
`color-scheme`; an inline script in **`index.html`** applies the same class
before first paint, so its storage key must stay in sync with
`useColorModeLocalStorage`. This preference is the only thing left in
`localStorage`, because it has to be readable synchronously before first paint.

**The templates are deliberately unaffected** — they render to PDF with colors
baked in, and the pages stay white paper on a dark canvas.

In `theme.ts` the `_dark` half of every neutral token (`bg.*`, `fg.*`,
`border.*`, the `gray` colorPalette, `app.*`) points at the **`zinc`** ramp, not
`gray`: slate is crisp as light chrome but reads as a blue cast across large
dark surfaces. Those same slots are also re-pitched into a ladder — rail (950) →
editor panel & PDF canvas (900) → panels (800) → hover (700) → emphasized (600)
— because Chakra's stock dark values map both `bg.subtle` (editor panel) and
`bg.panel` (the cards on it) to the 950 step, which flattens the two levels and
leaves hovers darker than what they sit on. The `_light` values there are
Chakra's defaults, restated only because a semantic token must define every
condition it takes part in — light mode is unchanged by any of this.

## Editor surfaces: one card level, not two

The sidebar is a `bg.subtle` pane, and **exactly one `bg.panel` card sits
between it and any form field**. Which element draws that card depends on the
section:

- **Sections with repeatable entries** (Work, Education, Projects, …) — the
  **entry** is the card (`EditorSubsection`). `EditorSection`'s
  `Collapsible.Content` draws no surface at all; it is a bare wrapper. What
  groups a section's entries is its header row plus the `gap={8}` to the next
  section, not a box around them.
- **Basics** — the section itself is the card (`EditorSection`'s `alwaysOpen`
  branch), because it has no entries to carry one.

This is a width constraint, not a taste one. Each card level costs its border
plus its inset on **both** sides, and the sidebar's floor is 600px. Nesting a
section card (`p={8}`) around an entry card (`p={4}`) spent 148px — a quarter of
the sidebar — on chrome, which the two-column field grids then split, leaving
222px per input. With one level it is ~510px for the pair. **Don't reintroduce a
surface on `Collapsible.Content`**; entry cards would go back to being boxes in
a box and the fields would shrink again.

The sidebar's own width is `clamp(600px, 38vw, 760px)` (`EDITOR_WIDTH` in
`pages/EditorPage.tsx`), so a large display spends some of its extra width on
the forms rather than only on magnifying a preview page that already fits. The
collapse animation's negative margin has to stay the exact negative of it. The
preview measures its own column (`usePreviewZoom`) and follows on its own.

**Both insets tighten below `md`** — the pane's `PANE_PX` (`Editor.tsx`), the
entry card's `px`, and the pinned card's `CARD_PX` all go `{ base: 3, md: 6|4 }`.
Below that breakpoint the editor is the whole phone screen inside
`MobileEditorSheet`, not a 600px-plus sidebar, so the same two insets are a much
larger share of it: on a 390px phone they were 82px before, versus 150px per
field. Keep the breakpoint at `md` — it is the one `useIsMobile` switches the
sheet layout on, so the insets and the layout flip together.

**The field grids themselves collapse to one column below `sm`** — every section
takes `FIELD_GRID_COLUMNS` and `FIELD_GRID_FULL_SPAN` from
`components/Editor/field-grid.ts` rather than spelling the values out, so the
breakpoint is one edit. Two columns on a 390px phone leave ~166px per field,
which doesn't fit a date plus its calendar button or a real email address; one
column gives each field the whole ~340px. It stops at `sm` (480px) rather than
the `md` the sheet layout switches on, because the trade is height — a form
roughly doubles inside a sheet that only opens to 55–88% of the viewport — and
between 480px and 768px two columns are still wide enough to be worth keeping.

**A full-row field must use `FIELD_GRID_FULL_SPAN`, never a bare `colSpan={2}`.**
`span 2` does not clamp to the available tracks: in the single-column grid, CSS
adds an implicit second track to satisfy it, and every other field shrinks to
share the row with a column only the wide ones use.
