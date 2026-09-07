# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Commands

```bash
npm run dev            # Vite dev server (auto-opens browser); dev:host exposes on LAN
npm run build          # typecheck + production Vite build → dist/
npm run preview        # Serve the production build locally
npm run typecheck      # tsc --noEmit over src/ (no build output)
npm run lint           # ESLint over .ts/.tsx/.js/.jsx (lint:fix to autofix, lint:check for 0 warnings)
npm run format         # Prettier write (format:check to verify)
npm run test           # Vitest (run once); test:watch for watch mode
npm run deploy         # Build + publish dist/ to GitHub Pages (gh-pages branch)
```

Node is pinned to `20.19.0` (`.nvmrc`). A Husky pre-commit hook runs
`npm run format:check && npm run lint && npm run typecheck && npm test` —
commits fail on unformatted files, lint errors, type errors, or failing tests
(each stage short-circuits the next). CI runs the same four as separate jobs.

Claude Code hooks in `.claude/settings.json` mirror that gate during a session:
edited files are Prettier-formatted on write, and the four checks run when a
turn ends — but only if source was actually touched. A failure is reported back
rather than handed over. See `.claude/hooks/`.

**Code style is not documented here — the tools are the source of truth.**
Prettier (`.prettierrc`) owns formatting; ESLint (`eslint.config.js`) owns
everything else, including import order and the ban on `React.FC`. Both are
blocking, so `npm run lint:fix` and `npm run format` settle any question about
style faster than prose could.

## What this is

A client-only React 18 + TypeScript SPA (Vite). **There is no backend**: all
data lives in an **RxDB** database in the browser (IndexedDB via Dexie), and the
app ships as static files to GitHub Pages. Two routes — `/` (the resume list)
and `/editor/:id` (forms on the left, live PDF preview on the right). The data
model follows the [JSON Resume](https://jsonresume.org/) schema.

## Rules that hold everywhere

- **Only `utils/resume-repository.ts` may import `rxdb`.** Everything above it
  sees plain values and Promises.
- **Anything written to the database must be plain JSON** — RxDB refuses to
  structured-clone a `Date`.
- **Route persisted section order through `resolveSectionOrder()`** and read
  section titles through `getSectionTitle(type, resume.sectionTitles)`, never
  `SECTION_TITLES[type]`.
- **Style with semantic Chakra tokens** (`bg.panel`, `fg.muted`, `border`,
  `brand.solid`) rather than raw steps like `gray.200`, so each component works
  in both color modes.
- **Before editing any template in `src/templates/`, use the
  `resume-pdf-templates` skill.** Templates carry pagination rules that are
  invisible in review and easy to undo by accident.
- **Edits auto-save; there is no Save button anywhere in the app.** A silently
  dropped write loses the user's work.

## Testing

Vitest (config in `vite.config.ts` under `test`) in the **`node` environment** —
no jsdom, no setup file, no component/UI test setup. Coverage is the pure
utilities plus the storage layer, which runs against RxDB's own in-memory
storage (`initDatabase({ storage: 'memory' })`). **Don't add `fake-indexeddb`** —
the Dexie adapter is RxDB's code to test, not this project's.

## Architecture docs

Read the relevant document before working in an area — each one records why the
code is shaped the way it is, and most of it is not recoverable from the code.

| Read                                                                       | Before working on                                     |
| -------------------------------------------------------------------------- | ----------------------------------------------------- |
| [docs/architecture/README.md](docs/architecture/README.md)                 | Anything — the overview and index.                    |
| [docs/architecture/storage.md](docs/architecture/storage.md)               | The repository, RxDB schemas, `ResumeLibraryContext`. |
| [docs/architecture/editor-state.md](docs/architecture/editor-state.md)     | The Editor, `ResumeContext`, auto-save.               |
| [docs/architecture/sections.md](docs/architecture/sections.md)             | The section model, or adding a section type.          |
| [docs/architecture/templates.md](docs/architecture/templates.md)           | Templates, accents, margins, `Preview`.               |
| [docs/architecture/thumbnails.md](docs/architecture/thumbnails.md)         | List thumbnails and their caching.                    |
| [docs/architecture/import-export.md](docs/architecture/import-export.md)   | JSON/PDF/text export and JSON Resume import.          |
| [docs/architecture/ui-and-theming.md](docs/architecture/ui-and-theming.md) | The theme, colour ramps, light/dark mode.             |

Path-scoped rules in `.claude/rules/` restate the hard constraints for each area
and load automatically when you open a matching file.
