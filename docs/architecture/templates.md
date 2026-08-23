# Templates & accents (PDF)

> **Before editing any template, use the `resume-pdf-templates` skill**
> (`.agents/skills/resume-pdf-templates/`). Templates carry structural rules
> that are invisible in review and easy to undo by accident — chiefly that a
> section heading is rendered _inside_ its first entry (`templates/pagination.tsx`)
> so react-pdf can't strand it at the foot of a page, and that each section must
> be wrapped in a `View` rather than a `Fragment` or entries get pushed to the
> next page instead of splitting. `minPresenceAhead` does **not** solve any of
> this. The skill covers those rules, font registration (static TTFs only),
> accent/margin wiring, adding a template, and a harness for checking pagination
> against a rendered PDF.

- **`templates/index.ts`** is a registry of `TemplateDefinition`s (`id`, `name`,
  `defaultAccentId`, `supportsAccent?`, `Component`). Templates are `Duo`,
  `Linea`, `Aria`, `Folio`, `Mono`. Each receives
  `TemplateProps = { resume, accent, marginScale }`. `Mono` is monochrome by
  design and sets `supportsAccent: false`, which disables the accent picker
  while it is active.
- **`templates/accents.ts`** defines pastel `AccentPalette`s
  (`soft`/`muted`/`strong`/`swatch` tonal ramp). "Auto" (accentId `null`)
  resolves to the active template's `defaultAccentId`.
- **`templates/margins.ts`** holds the page-margin presets (Narrow/Normal/Wide).
  Each is a **multiplier** on the template's own base page padding, so every
  template keeps its distinct spacing; Normal is ×1, i.e. unchanged. Resolve a
  stored id with `getMarginScale(id)` and multiply the template's base padding
  by the result.
- **Template, accent, and margin are stored per resume**, in the document's
  `ResumeSettings` — not app-wide — so a designer-styled resume and an ATS-plain
  one coexist. Change them through `updateSettings` from `useResume()`; that
  also writes the `appmeta` document, which the next new resume inherits.
  `resolveSettings` (in **`utils/resume-settings.ts`**, kept apart from the
  repository so the editor and JSON import don't pull RxDB into their import
  graph) coerces a retired template/margin id back to the default rather than
  leaving the preview with no component to render, and treats `accentId: null`
  as meaningful ("Auto"), not missing.
- **`Preview.tsx`** renders the chosen component with `usePDF` (regeneration
  debounced so rapid auto-saved edits coalesce), and displays the resulting blob
  with `react-pdf` (`Document`/`Page`). It deliberately locks the rendered
  document height (`minDocHeight`) while the next PDF regenerates so an edit
  doesn't reset scroll position. It also owns the resume's editable name
  (`ui/EditableTitle` in the nav bar's left cell) and captures the list
  thumbnail.
- Templates are built with `@react-pdf/renderer` primitives
  (`Page`/`View`/`Text`/`StyleSheet`), not DOM. Styles are functions of the
  accent (`makeStyles(accent, marginScale)`); `Mono` ignores the accent and uses
  a module-level `StyleSheet`.
