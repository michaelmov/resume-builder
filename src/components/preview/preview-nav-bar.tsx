import { Box, Grid, GridItem } from '@chakra-ui/react';
import { JSX } from 'react';

import { useResume } from '../../hooks/useResume';

import ExportMenu from './export-menu';
interface PreviewNavBarProps {
  resumeTemplate: JSX.Element;
}

export const PreviewNavBar = ({ resumeTemplate }: PreviewNavBarProps) => {
  useResume();

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
