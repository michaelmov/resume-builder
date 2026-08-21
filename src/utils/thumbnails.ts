import { pdfjs } from 'react-pdf';

import { ensurePdfWorker } from './pdf-worker';

/**
 * Thumbnail cache for the resume list screen: a PNG of page 1 per resume,
 * persisted in IndexedDB (blobs are far too big for `localStorage`, where the
 * rest of the app's state lives) and stamped with the resume's `updatedAt` so
 * a caller can tell a stale image from a current one.
 *
 * Every function here fails soft. IndexedDB is unavailable in private-mode
 * Safari, can be blocked by browser settings or another tab mid-upgrade, and
 * can abort a write on quota — none of which is a reason for the list screen to
 * break. Reads degrade to "no cached thumbnail" and writes are dropped.
 */

const DB_NAME = 'resume-builder';
const STORE_NAME = 'thumbnails';
const DB_VERSION = 1;

export interface ThumbnailRecord {
  /** PNG image of page 1. */
  png: Blob;
  /** The resume's `updatedAt` (epoch ms) this image was rendered from. */
  stamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

// Opened lazily so merely importing this module never touches IndexedDB, and
// memoized so concurrent cards share one connection instead of racing opens.
const openDatabase = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  const pending = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser'));
      return;
    }

    // Reaching for `indexedDB` can itself throw (SecurityError in a sandboxed
    // iframe); the executor turns that into a rejection.
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // No keyPath: records are plain `{ png, stamp }` values filed under the
        // resume id as an out-of-line key, so the id isn't duplicated inside.
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    // Another tab holding an older connection open blocks the upgrade; give up
    // rather than hang the caller forever.
    request.onblocked = () =>
      reject(new Error('IndexedDB upgrade blocked by another tab'));
  });

  dbPromise = pending;

  // Don't memoize a failure permanently — a block or a transient error should
  // be retried on the next call, but only clear the slot if nothing newer has
  // already replaced it.
  pending.catch(() => {
    if (dbPromise === pending) dbPromise = null;
  });

  return pending;
};

// A request can succeed while its transaction later aborts (quota, for
// instance), so completion — not `onsuccess` — is what settles the promise.
const withStore = async <T>(
  // Spelled out rather than using the lib's `IDBTransactionMode`, which is a
  // type-only global and so trips the `no-undef` lint rule.
  mode: 'readonly' | 'readwrite',
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = run(transaction.objectStore(STORE_NAME));

    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
};

export const getThumbnail = async (
  id: string
): Promise<ThumbnailRecord | undefined> => {
  try {
    // `IDBObjectStore.get` is typed `IDBRequest<any>`; the cast is what gives
    // the caller a real type back.
    return await withStore(
      'readonly',
      (store) => store.get(id) as IDBRequest<ThumbnailRecord | undefined>
    );
  } catch (error) {
    console.error('Error reading cached thumbnail:', error);
    return undefined;
  }
};

export const putThumbnail = async (
  id: string,
  record: ThumbnailRecord
): Promise<void> => {
  try {
    await withStore('readwrite', (store) => store.put(record, id));
  } catch (error) {
    console.error('Error caching thumbnail:', error);
  }
};

export const deleteThumbnail = async (id: string): Promise<void> => {
  try {
    await withStore('readwrite', (store) => store.delete(id));
  } catch (error) {
    console.error('Error deleting cached thumbnail:', error);
  }
};

/**
 * Files the source resume's image under a second id, so a duplicated resume
 * shows its card immediately instead of blank. Composed from the read and write
 * above, which already swallow their own failures; IndexedDB structured-clones
 * the blob on write, so the two entries are independent afterwards.
 */
export const copyThumbnail = async (
  fromId: string,
  toId: string
): Promise<void> => {
  const record = await getThumbnail(fromId);
  if (!record) return;
  await putThumbnail(toId, record);
};

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
