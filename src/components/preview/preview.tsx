import { Box } from '@chakra-ui/react';
import { usePDF } from '@react-pdf/renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import { useResume } from '../../hooks/useResume';
import DuoTemplate from '../../resume-templates/duo';

import { PreviewNavBar } from './preview-nav-bar';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const Preview: FC = () => {
  const { resume } = useResume();

  const template = useMemo(() => <DuoTemplate resume={resume} />, [resume]);
  const [instance, update] = usePDF({ document: template });
  const [numPages, setNumPages] = useState<number>();

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
      <Document
        file={blob}
        onLoadSuccess={onDocumentLoadSuccess}
        scale={1.4}
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
