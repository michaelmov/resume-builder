# The resume library

**`utils/resume-repository.ts` is the only module in the app that imports
`rxdb`.** Everything above it sees plain `Resume` / `ResumeSummary` /
`ResumeDocument` values and Promises — no `RxDocument`, no `RxCollection`, no
RxJS observable escapes it, so replacing the database means rewriting that one
file. Database `resumebuilder`, three collections:

| Collection   | Primary key | Holds                                                                                 |
| ------------ | ----------- | ------------------------------------------------------------------------------------- |
| `resumes`    | `id`        | `{ id, name, createdAt, updatedAt, resume, settings }` — one document per resume.     |
| `thumbnails` | `resumeId`  | `{ resumeId, stamp }` plus the page-1 PNG as the attachment `page1`.                  |
| `appmeta`    | `id`        | A single `{ id: 'app', defaultSettings }` — the look a newly created resume inherits. |

- **`resume` and `settings` are deliberately schema'd as open
  `{ type: 'object' }`.** RxDB only needs the top-level fields it queries, and
  keeping these opaque sidesteps three hazards in the model: date fields typed
  `Date | string`, an `accentId` whose `null` means "Auto", and `sectionOrder`,
  where absent (the default sections) and `[]` (no sections) mean different
  things. **Don't expand these into a full schema** — a strict schema would
  reject or normalize all three.
- **Anything written has to be plain JSON.** `localStorage`'s `JSON.stringify`
  used to flatten the model's real `Date` objects into ISO strings for free;
  RxDB refuses to structured-clone a `Date` at all (error DOC24). `toPlainJson`
  in the repository does that flattening explicitly on every write path — remove
  it and creating a resume fails outright.
- **`updatedAt` is an indexed number, so its schema carries
  `minimum`/`maximum`/`multipleOf`.** RxDB throws at collection creation without
  all three.
- **There is no first-run seeding and no migration.** A new browser gets an
  empty list and the list's own empty state. Clicking "New resume" is the only
  thing that produces sample content (`createResume` → `sampleResume()`).
- **Writes throw `ResumeStorageError`.** Everything auto-saves with no Save
  button, so a silently dropped write is invisible until the user reloads and
  finds their work gone. `ResumeLibraryProvider` catches it into `saveError`,
  which `SaveErrorBanner` (rendered on both pages) surfaces. Quota now arrives
  asynchronously wrapped in an `RxError`, so `isQuotaError` walks the
  `cause`/`parameters` chain rather than checking the error it was handed.
- **Thumbnails are a separate collection on purpose.** Capturing one mid-edit
  would otherwise be a write to the very document the editor is auto-saving,
  bumping its revision and firing a change event back at the screen that
  produced it. The cost is that `deleteResume` has to clear the thumbnail
  document itself — RxDB only drops attachments belonging to the document being
  removed. See [thumbnails.md](thumbnails.md).
- **`context/ResumeLibraryContext`** sits above the router. It opens the
  database, subscribes to the resume list, and owns
  `createResume`/`duplicateResume`/`renameResume`/`deleteResume`/`saveResume`/`rememberSettings`
  — all now async. Read it with **`useResumeLibrary()`**. It renders **nothing
  until the database is open and the first list has arrived**, which is why no
  screen below it has to tell "still loading" from "no resumes". Because the
  list is a live subscription there is no manual state to keep in step, no
  `commitIndex`, no `resumesRef`, and no refresh-on-focus hack — a change made
  in another tab simply arrives. Resume _content_ is still not held here; the
  editor route loads the one document it shows.
- **Opening the database falls back to in-memory storage** when the browser
  refuses IndexedDB (private-mode Safari, some webviews). The session works and
  nothing persists, and `SaveErrorBanner` says so. That warning outlives any
  single write, so it stands in whenever there's no fresher failure.

## Testing

`src/utils/resume-repository.test.ts` runs against RxDB's own in-memory storage
(`initDatabase({ storage: 'memory' })`), which needs no IndexedDB shim and no
extra devDependency. **Don't add `fake-indexeddb`** — the Dexie adapter is
RxDB's code to test, not this project's.
