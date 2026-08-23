import { pdfjs } from 'react-pdf';

import { ensurePdfWorker } from './pdf-worker';

/**
 * Renders a resume PDF down to the PNG the list card shows.
 *
 * Only the rendering lives here. Where those images are cached is the
 * repository's business (`resume-repository.ts`), which keeps this module a
 * pure function of a PDF blob and free of any storage concern.
 */

const DEFAULT_WIDTH = 400;

// Retina sharpness without quadratic memory growth: a 3x phone would render a
// 1200px-wide bitmap per card for an image displayed at 400.
const MAX_PIXEL_RATIO = 2;

/** Render page 1 of a PDF blob to a PNG blob, `width` CSS px wide. */
export const renderPdfThumbnail = async (
  pdf: Blob,
  width: number = DEFAULT_WIDTH
): Promise<Blob> => {
  ensurePdfWorker();

  // pdf.js may transfer this buffer to its worker and detach it here; that's
  // harmless because `arrayBuffer()` already handed us a private copy.
  const data = new Uint8Array(await pdf.arrayBuffer());
  const pdfDoc = await pdfjs.getDocument({ data }).promise;

  try {
    const page = await pdfDoc.getPage(1);

    // Scale 1 is the page's natural size in points, which varies by template
    // and paper size, so the target width has to be derived from it rather than
    // assumed.
    const natural = page.getViewport({ scale: 1 });
    const pixelRatio = Math.min(window.devicePixelRatio ?? 1, MAX_PIXEL_RATIO);
    const viewport = page.getViewport({
      scale: (width / natural.width) * pixelRatio,
    });

    // A detached element, never appended to the document. `OffscreenCanvas`
    // would work too, but pdf.js types `canvasContext` as a
    // `CanvasRenderingContext2D` and its blob encoder is `convertToBlob`, so
    // supporting it means a second code path for no gain on the main thread.
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get a 2D canvas context for the thumbnail');
    }

    await page.render({ canvasContext: context, viewport }).promise;

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not encode the thumbnail canvas as a PNG'));
        }
      }, 'image/png');
    });
  } finally {
    // pdf.js holds the parsed document on both threads until it's destroyed;
    // without this a re-rendering list leaks one document per card.
    await pdfDoc.destroy();
  }
};
