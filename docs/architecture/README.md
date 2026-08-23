# Architecture

A client-only React 18 + TypeScript SPA (Vite) that builds resumes with a live
PDF preview. There is **no backend**: all data lives in an **RxDB** database in
the browser (IndexedDB, via the Dexie storage), and the app is deployed as
static files to GitHub Pages (`base: '/resume-builder/'` in `vite.config.ts`).
The only thing still in `localStorage` is the colour-mode preference, which has
to be readable synchronously before first paint.

There are two pages, routed in `App.tsx` (`main.tsx` mounts a `HashRouter`,
since GitHub Pages can't rewrite paths):

- **`/` — `pages/ResumeListPage`**: a card grid of every saved resume, each
  showing a real thumbnail of its first PDF page.
- **`/editor/:id` — `pages/EditorPage`**: the two-panel editor — a left
  **Editor** panel (forms) that can slide/collapse, and a right **Preview**
  panel (rendered PDF).

Anything else redirects to `/`. So does `/editor/:id` for an id that isn't in
the library (a stale bookmark, a resume deleted in another tab), passing
`state.missingResume` so the list can explain the bounce. The `Navbar` left rail
is on both pages and takes its contextual top slot as `children`.

The data model follows the [JSON Resume](https://jsonresume.org/) schema, so
resumes can be imported/exported as standard JSON.

## Topics

| Document                               | Covers                                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| [storage.md](storage.md)               | The resume library — RxDB collections, schemas, `ResumeLibraryContext`.                 |
| [editor-state.md](editor-state.md)     | `ResumeContext`, auto-save, the accordion contexts. **Read before editing the Editor.** |
| [sections.md](sections.md)             | The section machinery, `sectionOrder`/`sectionTitles`, adding a section.                |
| [templates.md](templates.md)           | Templates, accents, margins, the PDF preview.                                           |
| [thumbnails.md](thumbnails.md)         | How list thumbnails are produced, cached, and invalidated.                              |
| [import-export.md](import-export.md)   | PDF/JSON/text export, JSON Resume import, the `meta` round-trip.                        |
| [ui-and-theming.md](ui-and-theming.md) | Chakra v3 tokens, the colour ramps, light/dark mode.                                    |
