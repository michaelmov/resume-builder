import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_SCALE = 1.4;
const MAX_SCALE = 2;
// Low enough that a page still fits a preview column squeezed by the editor
// sidebar at its 600px minimum on a laptop display — the fitted scale shares
// this floor, and a higher one would just let the page overflow again.
const MIN_SCALE = 0.4;
const SCALE_STEP = 0.1;

// Stepping by 0.1 accumulates float error (1.4 + 0.1 - 0.1 !== 1.4), so snap
// every step back to one decimal.
const clampScale = (value: number) =>
  Math.min(Math.max(Math.round(value * 10) / 10, MIN_SCALE), MAX_SCALE);

/**
 * The largest scale at which a page of `pageWidth` CSS pixels (its size at
 * scale 1) still fits `availableWidth`, never above the default zoom: the
 * preview shrinks to fit a narrow column and grows back as the column widens,
 * but doesn't magnify a resume past the size it opens at.
 *
 * Snapped *down* to 0.05 so dragging a window edge crosses a handful of
 * discrete scales instead of re-rendering the PDF on every pixel, and so
 * rounding can only ever leave slack rather than a sliver of overflow.
 */
const scaleToFit = (availableWidth: number, pageWidth: number) => {
  const snapped = Math.floor((availableWidth / pageWidth) * 20) / 20;
  return Math.min(Math.max(snapped, MIN_SCALE), DEFAULT_SCALE);
};

interface PreviewZoomOptions {
  /**
   * Horizontal chrome around a page inside the measured element (gutters,
   * borders) in pixels — width the page itself can't use.
   */
  frameWidth: number;
}

export interface PreviewZoom {
  /** Scale to hand `react-pdf`'s `Document`. */
  scale: number;
  /** Attach to the element the pages have to fit inside. */
  viewportRef: RefObject<HTMLDivElement | null>;
  /**
   * Pass as a page's `onLoadSuccess` to learn how wide a page is at scale 1.
   * One page is enough — a resume's pages are all the same size.
   */
  onPageLoad: (page: { originalWidth: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  /** Hand zoom back to the automatic fit. */
  resetZoom: () => void;
  /** Whether the scale is the automatic fit rather than a chosen zoom. */
  isFitted: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

/**
 * Zoom for the PDF preview, in two modes.
 *
 * By default the scale *fits the column*: it drops as the column narrows —
 * the editor sidebar holds a 600px floor, so the preview is what gives way on
 * a smaller display — and climbs back as it widens, stopping at the default
 * zoom rather than magnifying past it. The zoom buttons switch to an explicit
 * scale, which then holds even where it overflows, because the user asked for
 * it; `resetZoom` returns to fitting. Resetting to a fixed 1.4 instead would
 * put the page straight back over the edge of a narrow column.
 */
export const usePreviewZoom = ({
  frameWidth,
}: PreviewZoomOptions): PreviewZoom => {
  // `null` is the fitted mode; a number is a zoom the user picked.
  const [chosenScale, setChosenScale] = useState<number | null>(null);

  // Width the pages have to fit into, and their width at scale 1.
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState<number>();
  const [pageWidth, setPageWidth] = useState<number>();

  // `contentRect` is the content box, so the element's own padding is already
  // out of this number; only the per-page frame still has to come off. Callers
  // are expected to keep the element `overflow: scroll` so the scrollbar gutter
  // is always reserved and can't appear and disappear as the scale changes.
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setViewportWidth((prev) => (prev === width ? prev : width));
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const onPageLoad = useCallback(
    ({ originalWidth }: { originalWidth: number }) => {
      setPageWidth((prev) => (prev === originalWidth ? prev : originalWidth));
    },
    []
  );

  // Until both measurements are in, the default zoom is the best guess — and
  // it's what the preview has always opened at.
  const fitScale =
    viewportWidth && pageWidth
      ? scaleToFit(viewportWidth - frameWidth, pageWidth)
      : DEFAULT_SCALE;

  const scale = chosenScale ?? fitScale;

  // Stepping from `scale`, not from `chosenScale`, so the first click off the
  // fitted scale nudges what's on screen rather than jumping to a stale value.
  const zoomIn = useCallback(
    () => setChosenScale(clampScale(scale + SCALE_STEP)),
    [scale]
  );
  const zoomOut = useCallback(
    () => setChosenScale(clampScale(scale - SCALE_STEP)),
    [scale]
  );
  const resetZoom = useCallback(() => setChosenScale(null), []);

  return {
    scale,
    viewportRef,
    onPageLoad,
    zoomIn,
    zoomOut,
    resetZoom,
    isFitted: chosenScale === null,
    canZoomIn: scale < MAX_SCALE,
    canZoomOut: scale > MIN_SCALE,
  };
};
