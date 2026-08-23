# Import / export

- **Export** (`Preview/ExportMenu.tsx`, and the list card's Download submenu):
  PDF (the live `usePDF` blob in the editor, a fresh `renderResumePdf` from the
  list), JSON (`utils/json-export.ts`), and ATS-plain-text
  (`utils/text-export.ts`). Both entry points name the file through
  `resumeExportFileName` (`utils/download.ts`) so they can't drift.
- **Import happens on the list only** — the editor has no import affordance, so
  a file can never overwrite the resume you have open. `useJsonImport.ts`'s
  `readResumeFile(file)` validates a JSON Resume file and returns
  `{ resume, meta, fileName }`, resolving `null` and exposing an `importError`
  (rather than throwing) when the file can't be read, parsed, or validated. It
  stops at "parsed" rather than committing, leaving the caller to decide what to
  do with the result; the list adds it as a new resume, named via
  `nameForImport`.
- **`ImportDialog.tsx`** commits as soon as a file parses. There is nothing to
  confirm, because importing only ever _adds_: a bad file costs nothing and a
  good one can be deleted from its card. The dropzone pins `acceptedFiles` to a
  stable empty array and lives _inside_ the dialog body: it imports on pick and
  must never retain a file, or re-picking one would be rejected as a duplicate
  instead of re-importing. The list also accepts a `.json` dropped anywhere on
  the grid.
- **`meta["resume-builder"]`** carries the app-only state through a round-trip:
  `sectionOrder`/`sectionTitles`/`sectionVisibility` plus the resume's `name`
  and `settings`. `toJsonResume(resume)` with no second argument still produces
  exactly what it did before names existed. `readResumeDocumentMeta` reads that
  block **defensively** and separately from `fromJsonResume` — it validates
  template/accent/margin ids against the live registries and drops `settings`
  wholesale if they don't resolve, so a stale block costs the settings, not the
  import. The zod schema keeps `meta` as `z.record(z.unknown())` for the same
  reason.
- **`utils/jsonresume.ts`** is the translation/validation layer between the
  internal `Resume` model and the standard [JSON Resume](https://jsonresume.org/)
  schema, used by both JSON export and import. The internal model deliberately
  diverges from the schema — `work`/`volunteer` `highlights` and `skills`
  `keywords` are `{ value }[]` (for react-hook-form), dates may be `Date`
  objects, and `isPresent`/`sectionVisibility`/`sectionOrder`/`sectionTitles`
  are app-only — so `toJsonResume` unwraps lists to `string[]`, normalizes dates
  to `YYYY-MM-DD`, drops `isPresent` in favor of omitting `endDate`, and tucks
  app state under `meta["resume-builder"]`. `fromJsonResume` reverses this and
  validates the input with a lenient **zod** schema (`jsonResumeSchema`),
  throwing a descriptive error for non-resume files. It tolerates both real JSON
  Resume files and this app's legacy exports. Covered by `jsonresume.test.ts`.
