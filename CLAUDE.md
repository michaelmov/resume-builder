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

There are two screens, routed in `App.tsx` (`main.tsx` mounts a `HashRouter`, since GitHub Pages can't rewrite paths):

- **`/` — `screens/ResumeListScreen`**: a card grid of every saved resume, each showing a real thumbnail of its first PDF page.
- **`/editor/:id` — `screens/EditorScreen`**: the two-panel editor — a left **Editor** panel (forms) that can slide/collapse, and a right **Preview** panel (rendered PDF).

Anything else redirects to `/`. So does `/editor/:id` for an id that isn't in the library (a stale bookmark, a resume deleted in another tab), passing `state.missingResume` so the list can explain the bounce. The `Navbar` left rail is on both screens and takes its contextual top slot as `children`.

The data model follows the [JSON Resume](https://jsonresume.org/) schema, so resumes can be imported/exported as standard JSON.

### The resume library

`utils/resume-storage.ts` is the only module that touches `localStorage`. Storage is split so the list stays cheap and an edit stays narrow:

| Key               | Holds                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `resume-index`    | `{ version, resumes: ResumeSummary[] }` — `{ id, name, createdAt, updatedAt }` per resume. **The source of truth for names and timestamps.** |
| `resume-doc:<id>` | `{ resume, settings }` for one resume.                                                                                                       |
| `resume-defaults` | The last-used `ResumeSettings`, which a newly created resume inherits.                                                                       |

- **The index's _absence_ is what marks storage as never-migrated.** `loadLibrary()` migrates the single-resume era's `resume-data` + `selected-template`/`-accent`/`-margin` into one resume (named from `basics.name`, else "My Resume") and then deletes those keys; with nothing to migrate it seeds `resume.mock.ts` as "Sample Resume". An index that is _present but empty_ means "migrated, then every resume deleted", so the sample must not come back — the same undefined-vs-empty distinction `resolveSectionOrder` draws. An index that is present but _unparseable_ is `damaged`, not absent: it's rebuilt by scanning `resume-doc:` keys, so one mangled key can't orphan real resumes. Don't collapse those three states into one.
- **Writes throw `ResumeStorageError`.** Everything auto-saves with no Save button, so a silently dropped write is invisible until the user reloads and finds their work gone. `ResumeLibraryProvider` catches it into `saveError`, which `SaveErrorBanner` (rendered on both screens) surfaces.
- **`context/ResumeLibraryContext`** sits above the router and owns the index plus `createResume`/`duplicateResume`/`renameResume`/`deleteResume`/`saveResume`/`rememberSettings`. Read it with **`useResumeLibrary()`**. Every operation reads the list through `resumesRef` rather than closing over `resumes`, which keeps them all **reference-stable** — `saveResume` writes the index it would otherwise close over, so an identity that changed per write would re-trigger the editor's auto-save effect and loop. `commitIndex` updates that ref inline (not just on render) so two mutations in one tick compose. It re-reads the index on `window` focus, which is the whole of the cross-tab story — there is no live sync.

### State: single source of truth + auto-save

This is the most important pattern to understand before editing the Editor.

- **`context/ResumeContext`** holds the committed `Resume` in a `useReducer` store — the single source of truth for the **one** resume being edited. It lives **under the `/editor/:id` route**, keyed by that id and handed a `ResumeDocument` the route already read, so a keystroke rewrites one storage key instead of re-serializing the library, and switching resumes remounts the store rather than reconciling one reducer state onto another. Access it via **`useResume()`** (never `useContext` directly): `resume` and `settings` plus `updateResume`, `updateSettings`, `updateSectionData(section, data)`, `updateSectionOrder`, and `updateSectionTitles`. The reducer (`ResumeReducer.ts`) has four actions: `updateResume`, `updateSection` (`{ section, data }` — sets `state[section]`), `updateSectionOrder`, and `updateSectionTitles`.

- **The save effect skips its first run.** Merely opening a resume must not count as editing it — the list sorts by most recently edited, so a save on mount would reshuffle it on every visit. It also calls `saveResume` through a ref for the loop reason described above.

- **Edits auto-save; there is no Save button.** Each section owns a local `react-hook-form`, and **`useAutoCommitSection`** commits its values to the store a beat after typing stops and on blur — so the flow is **section form → ResumeContext → `resume-doc:<id>` → re-render PDF**. The hook re-seeds the form when its committed `value` changes externally (a JSON import), but a reference-identity guard (the reducer stores the exact reference it's handed) skips the echo of the section's own commit so live typing is never clobbered. Adding, reordering, and renaming sections commit straight to the store from `Editor.tsx` (`updateSectionOrder`/`updateSectionTitles`). Removing a section is a permanent delete — it clears the section's data and is gated behind a confirmation popover on the trash button.

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

- **`templates/index.ts`** is a registry of `TemplateDefinition`s (`id`, `name`, `defaultAccentId`, `supportsAccent?`, `Component`). Templates are `Duo`, `Linea`, `Aria`, `Folio`, `Mono`. Each receives `TemplateProps = { resume, accent, marginScale }`. `Mono` is monochrome by design and sets `supportsAccent: false`, which disables the accent picker while it is active.
- **`templates/accents.ts`** defines pastel `AccentPalette`s (`soft`/`muted`/`strong`/`swatch` tonal ramp). "Auto" (accentId `null`) resolves to the active template's `defaultAccentId`.
- **`templates/margins.ts`** holds the page-margin presets (Narrow/Normal/Wide). Each is a **multiplier** on the template's own base page padding, so every template keeps its distinct spacing; Normal is ×1, i.e. unchanged. Resolve a stored id with `getMarginScale(id)` and multiply the template's base padding by the result.
- **Template, accent, and margin are stored per resume**, in the document's `ResumeSettings` — not app-wide — so a designer-styled resume and an ATS-plain one coexist. Change them through `updateSettings` from `useResume()`; that also writes `resume-defaults`, which the next new resume inherits. `resolveSettings` coerces a retired template/margin id back to the default rather than leaving the preview with no component to render, and treats `accentId: null` as meaningful ("Auto"), not missing.
- **`Preview.tsx`** renders the chosen component with `usePDF` (regeneration debounced so rapid auto-saved edits coalesce), and displays the resulting blob with `react-pdf` (`Document`/`Page`). It deliberately locks the rendered document height (`minDocHeight`) while the next PDF regenerates so an edit doesn't reset scroll position. It also owns the resume's editable name (`ui/EditableTitle` in the nav bar's left cell) and captures the list thumbnail.
- Templates are built with `@react-pdf/renderer` primitives (`Page`/`View`/`Text`/`StyleSheet`), not DOM. Styles are functions of the accent (`makeStyles(accent, marginScale)`); `Mono` ignores the accent and uses a module-level `StyleSheet`.

**Before editing any template, use the `resume-pdf-templates` skill** (`.agents/skills/resume-pdf-templates/`). Templates carry structural rules that are invisible in review and easy to undo by accident — chiefly that a section heading is rendered _inside_ its first entry (`templates/pagination.tsx`) so react-pdf can't strand it at the foot of a page, and that each section must be wrapped in a `View` rather than a `Fragment` or entries get pushed to the next page instead of splitting. `minPresenceAhead` does **not** solve any of this. The skill covers those rules, font registration (static TTFs only), accent/margin wiring, adding a template, and a harness for checking pagination against a rendered PDF.

### Thumbnails

The list card shows a real PNG of page 1, cached in IndexedDB (`utils/thumbnails.ts` — blobs are far too big for `localStorage`) and stamped with the resume's `updatedAt`.

- **The editor is the normal producer.** `Preview` snapshots its live `usePDF` blob once the PDF _and_ `updatedAt` have both been quiet for `THUMBNAIL_CAPTURE_DELAY_MS`. That wait is not cosmetic: `updatedAt` bumps the moment an edit saves while the blob catches up only after the render debounce, so capturing eagerly can stamp an older image with a newer time — which then reads as fresh and is never re-rendered.
- **The list is the fallback.** `ResumeThumbnail` paints a stale cached image immediately (it still shows the right resume) and re-renders via `utils/render-resume-pdf.tsx` only on a miss or a stamp mismatch — lazily behind an `IntersectionObserver` and serialized through a module-level queue, since rendering a PDF blocks the main thread in bursts.
- Every function in `thumbnails.ts` **fails soft**: IndexedDB is unavailable in private-mode Safari and can abort on quota, and a broken thumbnail cache must never break the list.
- `PAGE_ASPECT_RATIO` is **A4** (595.28 × 841.89pt) because every template renders `<Page size="A4">`. Getting it wrong letterboxes or crops the thumbnail.
- pdf.js drives its render continuation with `requestAnimationFrame`, which Chrome pauses in a background tab — thumbnail renders stall there and resume when the tab is shown again. Expected, not a bug.
- `pdfjs.GlobalWorkerOptions.workerSrc` is set once in `utils/pdf-worker.ts`; both `Preview` and `thumbnails.ts` depend on it via `ensurePdfWorker()`.

### Import / export

- **Export** (`Preview/ExportMenu.tsx`, and the list card's Download submenu): PDF (the live `usePDF` blob in the editor, a fresh `renderResumePdf` from the list), JSON (`utils/json-export.ts`), and ATS-plain-text (`utils/text-export.ts`). Both entry points name the file through `resumeExportFileName` (`utils/download.ts`) so they can't drift.
- **Import** (`useJsonImport.ts`): `readResumeFile(file)` validates a JSON Resume file and returns `{ resume, meta, fileName }`, resolving `null` and exposing an `importError` (rather than throwing) when the file can't be read, parsed, or validated. It deliberately stops at "parsed" instead of committing, because the **same file means two different things**: on the list it _adds_ a resume (named via `nameForImport`), and in the editor it _replaces_ the open one. Only the caller knows which.
- **`ImportDialog.tsx`** takes that as a `mode` prop. `add` commits straight away — it can't destroy anything, so it needs no confirmation. `replace` holds the parsed resume in `pending` and shows a confirmation naming both sides, since overwriting can't be undone. The dropzone pins `acceptedFiles` to a stable empty array and lives _inside_ the dialog body: it imports on pick and must never retain a file, or re-picking one would be rejected as a duplicate instead of re-importing. The list also accepts a `.json` dropped anywhere on the grid.
- **`meta["resume-builder"]`** carries the app-only state through a round-trip: `sectionOrder`/`sectionTitles`/`sectionVisibility` plus the resume's `name` and `settings`. `toJsonResume(resume)` with no second argument still produces exactly what it did before names existed. `readResumeDocumentMeta` reads that block **defensively** and separately from `fromJsonResume` — it validates template/accent/margin ids against the live registries and drops `settings` wholesale if they don't resolve, so a stale block costs the settings, not the import. The zod schema keeps `meta` as `z.record(z.unknown())` for the same reason.
- **`utils/jsonresume.ts`** is the translation/validation layer between the internal `Resume` model and the standard [JSON Resume](https://jsonresume.org/) schema, used by both JSON export and import. The internal model deliberately diverges from the schema — `work`/`volunteer` `highlights` and `skills` `keywords` are `{ value }[]` (for react-hook-form), dates may be `Date` objects, and `isPresent`/`sectionVisibility`/`sectionOrder`/`sectionTitles` are app-only — so `toJsonResume` unwraps lists to `string[]`, normalizes dates to `YYYY-MM-DD`, drops `isPresent` in favor of omitting `endDate`, and tucks app state under `meta["resume-builder"]`. `fromJsonResume` reverses this and validates the input with a lenient **zod** schema (`jsonResumeSchema`), throwing a descriptive error for non-resume files. It tolerates both real JSON Resume files and this app's legacy exports. Covered by `jsonresume.test.ts`.

## Conventions

- **Import order is lint-enforced** (`import/order`): groups `builtin → external → internal → parent → sibling → index`, newlines between groups, alphabetized case-insensitive. Run `npm run lint:fix` if unsure.
- `no-console` except `console.error`/`console.info`. `@typescript-eslint/no-explicit-any` is a warning (some form code uses `any`).
- Prettier: single quotes, semicolons, `printWidth` 80, always arrow parens.
- UI is **Chakra UI v3** (`createSystem` theme in `theme.ts`). Three raw ramps drive the whole app: **`brand`** (indigo — the accent, consumed as `colorPalette="brand"` / `brand.solid` / `brand.fg`) plus two neutrals — **`gray`** (overridden from Chakra's default zinc to a cool slate) for light mode and **`zinc`** (near-neutral) for dark. Overriding `gray` retunes every light neutral, because Chakra's own semantic tokens (`bg.subtle`, `bg.panel`, `fg.muted`, `border`, …) and the `gray` colorPalette are all defined as `{colors.gray.N}` references; the dark half of those tokens is repointed at `zinc` explicitly (see Color mode). **Nothing consumes `zinc.N` directly** — it exists only to feed `_dark` conditions. **Style components with the semantic names** (`bg.panel`, `fg.muted`, `border`, `brand.solid`) rather than raw steps like `gray.200`, so a retune stays a one-file change and each component works in both modes. `app.rail` / `app.railHover` / `app.railFg` / `app.canvas` name the chrome roles Chakra has no token for (left icon rail, its hover, its icon color, the PDF backdrop). Drag-and-drop is **`@dnd-kit`**.

- **Color mode.** The app ships light and dark chrome. `ColorModeProvider` (`context/ColorModeContext`) owns the choice; read it with **`useColorMode()`** (`colorMode`, `preference`, `setPreference`, `toggleColorMode`) and toggle it from the left rail (`Navbar.tsx`). The persisted preference is `'light' | 'dark' | 'system'` and defaults to **`system`** — it keeps following the OS (via a `matchMedia` listener) until the toggle pins an explicit mode. The provider mirrors the resolved mode onto `<html>` as the `dark`/`light` class that Chakra's `_dark`/`_light` conditions select on (`.dark &`), plus native `color-scheme`; an inline script in **`index.html`** applies the same class before first paint, so its storage key must stay in sync with `useColorModeLocalStorage`. **The templates are deliberately unaffected** — they render to PDF with colors baked in, and the pages stay white paper on a dark canvas. In `theme.ts` the `_dark` half of every neutral token (`bg.*`, `fg.*`, `border.*`, the `gray` colorPalette, `app.*`) points at the **`zinc`** ramp, not `gray`: slate is crisp as light chrome but reads as a blue cast across large dark surfaces. Those same slots are also re-pitched into a ladder — rail (950) → editor panel & PDF canvas (900) → panels (800) → hover (700) → emphasized (600) — because Chakra's stock dark values map both `bg.subtle` (editor panel) and `bg.panel` (the cards on it) to the 950 step, which flattens the two levels and leaves hovers darker than what they sit on. The `_light` values there are Chakra's defaults, restated only because a semantic token must define every condition it takes part in — light mode is unchanged by any of this. Forms are **`react-hook-form`** (`useFieldArray` for repeatable entries like work highlights / skill keywords).
