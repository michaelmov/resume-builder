import {
  Box,
  Button,
  Icon,
  Grid,
  GridItem,
  NumberInput,
} from '@chakra-ui/react';
import { FC, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HiDownload } from 'react-icons/hi';
import { BasicTemplate } from '../../resume-templates/basic.template';
import { useResume } from '../../hooks/useResume';
import { Paper } from './paper';
import { PDFViewer } from '@react-pdf/renderer';
import DuoTemplate from '../../resume-templates/duo';

export const Preview: FC = () => {
  const { resume } = useResume();
  const [isExporting, setIsExporting] = useState(false);
  const paperWrapperRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState(0);

  const [marg, setMarg] = useState(0.5);

  const handleScroll = () => {
    if (paperWrapperRef.current) {
      setScrollPos(paperWrapperRef.current?.scrollTop);
    }
  };

  useLayoutEffect(() => {
    paperWrapperRef?.current?.addEventListener('scroll', handleScroll);
    return () =>
      paperWrapperRef?.current?.removeEventListener('scroll', handleScroll);
  });

  useEffect(() => {
    setTimeout(() => {
      if (paperWrapperRef.current) {
        paperWrapperRef.current.scrollTo(0, scrollPos);
      }
    }, 100);
  }, [resume]);

  const getPDF = async () => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resume),
    };

    const url = '/api/exportPDF';

    try {
      setIsExporting(true);
      const response = await fetch(url, requestOptions);

      if (response.status === 200) {
        const blob = await response.blob();

        // Validate that we actually got a PDF
        if (blob.type !== 'application/pdf' && blob.size === 0) {
          throw new Error('Invalid PDF response');
        }

        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${resume?.basics?.name} - ${resume?.basics?.label}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
    } catch (e: any) {
      console.error('PDF download error:', e?.message || e);
      // You could add user notification here
    } finally {
      setIsExporting(false);
    }
  };

  const template = <DuoTemplate resume={resume} />;

  return (
    <>
      {/* <Box
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
          <GridItem></GridItem>
          <GridItem display="flex" justifyContent="center">
            <NumberInput.Root
              defaultValue={marg.toString()}
              step={0.1}
              min={0.1}
              max={1}
              onValueChange={(details) => setMarg(parseFloat(details.value))}
            >
              <NumberInput.Control />
              <NumberInput.Input bgColor="white" />
            </NumberInput.Root>
          </GridItem>
          <GridItem display="flex" justifyContent="end">
            <Button
              loading={isExporting}
              loadingText="Exporting..."
              size="sm"
              colorPalette="gray"
              variant="subtle"
              onClick={getPDF}
            >
              <Icon as={HiDownload} boxSize={5} />
              Download PDF
            </Button>
          </GridItem>
        </Grid>
      </Box> */}
      <PDFViewer width="100%" height="100%" showToolbar={false}>
        {template}
      </PDFViewer>
      {/* <Paper pagemargin={marg}>
          <BasicTemplate resume={resume} />
        </Paper> */}
    </>
  );
};
