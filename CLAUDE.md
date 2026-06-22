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

### State: single source of truth + deferred save

This is the most important pattern to understand before editing the Editor.

- **`context/ResumeContext`** holds the committed `Resume` in a `useReducer` store. It is the single source of truth and is **auto-saved to `localStorage` on every change** (`useEffect` → `useResumeLocalStorage`). On load it hydrates from `localStorage`, falling back to `mocks/resume.mock.ts`. Access it via the **`useResume()`** hook (never `useContext` directly) — it exposes `resume` plus `updateResume`, the generic `updateSectionData(section, data)`, and `updateSectionOrder`. The reducer (`ResumeReducer.ts`) has just three actions: `updateResume`, `updateSection` (`{ section, data }` — sets `state[section]`), and `updateSectionOrder`.

- **Edits are staged, not live.** Each editor section owns a local `react-hook-form` and does **not** write to the ResumeContext on keystroke. Instead it registers `{ isDirty, handleSubmit, reset }` with **`GlobalFormContext`** (`registerSection`/`unregisterSection`). `GlobalActionBar` watches `hasAnyDirtySection` to show the bar with **Save All Changes** (`saveAllSections()` fires every dirty section's submit) and **Discard** (`discardAllSections()` calls every dirty section's `reset`). So: **section form → (Save All) → ResumeContext → localStorage → re-render PDF.** Adding, removing, and reordering sections are all staged the same way: `Editor.tsx` keeps the active set in local `pendingOrder` state and registers a synthetic `sectionOrder` form id, so they participate in Save All / Discard rather than committing immediately. On save, removing a section also clears its data (remove = permanent delete).

- **`OpenSectionContext`** makes the sections behave like an accordion (only one open at a time); `useSectionOpenState(id)` falls back to local state when used outside the provider, and `useOpenSection()` imperatively expands a section (used to auto-open a freshly added one). **`SectionActionsContext`** exposes `removeSection(id)` to the section header's trash button.

### Sections model

`types/resume.model.ts` defines the schema and the section machinery. **All 12 JSON Resume section types are wired into the editor and all three templates.** Users add/remove section types from the **`AddSectionMenu`** picker (a category-grouped Chakra `Menu` at the bottom of the editor that lists only not-yet-added types). One instance per type — the model stays JSON Resume compatible (no duplicate sections, no custom titles).

- `SectionTypes` enum + `SECTION_TITLES` (display names) + `SECTION_DESCRIPTIONS` (picker subtitles). Note titles differ from keys (e.g. `basics` → "Profile").
- `REORDERABLE_SECTIONS` — the full universe of addable/removable/reorderable types (all 11 non-Basics types). **`Basics` is deliberately excluded**: it is always rendered first as the resume header and can't be removed or collapsed.
- `SECTION_CATEGORIES` groups those types for the picker menu.
- **The active set *is* `sectionOrder`**: a section is on the resume iff it appears in the persisted `sectionOrder`; types absent from it sit in the picker. `resolveSectionOrder(order?)` returns that active set in order — validating against `REORDERABLE_SECTIONS`, dropping Basics/unknown/dupes. `undefined` falls back to `DEFAULT_ACTIVE_SECTIONS` (the original four: Skills/Work/Education/Projects) so pre-feature saves and brand-new resumes are unchanged; an explicit empty array means "no sections". **Always route persisted order through this helper** (the Editor and every template do).
- `sectionOrder` is persisted as part of the `Resume`. `sectionVisibility` is a **retired** field kept only for legacy localStorage / JSON-import back-compat — nothing in the app reads it anymore (sections are added/removed, not hidden).

Most sections share one config-driven editor, **`GenericListSection`** (flat fields + an optional bullet list); the seven simpler types are thin wrappers in `NewSections.tsx`. Skills/Work/Education/Projects keep bespoke editors. In the templates, the seven added types reuse each template's existing entry/skill renderers via a small `SimpleEntry`/`InterestGroup` adapter, and an active-but-empty section still renders its heading.

