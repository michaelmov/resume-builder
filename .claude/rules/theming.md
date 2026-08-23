---
paths:
  - 'src/theme.ts'
  - 'src/context/ColorModeContext/**'
  - 'src/hooks/useColorMode*.ts'
  - 'index.html'
---

# Chakra theme & color mode

Read `docs/architecture/ui-and-theming.md` before touching the theme. The
non-negotiables:

- **Style with semantic tokens** (`bg.panel`, `fg.muted`, `border`,
  `brand.solid`, `app.rail`), never raw steps like `gray.200` — a raw step only
  works in one color mode and defeats a one-file retune.
- **`gray` is the light neutral, `zinc` the dark one.** Nothing consumes
  `zinc.N` directly; it exists only to feed `_dark` conditions.
- **A semantic token must define every condition it takes part in**, which is
  why `_light` values restate Chakra's defaults.
- **`index.html`'s inline pre-paint script and `useColorModeLocalStorage` must
  use the same storage key.**
- **Templates are deliberately unaffected by color mode** — they render to PDF
  with colors baked in.
