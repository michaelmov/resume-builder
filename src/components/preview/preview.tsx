import { FC, useEffect, useState } from 'react';

import { Box } from '@chakra-ui/react';
import { usePDF } from '@react-pdf/renderer';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import { useResume } from '../../hooks/useResume';
import DuoTemplate from '../../resume-templates/duo';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const Preview: FC = () => {
  const { resume } = useResume();

  const template = <DuoTemplate resume={resume} />;
  const [instance, update] = usePDF({ document: template });
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  const blob = instance.blob;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  useEffect(() => {
    update(template);
  }, [resume]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      backgroundColor="gray.300"
      width="100%"
      height="100vh"
    >
      <Box shadow="xl">
        <Document file={blob} onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} />
        </Document>
      </Box>
      <p>
        Page {pageNumber} of {numPages}
      </p>
    </Box>
  );
};
