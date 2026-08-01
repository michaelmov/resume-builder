# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Vite dev server (auto-opens browser); dev:host exposes on LAN
npm run build          # tsc typecheck + production Vite build → dist/
npm run preview        # Serve the production build locally
npm run lint           # ESLint over .ts/.tsx/.js/.jsx (lint:fix to autofix, lint:check for 0 warnings)
npm run format         # Prettier write (format:check to verify)
npm run test           # Vitest (run once); test:watch for watch mode
npm run deploy         # Build + publish dist/ to GitHub Pages (gh-pages branch)
```

- Node version is pinned to `20.19.0` (`.nvmrc`).
- A Husky pre-commit hook runs `npm run lint && npm test` — commits fail on lint errors or failing tests (lint runs first and short-circuits).
- Tests use **Vitest** (config lives in `vite.config.ts` under `test`). Coverage is currently limited to the JSON Resume import/export adapter (`src/utils/jsonresume.test.ts`); there is no component/UI test setup.

## Architecture

A client-only React 18 + TypeScript SPA (Vite) that builds resumes with a live PDF preview. There is **no backend**: all data lives in the browser's `localStorage`, and the app is deployed as static files to GitHub Pages (`base: '/resume-builder/'` in `vite.config.ts`).

The screen is a two-panel layout (`App.tsx`): a left **Editor** panel (forms) that can slide/collapse, and a right **Preview** panel (rendered PDF). The data model follows the [JSON Resume](https://jsonresume.org/) schema, so resumes can be imported/exported as standard JSON.

### State: single source of truth + auto-save

This is the most important pattern to understand before editing the Editor.

- **`context/ResumeContext`** holds the committed `Resume` in a `useReducer` store — the single source of truth, **auto-saved to `localStorage` on every change** (`useEffect` → `useResumeLocalStorage`). On load it hydrates from `localStorage`, falling back to `mocks/resume.mock.ts`. Access it via **`useResume()`** (never `useContext` directly): `resume` plus `updateResume`, `updateSectionData(section, data)`, `updateSectionOrder`, and `updateSectionTitles`. The reducer (`ResumeReducer.ts`) has four actions: `updateResume`, `updateSection` (`{ section, data }` — sets `state[section]`), `updateSectionOrder`, and `updateSectionTitles`.

- **Edits auto-save; there is no Save button.** Each section owns a local `react-hook-form`, and **`useAutoCommitSection`** commits its values to the store a beat after typing stops and on blur — so the flow is **section form → ResumeContext → localStorage → re-render PDF**. The hook re-seeds the form when its committed `value` changes externally (a JSON import), but a reference-identity guard (the reducer stores the exact reference it's handed) skips the echo of the section's own commit so live typing is never clobbered. Adding, reordering, and renaming sections commit straight to the store from `Editor.tsx` (`updateSectionOrder`/`updateSectionTitles`). Removing a section is a permanent delete — it clears the section's data and is gated behind a confirmation popover on the trash button.

- **`OpenSectionContext`** makes the sections behave like an accordion (only one open at a time); `useSectionOpenState(id)` falls back to local state when used outside the provider, and `useOpenSection()` imperatively expands a section (used to auto-open a freshly added one). **`SectionActionsContext`** exposes `removeSection(id)` to the section header's trash button.

- **`OpenSubsectionContext`** is the same accordion one level down: within a section, only one entry (`EditorSubsection` — a job, a school, a skill) is expanded at a time, and all start collapsed. `Editor.tsx` wraps **each section** in its own `OpenSubsectionProvider`, so the scope is per section (every section remembers its own open entry) and section components — which render `EditorSection` themselves — still sit inside the provider. Entries are keyed by their `useFieldArray` `field.id`, passed as `EditorSubsection`'s `id`. Because that id is minted inside `append()`, an "Add" handler expands the new entry via **`useOpenAppendedSubsection(fields)`**: call the returned function right after `append` and the next id to appear at the end of `fields` opens (otherwise a fresh, untitled entry would show as a blank collapsed row). For the same reason, subsection `title`/`subtitle` come from `watch(...)` rather than the `fields` snapshot, which only refreshes on append/remove/move/reset and would otherwise show a stale name on a collapsed entry.

### Sections model

`types/resume.model.ts` defines the schema and the section machinery. **All 12 JSON Resume section types are wired into the editor and all three templates.** Users add/remove section types from the **`AddSectionMenu`** picker (a category-grouped Chakra `Menu` at the bottom of the editor that lists only not-yet-added types). One instance per type — the model stays JSON Resume compatible (no duplicate sections). Each section's display title can be renamed inline from its editor header (the pencil icon), persisted in `sectionTitles`.

- `SectionTypes` enum + `SECTION_TITLES` (display names) + `SECTION_DESCRIPTIONS` (picker subtitles). Note titles differ from keys (e.g. `basics` → "Profile").
- `REORDERABLE_SECTIONS` — the full universe of addable/removable/reorderable types (all 11 non-Basics types). **`Basics` is deliberately excluded**: it is always rendered first as the resume header and can't be removed or collapsed.
- `SECTION_CATEGORIES` groups those types for the picker menu.
- **The active set _is_ `sectionOrder`**: a section is on the resume iff it appears in the persisted `sectionOrder`; types absent from it sit in the picker. `resolveSectionOrder(order?)` returns that active set in order — validating against `REORDERABLE_SECTIONS`, dropping Basics/unknown/dupes. `undefined` falls back to `DEFAULT_ACTIVE_SECTIONS` (the original four: Skills/Work/Education/Projects) so pre-feature saves and brand-new resumes are unchanged; an explicit empty array means "no sections". **Always route persisted order through this helper** (the Editor and every template do).
- `sectionOrder` is persisted as part of the `Resume`. `sectionVisibility` is a **retired** field kept only for legacy localStorage / JSON-import back-compat — nothing in the app reads it anymore (sections are added/removed, not hidden).
- `sectionTitles` (`Partial<Record<SectionTypes, string>>`) holds per-type title overrides, also persisted on the `Resume`. Read titles through **`getSectionTitle(type, resume.sectionTitles)`** (editor header, all templates, text export) — never `SECTION_TITLES[type]` directly — so custom names win, falling back to the default otherwise. `normalizeSectionTitles` strips blank/default-equal entries before persisting. Removing a section also clears its override (a re-added section returns to its default name).

Most sections share one config-driven editor, **`GenericListSection`** (flat fields + an optional bullet list); the seven simpler types are thin wrappers in `NewSections.tsx`. Skills/Work/Education/Projects keep bespoke editors. In the templates, the seven added types reuse each template's existing entry/skill renderers via a small `SimpleEntry`/`InterestGroup` adapter, and an active-but-empty section still renders its heading.

**To add an editable section:** add to `SectionTypes` + `SECTION_TITLES` (+ `SECTION_DESCRIPTIONS`/`SECTION_CATEGORIES` for the picker, and `REORDERABLE_SECTIONS`), give it a field in the `Resume` interface, build an editor (usually a `GenericListSection` wrapper in `NewSections.tsx`) and wire it into `Editor.tsx`'s `sectionComponents` map, and render it in each template's `sectionContent`.

### Templates & accents (PDF)

- **`templates/index.ts`** is a registry of `TemplateDefinition`s (`id`, `name`, `defaultAccentId`, `Component`). Templates are `Duo`, `Linea`, `Aria`. Each receives `TemplateProps = { resume, accent }`.
- **`templates/accents.ts`** defines pastel `AccentPalette`s (`soft`/`muted`/`strong`/`swatch` tonal ramp). "Auto" (accentId `null`) resolves to the active template's `defaultAccentId`.
- **`Preview.tsx`** selects template + accent (each persisted via `useTemplateLocalStorage`/`useAccentLocalStorage` — separate from the resume data), renders the chosen component with `usePDF` (regeneration debounced so rapid auto-saved edits coalesce), and displays the resulting blob with `react-pdf` (`Document`/`Page`). It deliberately locks the rendered document height (`minDocHeight`) while the next PDF regenerates so an edit doesn't reset scroll position.
- Templates are built with `@react-pdf/renderer` primitives (`Page`/`View`/`Text`/`StyleSheet`), not DOM. Styles are functions of the accent (`makeStyles(accent)`).

**Font registration gotcha:** load **static TTFs**, not variable fonts (react-pdf can't subset variable fonts). Newer templates (`Aria`, `Linea`) source static weights from `raw.githubusercontent.com/google/fonts/main/ofl/...`; `Duo` uses pinned static `fonts.gstatic.com` hashes. Prefer the GitHub-raw approach for new fonts and verify the family ships static weights. `Font.registerHyphenationCallback` is set globally (in `Aria`) to disable mid-word hyphenation across all templates.

### Import / export

- **Export** (`Preview/ExportMenu.tsx`): PDF (the live `usePDF` blob), JSON (`utils/json-export.ts`), and ATS-plain-text (`utils/text-export.ts`).
- **Import** (`useJsonImport.ts`): `importFile(file)` reads a JSON Resume file and replaces the whole store via `updateResume`, resolving `false` and exposing an `importError` (rather than throwing) when the file can't be read, parsed, or validated. The navbar's upload button opens **`ImportDialog.tsx`**, which explains the JSON Resume requirement, links to jsonresume.org, and owns both the Chakra `FileUpload` dropzone and the error `Alert` — errors render next to the dropzone that produced them, and the dialog closes only on a successful import. The dropzone pins `acceptedFiles` to a stable empty array and lives _inside_ the dialog body: it imports on pick and must never retain a file, or re-picking one would be rejected as a duplicate instead of re-importing.
- **`utils/jsonresume.ts`** is the translation/validation layer between the internal `Resume` model and the standard [JSON Resume](https://jsonresume.org/) schema, used by both JSON export and import. The internal model deliberately diverges from the schema — `work`/`volunteer` `highlights` and `skills` `keywords` are `{ value }[]` (for react-hook-form), dates may be `Date` objects, and `isPresent`/`sectionVisibility`/`sectionOrder`/`sectionTitles` are app-only — so `toJsonResume` unwraps lists to `string[]`, normalizes dates to `YYYY-MM-DD`, drops `isPresent` in favor of omitting `endDate`, and tucks app state under `meta["resume-builder"]`. `fromJsonResume` reverses this and validates the input with a lenient **zod** schema (`jsonResumeSchema`), throwing a descriptive error for non-resume files. It tolerates both real JSON Resume files and this app's legacy exports. Covered by `jsonresume.test.ts`.

## Conventions

- **Import order is lint-enforced** (`import/order`): groups `builtin → external → internal → parent → sibling → index`, newlines between groups, alphabetized case-insensitive. Run `npm run lint:fix` if unsure.
- `no-console` except `console.error`/`console.info`. `@typescript-eslint/no-explicit-any` is a warning (some form code uses `any`).
- Prettier: single quotes, semicolons, `printWidth` 80, always arrow parens.
- UI is **Chakra UI v3** (`createSystem` theme in `theme.ts`). Three raw ramps drive the whole app: **`brand`** (indigo — the accent, consumed as `colorPalette="brand"` / `brand.solid` / `brand.fg`) plus two neutrals — **`gray`** (overridden from Chakra's default zinc to a cool slate) for light mode and **`zinc`** (near-neutral) for dark. Overriding `gray` retunes every light neutral, because Chakra's own semantic tokens (`bg.subtle`, `bg.panel`, `fg.muted`, `border`, …) and the `gray` colorPalette are all defined as `{colors.gray.N}` references; the dark half of those tokens is repointed at `zinc` explicitly (see Color mode). **Nothing consumes `zinc.N` directly** — it exists only to feed `_dark` conditions. **Style components with the semantic names** (`bg.panel`, `fg.muted`, `border`, `brand.solid`) rather than raw steps like `gray.200`, so a retune stays a one-file change and each component works in both modes. `app.rail` / `app.railHover` / `app.railFg` / `app.canvas` name the chrome roles Chakra has no token for (left icon rail, its hover, its icon color, the PDF backdrop). Drag-and-drop is **`@dnd-kit`**.

- **Color mode.** The app ships light and dark chrome. `ColorModeProvider` (`context/ColorModeContext`) owns the choice; read it with **`useColorMode()`** (`colorMode`, `preference`, `setPreference`, `toggleColorMode`) and toggle it from the left rail (`Navbar.tsx`). The persisted preference is `'light' | 'dark' | 'system'` and defaults to **`system`** — it keeps following the OS (via a `matchMedia` listener) until the toggle pins an explicit mode. The provider mirrors the resolved mode onto `<html>` as the `dark`/`light` class that Chakra's `_dark`/`_light` conditions select on (`.dark &`), plus native `color-scheme`; an inline script in **`index.html`** applies the same class before first paint, so its storage key must stay in sync with `useColorModeLocalStorage`. **The templates are deliberately unaffected** — they render to PDF with colors baked in, and the pages stay white paper on a dark canvas. In `theme.ts` the `_dark` half of every neutral token (`bg.*`, `fg.*`, `border.*`, the `gray` colorPalette, `app.*`) points at the **`zinc`** ramp, not `gray`: slate is crisp as light chrome but reads as a blue cast across large dark surfaces. Those same slots are also re-pitched into a ladder — rail & canvas (950) → editor panel (900) → panels (800) → hover (700) → emphasized (600) — because Chakra's stock dark values map both `bg.subtle` (editor panel) and `bg.panel` (the cards on it) to the 950 step, which flattens the two levels and leaves hovers darker than what they sit on. The `_light` values there are Chakra's defaults, restated only because a semantic token must define every condition it takes part in — light mode is unchanged by any of this. Forms are **`react-hook-form`** (`useFieldArray` for repeatable entries like work highlights / skill keywords).
