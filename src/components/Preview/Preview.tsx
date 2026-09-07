import { Box, IconButton, Flex } from '@chakra-ui/react';
import { usePDF } from '@react-pdf/renderer';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  HiOutlineRefresh,
  HiOutlineZoomIn,
  HiOutlineZoomOut,
} from 'react-icons/hi';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import { usePreviewZoom } from '../../hooks/usePreviewZoom';
import { useResume } from '../../hooks/useResume';
import { templates } from '../../templates';
import { getAccent } from '../../templates/accents';
import { getMarginScale } from '../../templates/margins';
import { ResumeSummary } from '../../types/resume-library';
import { ensurePdfWorker } from '../../utils/pdf-worker';
import { putThumbnail } from '../../utils/resume-repository';
import { renderPdfThumbnail } from '../../utils/thumbnails';

import { PreviewNavBar } from './PreviewNavBar';

ensurePdfWorker();

// Gutter and hairline around each rendered page. Held in pixels rather than as
// spacing tokens because fitting the page to the column means subtracting them
// from the measured width — a token would have to be resolved back to px here.
const PAGE_GUTTER_PX = 24;
// A phone can't spare 24px a side. Every pixel taken off the frame goes
// straight into the fitted scale, which is already down near 0.5 there.
const MOBILE_PAGE_GUTTER_PX = 8;
const PAGE_BORDER_PX = 1;
const pageFramePx = (gutterPx: number) => 2 * (gutterPx + PAGE_BORDER_PX);

// Coalesce bursts of edits (auto-save now fires on blur / after a typing pause,
// and several sections can commit in quick succession) into one PDF
// regeneration instead of thrashing the renderer on every keystroke's commit.
const RENDER_DEBOUNCE_MS = 200;

// How long the PDF and the resume's timestamp must both stay still before the
// list thumbnail is captured. Comfortably longer than the render debounce, so a
// burst of typing produces one capture rather than one per pause.
const THUMBNAIL_CAPTURE_DELAY_MS = 1200;

// The zoom controls float over the preview canvas, which is itself a light
// neutral — a tinted `subtle` fill would sink into it, so they get their own
// panel surface, hairline, and lift instead.
const floatingControlProps = {
  variant: 'outline',
  rounded: 'full',
  bg: 'bg.panel',
  color: 'fg.muted',
  borderColor: 'border',
  shadow: 'sm',
  _hover: { bg: 'bg.muted', color: 'fg' },
} as const;

interface PreviewProps {
  /** Index entry for the open resume — its name and, for the thumbnail, its stamp. */
  summary: ResumeSummary;
  onRename: (name: string) => void;
  /** Open the title in edit mode — a resume that was just created. */
  focusName: boolean;
  isEditorCollapsed: boolean;
  onEditorCollapseChange: (isEditorCollapsed: boolean) => void;
  /** Phone layout: a compact header and a tighter page frame. */
  isMobile?: boolean;
  /**
   * CSS length of viewport hidden at the bottom by the editor sheet resting at
   * its peek. The sheet is `position: fixed`, so nothing here reflows around
   * it — this scroll container has to reserve the space itself, and the
   * floating zoom controls have to sit above it.
   */
  bottomInset?: string;
}

