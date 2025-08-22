import {
  Box,
  Button,
  Grid,
  GridItem,
  Icon,
  Menu,
  Portal,
} from '@chakra-ui/react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { HiDotsVertical } from 'react-icons/hi';
import { PiFilePdfLight } from 'react-icons/pi';
import { BsFiletypeJson, BsFiletypePdf } from 'react-icons/bs';
import { useResume } from '../../hooks/useResume';
import { useMemo } from 'react';
import { exportResumeAsJson } from '../../utils/json-export';
import ExportMenu from './export-menu';
interface PreviewNavBarProps {
  resumeTemplate: JSX.Element;
}

export const PreviewNavBar = ({ resumeTemplate }: PreviewNavBarProps) => {
  return (
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
          <ExportMenu template={resumeTemplate} />
        </GridItem>
      </Grid>
    </Box>
  );
};
