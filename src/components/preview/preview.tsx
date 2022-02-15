import {
  Box,
  Button,
  Icon,
  Grid,
  GridItem,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { FC, useState } from 'react';
import { HiDownload, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { BasicTemplate } from '../../resume-templates/basic.template';
import { useResume } from '../../hooks/resume.hook';
import { Paper } from './paper';

export const Preview: FC = () => {
  const { resume } = useResume();
  const [isExporting, setIsExporting] = useState(false);

  const [marg, setMarg] = useState(0.5);

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

        let url = window.URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = 'resume.pdf';
        a.click();
      } else {
        throw new Error('Error!');
      }
    } catch {
      (e: Error) => {
        console.error(e?.message);
      };
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
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
          <GridItem></GridItem>
          <GridItem display="flex" justifyContent="center">
            <NumberInput
              defaultValue={marg}
              step={0.1}
              min={0.1}
              max={1}
              onChange={(val) => setMarg(parseFloat(val))}
            >
              <NumberInputField bgColor="white" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </GridItem>
          <GridItem display="flex" justifyContent="end">
            <Button
              isLoading={isExporting}
              loadingText="Exporting..."
              size="sm"
              colorScheme="gray"
              leftIcon={<Icon as={HiDownload} boxSize={5} />}
              onClick={getPDF}
            >
              Download PDF
            </Button>
          </GridItem>
        </Grid>
      </Box>
      <Box
        bgColor="gray.400"
        display="flex"
        flexDirection="column"
        alignItems="center"
        height="100%"
        width="100%"
        overflow="auto"
        position="relative"
        pt={24}
      >
        <Paper pagemargin={marg}>
          <BasicTemplate resume={resume} />
        </Paper>
      </Box>
    </>
  );
};
