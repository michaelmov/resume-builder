# Sections model

`types/resume.model.ts` defines the schema and the section machinery. **All 12
JSON Resume section types are wired into the editor and all three templates.**
Users add/remove section types from the **`AddSectionMenu`** picker (a
category-grouped Chakra `Menu` at the bottom of the editor's Sections pane that
lists only not-yet-added types). One instance per type — the model stays JSON
Resume compatible (no duplicate sections). Each section's display title can be
renamed inline from its editor header (the pencil icon), persisted in
`sectionTitles`.

- `SectionTypes` enum + `SECTION_TITLES` (display names) + `SECTION_DESCRIPTIONS`
  (picker subtitles). Note titles differ from keys (e.g. `basics` → "Profile").
- `REORDERABLE_SECTIONS` — the full universe of addable/removable/reorderable
  types (all 11 non-Basics types). **`Basics` is deliberately excluded**: it is
  always rendered first as the resume header and can't be removed or collapsed.
  That is also why the editor sidebar splits it off into its own **Profile** pane
  rather than pinning it above a list it can't take part in — see
  [editor-state.md](editor-state.md).
- `SECTION_CATEGORIES` groups those types for the picker menu.
- **The active set _is_ `sectionOrder`**: a section is on the resume iff it
  appears in the persisted `sectionOrder`; types absent from it sit in the
  picker. `resolveSectionOrder(order?)` returns that active set in order —
  validating against `REORDERABLE_SECTIONS`, dropping Basics/unknown/dupes.
  `undefined` falls back to `DEFAULT_ACTIVE_SECTIONS` (the original four:
  Skills/Work/Education/Projects) so pre-feature saves and brand-new resumes are
  unchanged; an explicit empty array means "no sections". **Always route
  persisted order through this helper** (the Editor and every template do).
- `sectionOrder` is persisted as part of the `Resume`. `sectionVisibility` is a
  **retired** field kept only for JSON-import back-compat — nothing in the app
  reads it anymore (sections are added/removed, not hidden).
- `sectionTitles` (`Partial<Record<SectionTypes, string>>`) holds per-type title
  overrides, also persisted on the `Resume`. Read titles through
  **`getSectionTitle(type, resume.sectionTitles)`** (editor header, all
  templates, text export) — never `SECTION_TITLES[type]` directly — so custom
  names win, falling back to the default otherwise. `normalizeSectionTitles`
  strips blank/default-equal entries before persisting. Removing a section also
  clears its override (a re-added section returns to its default name).

Most sections share one config-driven editor, **`GenericListSection`** (flat
fields + an optional bullet list); the seven simpler types are thin wrappers in
`NewSections.tsx`. Skills/Work/Education/Projects keep bespoke editors. In the
templates, the seven added types reuse each template's existing entry/skill
renderers via a small `SimpleEntry`/`InterestGroup` adapter, and an
active-but-empty section still renders its heading.

## To add an editable section

Add to `SectionTypes` + `SECTION_TITLES` (+ `SECTION_DESCRIPTIONS` /
`SECTION_CATEGORIES` for the picker, and `REORDERABLE_SECTIONS`), give it a
field in the `Resume` interface, build an editor (usually a `GenericListSection`
wrapper in `NewSections.tsx`) and wire it into `Editor.tsx`'s
`sectionComponents` map, and render it in each template's `sectionContent`.

A `GenericListSection` wrapper gets the responsive field grid for free —
`colSpan: 2` in a `FieldConfig` is translated for you. **A bespoke editor has to
take `FIELD_GRID_COLUMNS` and `FIELD_GRID_FULL_SPAN` from
`components/Editor/field-grid.ts`** rather than writing `repeat(2, 1fr)` and
`colSpan={2}` inline; see `docs/architecture/ui-and-theming.md` for why a bare
`span 2` breaks the single-column layout small screens get.
