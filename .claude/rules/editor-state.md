---
paths:
  - 'src/context/ResumeContext/**'
  - 'src/components/Editor/**'
  - 'src/hooks/useAutoCommitSection.ts'
  - 'src/hooks/useResume.ts'
  - 'src/pages/EditorPage.tsx'
---

# Editor state & auto-save

Read `docs/architecture/editor-state.md` before changing how the editor holds or
commits state. The non-negotiables:

- **The editor reads its resume document once and never subscribes to it.**
  Subscribing feeds the editor's own auto-save back as a change event, and the
  failure mode is silently clobbering what someone is typing.
- **The save effect skips its first run** and calls `saveResume` through a ref,
  never as a dependency. Opening a resume must not count as editing it.
- **`useAutoCommitSection`'s reference-identity guard** is what stops a
  section's own commit echoing back over live typing. Keep the reducer storing
  the exact reference it is handed.
- **`EditorPage` has three document states**, not two: `undefined` is loading,
  `null` is genuinely missing. Treating "not loaded yet" as "not found" bounces
  every visit back to the list.
- **Route persisted section order through `resolveSectionOrder()`** and read
  titles through `getSectionTitle(type, resume.sectionTitles)` — never
  `SECTION_TITLES[type]` directly. See `docs/architecture/sections.md`.
