import { FC, useEffect, useState } from 'react';

import { Box, Button, Grid, GridItem, Icon } from '@chakra-ui/react';
import { PDFDownloadLink, usePDF } from '@react-pdf/renderer';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { HiDownload } from 'react-icons/hi';

import { useResume } from '../../hooks/useResume';
import DuoTemplate from '../../resume-templates/duo';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const Preview: FC = () => {
  const { resume } = useResume();

  const template = <DuoTemplate resume={resume} />;
  const [instance, update] = usePDF({ document: template });
  const [numPages, setNumPages] = useState<number>();

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
      backgroundColor="gray.400"
      width="100%"
      height="100%"
      overflow="scroll"
      padding="20"
      zIndex={0}
    >
      <Box
        as="header"
        position="absolute"
        display="flex"
        alignItems="center"
        top={0}
        width="100%"
        height="60px"
        bgColor="gray.600"
        zIndex={900}
        px={4}
        boxShadow="md"
      >
        <Grid templateColumns="1fr 1fr 1fr" width="100%">
          <GridItem />
          <GridItem />
          <GridItem display="flex" justifyContent="end">
            <PDFDownloadLink document={template}>
              <Button size="sm" colorPalette="gray" variant="subtle">
                <Icon as={HiDownload} boxSize={5} />
                Download PDF
              </Button>
            </PDFDownloadLink>
          </GridItem>
        </Grid>
      </Box>
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