export const Preview = ({
  summary,
  onRename,
  focusName,
  isEditorCollapsed,
  onEditorCollapseChange,
  isMobile = false,
  bottomInset = '0px',
}: PreviewProps) => {
  const pageGutterPx = isMobile ? MOBILE_PAGE_GUTTER_PX : PAGE_GUTTER_PX;
  // Template, accent, and margin are stored on the resume itself, so switching
  // resumes restores the look each one was last rendered with.
  const { resume, settings, updateSettings } = useResume();
  const { templateId, accentId, marginId } = settings;

  const setTemplateId = useCallback(
    (id: string) => updateSettings({ templateId: id }),
    [updateSettings]
  );
  const setAccentId = useCallback(
    (id: string | null) => updateSettings({ accentId: id }),
    [updateSettings]
  );
  const setMarginId = useCallback(
    (id: string) => updateSettings({ marginId: id }),
    [updateSettings]
  );

  const activeTemplate = useMemo(
    () =>
      templates.find((template) => template.id === templateId) ?? templates[0],
    [templateId]
  );

  // "Auto" (accentId === null) falls back to the active template's signature accent.
  const accent = useMemo(
    () => getAccent(accentId ?? activeTemplate.defaultAccentId),
    [accentId, activeTemplate]
  );

  // Monochrome templates have no secondary color, so the accent picker is
  // disabled while they're active.
  const supportsAccent = activeTemplate.supportsAccent !== false;

  const SelectedTemplate = activeTemplate.Component;

  const marginScale = getMarginScale(marginId);

  const template = useMemo(
    () => (
      <SelectedTemplate
        resume={resume}
        accent={accent}
        marginScale={marginScale}
      />
    ),
    [SelectedTemplate, resume, accent, marginScale]
  );
  const [instance, update] = usePDF({ document: template });
  const [numPages, setNumPages] = useState<number>();

  // Pages shrink to fit the preview column, which the fixed-width editor
  // sidebar can leave narrow, until the user picks a zoom of their own.
  const {
    scale,
    viewportRef,
    onPageLoad,
    zoomIn,
    zoomOut,
    resetZoom,
    isFitted,
    canZoomIn,
    canZoomOut,
  } = usePreviewZoom({ frameWidth: pageFramePx(pageGutterPx) });

  // Holding the rendered document height while the next PDF regenerates keeps
  // the scroll container from collapsing (and resetting the scroll position)
  // every time an edit is saved.
  const documentRef = useRef<HTMLDivElement>(null);
  const renderedPageCountRef = useRef(0);
  const [minDocHeight, setMinDocHeight] = useState<number>();

  const blob = instance.blob;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    renderedPageCountRef.current = 0;
    setNumPages(numPages);
  }

  const handlePageRenderSuccess = useCallback(() => {
    renderedPageCountRef.current += 1;
    // Only lock the height once every page of the freshly generated PDF has
    // rendered, otherwise a partial (shorter) height could clamp the scroll.
    if (numPages && renderedPageCountRef.current >= numPages) {
      const height = documentRef.current?.offsetHeight;
      if (height) {
        setMinDocHeight((prev) => (prev === height ? prev : height));
      }
    }
  }, [numPages]);

  // `template` is memoized on `resume` (plus accent/margin/template choice), so
  // it already changes whenever any of those do; debouncing the regeneration
  // keeps rapid auto-saves from re-rendering the PDF on every commit.
  useEffect(() => {
    const handle = setTimeout(() => update(template), RENDER_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [template, update]);

  // Snapshot page 1 for the resume list. The editor already holds a rendered
  // PDF, so capturing here means the list mostly displays stored images instead
  // of re-rendering every resume on arrival.
  //
  // The wait is deliberately long: `updatedAt` bumps the moment an edit is
  // saved, while the blob catches up only after the debounced regeneration, so
  // capturing eagerly risks stamping an older image with a newer time — which
  // would read as fresh and never be re-rendered. Waiting until both have been
  // quiet closes that window.
  useEffect(() => {
    if (!blob) return;

    let cancelled = false;
    const handle = setTimeout(async () => {
      const png = await renderPdfThumbnail(blob).catch((error) => {
        console.error('Could not render the resume thumbnail:', error);
        return null;
      });
      if (png && !cancelled) {
        await putThumbnail(summary.id, { png, stamp: summary.updatedAt });
      }
    }, THUMBNAIL_CAPTURE_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [blob, summary.id, summary.updatedAt]);

  return (
    <Box
      ref={viewportRef}
      display="flex"
      flexDirection="column"
      alignItems="center"
      backgroundColor="app.canvas"
      width="100%"
      height="100%"
      overflow="scroll"
      // The header is absolutely positioned, so the top padding is what keeps
      // the first page clear of it. The bottom padding does the same for the
      // editor sheet, which is fixed and equally outside the flow.
      padding={isMobile ? 3 : 20}
      paddingTop={isMobile ? '64px' : 20}
      paddingBottom={isMobile ? `calc(${bottomInset} + 16px)` : 20}
      zIndex={0}
    >
      <PreviewNavBar
        isMobile={isMobile}
        resumeTemplate={template}
        resumeName={summary.name}
        onRename={onRename}
        focusName={focusName}
        selectedTemplateId={templateId}
        onTemplateChange={setTemplateId}
        selectedAccentId={accentId}
        resolvedAccentId={accent.id}
        onAccentChange={setAccentId}
        accentDisabled={!supportsAccent}
        selectedMarginId={marginId}
        onMarginChange={setMarginId}
        isEditorCollapsed={isEditorCollapsed}
        onEditorCollapseChange={onEditorCollapseChange}
      />
      <Flex
        position="absolute"
        right={0}
        bottom={bottomInset}
        direction="column"
        gap={2}
        margin={4}
        // On mobile these have to sit in a narrow band: above react-pdf's text
        // layer, which would otherwise swallow the clicks, but below the editor
        // sheet, so zoom buttons never float over the form being filled in.
        // `overlay` clears the sheet's z-index and would do exactly that.
        zIndex={isMobile ? 10 : 'overlay'}
      >
        {/* The stack is anchored to the bottom, so the reset button sits on top
            to keep the zoom buttons from shifting as it appears/disappears. */}
        {!isFitted && (
          <IconButton
            aria-label="Fit to width"
            title="Fit to width"
            onClick={resetZoom}
            {...floatingControlProps}
          >
            <HiOutlineRefresh />
          </IconButton>
        )}
        <IconButton
          aria-label="Zoom in"
          title="Zoom in"
          onClick={zoomIn}
          {...floatingControlProps}
          disabled={!canZoomIn}
        >
          <HiOutlineZoomIn />
        </IconButton>
        <IconButton
          aria-label="Zoom out"
          title="Zoom out"
          onClick={zoomOut}
          {...floatingControlProps}
          disabled={!canZoomOut}
        >
          <HiOutlineZoomOut />
        </IconButton>
      </Flex>
      <Box minHeight={minDocHeight ? `${minDocHeight}px` : undefined}>
        <Document
          file={blob}
          inputRef={documentRef}
          onLoadSuccess={onDocumentLoadSuccess}
          scale={scale}
          className="pdf-document"
        >
          {Array.from({ length: numPages ?? 0 }).map((_, index) => (
            <Box
              shadow="lg"
              borderWidth={`${PAGE_BORDER_PX}px`}
              borderColor="border.emphasized"
              key={`page-${index}`}
              margin={`${pageGutterPx}px`}
            >
              <Page
                key={index}
                pageNumber={index + 1}
                onLoadSuccess={onPageLoad}
                onRenderSuccess={handlePageRenderSuccess}
              />
            </Box>
          ))}
        </Document>
      </Box>
    </Box>
  );
};
