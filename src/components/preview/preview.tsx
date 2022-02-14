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
  const [marg, setMarg] = useState(0.5);

  const getPDF = async () => {
    alert('TODO: Implement getPDF');
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
      >
        <Paper pagemargin={marg}>
          <BasicTemplate resume={resume} />
        </Paper>
      </Box>
    </>
  );
};
