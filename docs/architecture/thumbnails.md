# Thumbnails

The list card shows a real PNG of page 1, stored as an RxDB attachment on the
`thumbnails` collection and stamped with the resume's `updatedAt`.
**`utils/thumbnails.ts` now holds only `renderPdfThumbnail`** — a pure PDF-blob
→ PNG-blob function with no storage concern; where the images are cached is the
repository's business.

- **The editor is the normal producer.** `Preview` snapshots its live `usePDF`
  blob once the PDF _and_ `updatedAt` have both been quiet for
  `THUMBNAIL_CAPTURE_DELAY_MS`. That wait is not cosmetic: `updatedAt` bumps the
  moment an edit saves while the blob catches up only after the render debounce,
  so capturing eagerly can stamp an older image with a newer time — which then
  reads as fresh and is never re-rendered.
- **The list is the fallback.** `ResumeThumbnail` paints a stale cached image
  immediately (it still shows the right resume) and re-renders via
  `utils/render-resume-pdf.tsx` only on a miss or a stamp mismatch — lazily
  behind an `IntersectionObserver` and serialized through a module-level queue,
  since rendering a PDF blocks the main thread in bursts.
- The four thumbnail functions in the repository
  (`getThumbnail`/`putThumbnail`/`deleteThumbnail`/`copyThumbnail`) **fail
  soft**, unlike every other write there: a broken image cache must never break
  the list, and losing one only costs a re-render.
- `PAGE_ASPECT_RATIO` is **A4** (595.28 × 841.89pt) because every template
  renders `<Page size="A4">`. Getting it wrong letterboxes or crops the
  thumbnail.
- pdf.js drives its render continuation with `requestAnimationFrame`, which
  Chrome pauses in a background tab — thumbnail renders stall there and resume
  when the tab is shown again. Expected, not a bug.
- `pdfjs.GlobalWorkerOptions.workerSrc` is set once in `utils/pdf-worker.ts`;
  both `Preview` and `thumbnails.ts` depend on it via `ensurePdfWorker()`.
  RxDB's Dexie storage uses no worker of its own, so `vite.config.ts` needs no
  worker configuration.

Why thumbnails live in their own collection rather than on the resume document
is covered in [storage.md](storage.md).
