import { pdfjs } from 'react-pdf';

/**
 * pdf.js needs its worker script located before any document is parsed, and
 * both the preview (`react-pdf`'s `Document`) and the thumbnail renderer need
 * it. Configuring it in whichever component happens to load first is fragile,
 * so it lives here and every consumer imports this module.
 *
 * The assignment runs at module scope: ES modules are evaluated once per graph,
 * so repeated imports are already idempotent and no extra guard is needed.
 * `ensurePdfWorker()` is exported as an explicit no-op purely so callers can
 * make the dependency visible — a bare side-effect import is easy to mistake
 * for dead code and "helpfully" delete.
 */
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const ensurePdfWorker = () => {
  // Intentionally empty — importing this module is what does the work.
};