**To add an editable section:** add to `SectionTypes` + `SECTION_TITLES` (+ `SECTION_DESCRIPTIONS`/`SECTION_CATEGORIES` for the picker, and `REORDERABLE_SECTIONS`), give it a field in the `Resume` interface, build an editor (usually a `GenericListSection` wrapper in `NewSections.tsx`) and wire it into `Editor.tsx`'s `sectionComponents` map, and render it in each template's `sectionContent`.

### Templates & accents (PDF)

- **`templates/index.ts`** is a registry of `TemplateDefinition`s (`id`, `name`, `defaultAccentId`, `Component`). Templates are `Duo`, `Linea`, `Aria`. Each receives `TemplateProps = { resume, accent }`.
- **`templates/accents.ts`** defines pastel `AccentPalette`s (`soft`/`muted`/`strong`/`swatch` tonal ramp). "Auto" (accentId `null`) resolves to the active template's `defaultAccentId`.
- **`Preview.tsx`** selects template + accent (each persisted via `useTemplateLocalStorage`/`useAccentLocalStorage` — separate from the resume data), renders the chosen component with `usePDF`, and displays the resulting blob with `react-pdf` (`Document`/`Page`). It deliberately locks the rendered document height (`minDocHeight`) while the next PDF regenerates so saving an edit doesn't reset scroll position.
- Templates are built with `@react-pdf/renderer` primitives (`Page`/`View`/`Text`/`StyleSheet`), not DOM. Styles are functions of the accent (`makeStyles(accent)`).

**Font registration gotcha:** load **static TTFs**, not variable fonts (react-pdf can't subset variable fonts). Newer templates (`Aria`, `Linea`) source static weights from `raw.githubusercontent.com/google/fonts/main/ofl/...`; `Duo` uses pinned static `fonts.gstatic.com` hashes. Prefer the GitHub-raw approach for new fonts and verify the family ships static weights. `Font.registerHyphenationCallback` is set globally (in `Aria`) to disable mid-word hyphenation across all templates.

### Import / export

- **Export** (`Preview/ExportMenu.tsx`): PDF (the live `usePDF` blob), JSON (`utils/json-export.ts`), and ATS-plain-text (`utils/text-export.ts`).
- **Import** (`useJsonImport.ts`, wired in `Navbar.tsx`): reads a JSON Resume file and replaces the whole store via `updateResume`.
- **`utils/jsonresume.ts`** is the translation/validation layer between the internal `Resume` model and the standard [JSON Resume](https://jsonresume.org/) schema, used by both JSON export and import. The internal model deliberately diverges from the schema — `work`/`volunteer` `highlights` and `skills` `keywords` are `{ value }[]` (for react-hook-form), dates may be `Date` objects, and `isPresent`/`sectionVisibility`/`sectionOrder` are app-only — so `toJsonResume` unwraps lists to `string[]`, normalizes dates to `YYYY-MM-DD`, drops `isPresent` in favor of omitting `endDate`, and tucks app state under `meta["resume-builder"]`. `fromJsonResume` reverses this and validates the input with a lenient **zod** schema (`jsonResumeSchema`), throwing a descriptive error for non-resume files. It tolerates both real JSON Resume files and this app's legacy exports. Covered by `jsonresume.test.ts`.

## Conventions

- **Import order is lint-enforced** (`import/order`): groups `builtin → external → internal → parent → sibling → index`, newlines between groups, alphabetized case-insensitive. Run `npm run lint:fix` if unsure.
- `no-console` except `console.error`/`console.info`. `@typescript-eslint/no-explicit-any` is a warning (some form code uses `any`).
- Prettier: single quotes, semicolons, `printWidth` 80, always arrow parens.
- UI is **Chakra UI v3** (`createSystem` theme in `theme.ts`, `colorPalette="purple"` accent). Drag-and-drop is **`@dnd-kit`**. Forms are **`react-hook-form`** (`useFieldArray` for repeatable entries like work highlights / skill keywords).
