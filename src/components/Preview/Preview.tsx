import { Box, IconButton, Flex } from '@chakra-ui/react';
import { usePDF } from '@react-pdf/renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { GoSidebarCollapse, GoSidebarExpand } from 'react-icons/go';
import { HiOutlineZoomIn, HiOutlineZoomOut } from 'react-icons/hi';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import { useResume } from '../../hooks/useResume';
import DuoTemplate from '../../templates/Duo';

import { PreviewNavBar } from './PreviewNavBar';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MAX_SCALE = 2;
const MIN_SCALE = 0.8;

export const Preview: FC<{
  isEditorCollapsed: boolean;
  onEditorCollapseChange: (isEditorCollapsed: boolean) => void;
}> = ({ isEditorCollapsed, onEditorCollapseChange }) => {
  const { resume } = useResume();

  const template = useMemo(() => <DuoTemplate resume={resume} />, [resume]);
  const [instance, update] = usePDF({ document: template });
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState<number>(1.4);

  const blob = instance.blob;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

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
      <PreviewNavBar resumeTemplate={template} />
      <Box position="absolute" left={-1}>
        <IconButton
          onClick={() => onEditorCollapseChange(!isEditorCollapsed)}
          variant="subtle"
          zIndex="overlay"
        >
          {isEditorCollapsed ? <GoSidebarCollapse /> : <GoSidebarExpand />}
        </IconButton>
      </Box>
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
      <Document
        file={blob}
        onLoadSuccess={onDocumentLoadSuccess}
        scale={scale}
        className="pdf-document"
      >
        {Array.from({ length: numPages ?? 0 }).map((_, index) => (
          <Box shadow="xl" key={`page-${index}`} margin="6">
            <Page key={index} pageNumber={index + 1} />
          </Box>
        ))}
      </Document>
    </Box>
  );
};
