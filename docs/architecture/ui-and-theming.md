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
