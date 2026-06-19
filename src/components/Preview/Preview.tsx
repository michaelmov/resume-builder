import { Box, IconButton, Flex } from '@chakra-ui/react';
import { usePDF } from '@react-pdf/renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HiOutlineZoomIn, HiOutlineZoomOut } from 'react-icons/hi';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import { useAccentLocalStorage } from '../../hooks/useAccentLocalStorage';
import { useResume } from '../../hooks/useResume';
import { useTemplateLocalStorage } from '../../hooks/useTemplateLocalStorage';
import { DEFAULT_TEMPLATE_ID, templates } from '../../templates';
import { getAccent } from '../../templates/accents';

import { PreviewNavBar } from './PreviewNavBar';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MAX_SCALE = 2;
const MIN_SCALE = 0.8;

export const Preview: FC<{
  isEditorCollapsed: boolean;
  onEditorCollapseChange: (isEditorCollapsed: boolean) => void;
}> = ({ isEditorCollapsed, onEditorCollapseChange }) => {
  const { resume } = useResume();
  const { getTemplateId, saveTemplateId } = useTemplateLocalStorage();
  const { getAccentId, saveAccentId } = useAccentLocalStorage();

  const [templateId, setTemplateId] = useState<string>(
    () => getTemplateId() ?? DEFAULT_TEMPLATE_ID
  );
  const [accentId, setAccentId] = useState<string | null>(() => getAccentId());

  useEffect(() => {
    saveTemplateId(templateId);
  }, [templateId, saveTemplateId]);

  useEffect(() => {
    saveAccentId(accentId);
  }, [accentId, saveAccentId]);

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

  const SelectedTemplate = activeTemplate.Component;

  const template = useMemo(
    () => <SelectedTemplate resume={resume} accent={accent} />,
    [SelectedTemplate, resume, accent]
  );
  const [instance, update] = usePDF({ document: template });
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState<number>(1.4);

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

  useEffect(() => {
    update(template);
  }, [resume, template, update]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      backgroundColor="gray.400"
      width="100%"
      height="100%"
      overflow="scroll"
      padding="20"
      zIndex={0}
    >
      <PreviewNavBar
        resumeTemplate={template}
        selectedTemplateId={templateId}
        onTemplateChange={setTemplateId}
        selectedAccentId={accentId}
        resolvedAccentId={accent.id}
        onAccentChange={setAccentId}
        isEditorCollapsed={isEditorCollapsed}
        onEditorCollapseChange={onEditorCollapseChange}
      />
      <Flex
        position="absolute"
        right={0}
        bottom={0}
        direction="column"
        gap={2}
        margin={4}
        zIndex="overlay"
      >
        <IconButton
          onClick={() => setScale(Math.min(scale + 0.1, MAX_SCALE))}
          variant="subtle"
          rounded="full"
          disabled={scale === MAX_SCALE}
        >
          <HiOutlineZoomIn />
        </IconButton>
        <IconButton
          onClick={() => setScale(Math.max(scale - 0.1, MIN_SCALE))}
          variant="subtle"
          rounded="full"
          disabled={scale === MIN_SCALE}
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
            <Box shadow="xl" key={`page-${index}`} margin="6">
              <Page
                key={index}
                pageNumber={index + 1}
                onRenderSuccess={handlePageRenderSuccess}
              />
            </Box>
          ))}
        </Document>
      </Box>
    </Box>
  );
};
