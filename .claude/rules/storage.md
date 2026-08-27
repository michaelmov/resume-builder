---
paths:
  - 'src/utils/resume-repository*.ts'
  - 'src/utils/thumbnails.ts'
  - 'src/utils/render-resume-pdf.tsx'
  - 'src/context/ResumeLibraryContext/**'
  - 'src/types/resume-library.ts'
  - 'src/components/ResumeList/**'
  - 'src/components/SaveErrorBanner.tsx'
---

# Storage layer (RxDB)

Read `docs/architecture/storage.md` before changing this layer. The
non-negotiables:

- **`utils/resume-repository.ts` is the only module allowed to import `rxdb`.**
  No `RxDocument`, `RxCollection`, or RxJS observable may escape it.
- **`resume` and `settings` stay open `{ type: 'object' }` schemas.** A strict
  schema would reject or normalize `Date | string` fields, `accentId: null`
  ("Auto"), and the absent-vs-`[]` distinction in `sectionOrder`.
- **Every write goes through `toPlainJson`.** RxDB refuses to
  structured-clone a `Date` (DOC24); removing it breaks resume creation.
- **A delete must purge, not tombstone.** `doc.remove()` is a soft delete that
  leaves the whole document in IndexedDB under `_deleted: true`, so both delete
  paths follow it with `purgeDeleted`. Don't drop that call, and don't swap it
  for `RxDBCleanupPlugin` — see `docs/architecture/storage.md` for why.
- **Writes throw `ResumeStorageError`** so `SaveErrorBanner` can surface them —
  there is no Save button, so a silently dropped write loses the user's work.
  The four thumbnail functions are the deliberate exception: they fail soft.
- **Don't add `fake-indexeddb`.** Tests run RxDB's own in-memory storage
  (`initDatabase({ storage: 'memory' })`).
