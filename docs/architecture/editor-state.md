# State: single source of truth + auto-save

This is the most important pattern to understand before editing the Editor.

- **`context/ResumeContext`** holds the committed `Resume` in a `useReducer`
  store — the single source of truth for the **one** resume being edited. It
  lives **under the `/editor/:id` route**, keyed by that id and handed a
  `ResumeDocument` the route already read, so a keystroke rewrites one document
  instead of the whole library, and switching resumes remounts the store rather
  than reconciling one reducer state onto another. **The editor reads its
  document once and never subscribes to it.** Subscribing would send the
  editor's own auto-save straight back as a change event, putting a guard on the
  typing path whose failure mode is silently clobbering what someone is typing.
  The trade is that two tabs on the _same_ resume stay stale; the list is
  reactive, so names and timestamps still sync across tabs. Access it via
  **`useResume()`** (never `useContext` directly): `resume` and `settings` plus
  `updateResume`, `updateSettings`, `updateSectionData(section, data)`,
  `updateSectionOrder`, and `updateSectionTitles`. The reducer
  (`ResumeReducer.ts`) has four actions: `updateResume`, `updateSection`
  (`{ section, data }` — sets `state[section]`), `updateSectionOrder`, and
  `updateSectionTitles`.

- **The save effect skips its first run.** Merely opening a resume must not
  count as editing it — the list sorts by most recently edited, so a save on
  mount would reshuffle it on every visit. It calls `saveResume` through a ref
  rather than naming it as a dependency: the effect must fire for edits only,
  and coupling it to the identity of a function that itself writes storage is
  how it would end up retriggering itself.

- **`EditorPage` tracks its document as three states, not two.** Reading a
  resume is asynchronous, so "no document yet" is the normal first render —
  treating that as "not found" the way a synchronous read could would bounce
  every visit straight back to the list. `undefined` is loading, `null` is
  genuinely missing. A document that loads while its summary is still absent is
  the list subscription lagging a just-created resume, so that waits rather than
  redirecting.

- **Edits auto-save; there is no Save button.** Each section owns a local
  `react-hook-form`, and **`useAutoCommitSection`** commits its values to the
  store a beat after typing stops and on blur — so the flow is **section form →
  ResumeContext → the `resumes` document → re-render PDF**. The hook re-seeds
  the form when its committed `value` changes externally (a JSON import), but a
  reference-identity guard (the reducer stores the exact reference it's handed)
  skips the echo of the section's own commit so live typing is never clobbered.
  Adding, reordering, and renaming sections commit straight to the store from
  `Editor.tsx` (`updateSectionOrder`/`updateSectionTitles`). Removing a section
  is a permanent delete — it clears the section's data and is gated behind a
  confirmation popover on the trash button.

- **`OpenSectionContext`** makes the sections behave like an accordion (only one
  open at a time); `useSectionOpenState(id)` falls back to local state when used
  outside the provider, and `useOpenSection()` imperatively expands a section
  (used to auto-open a freshly added one). **`SectionActionsContext`** exposes
  `removeSection(id)` to the section header's trash button.

- **`OpenSubsectionContext`** is the same accordion one level down: within a
  section, only one entry (`EditorSubsection` — a job, a school, a skill) is
  expanded at a time, and all start collapsed. `Editor.tsx` wraps **each
  section** in its own `OpenSubsectionProvider`, so the scope is per section
  (every section remembers its own open entry) and section components — which
  render `EditorSection` themselves — still sit inside the provider. Entries are
  keyed by their `useFieldArray` `field.id`, passed as `EditorSubsection`'s
  `id`. Because that id is minted inside `append()`, an "Add" handler expands
  the new entry via **`useOpenAppendedSubsection(fields)`**: call the returned
  function right after `append` and the next id to appear at the end of `fields`
  opens (otherwise a fresh, untitled entry would show as a blank collapsed row).
  For the same reason, subsection `title`/`subtitle` come from `watch(...)`
  rather than the `fields` snapshot, which only refreshes on
  append/remove/move/reset and would otherwise show a stale name on a collapsed
  entry.
