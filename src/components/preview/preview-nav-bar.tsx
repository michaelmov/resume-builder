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
interface PreviewNavBarProps {
  resumeTemplate: JSX.Element;
}

export const PreviewNavBar = ({ resumeTemplate }: PreviewNavBarProps) => {
  const { resume } = useResume();

  const exportFileName = useMemo(() => {
    if (resume.basics?.name && resume.basics?.label) {
      return `${resume.basics.name} - ${resume.basics.label}`;
    }

    return 'my-resume';
  }, [resume]);

  const handleJsonExport = () => {
    exportResumeAsJson(resume, exportFileName);
  };

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
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button size="sm" colorPalette="gray" variant="subtle">
                Export
                <Icon as={HiDotsVertical} boxSize={5} />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <PDFDownloadLink
                    document={resumeTemplate}
                    fileName={`${exportFileName}.pdf`}
                  >
                    <Menu.Item value="export-pdf">
                      <Box display="flex" alignItems="center" gap={2}>
                        <BsFiletypePdf size={20} />
                        PDF
                      </Box>
                    </Menu.Item>
                  </PDFDownloadLink>
                  <Menu.Item
                    value="export-json"
                    asChild
                    onClick={handleJsonExport}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <BsFiletypeJson size={20} />
                      JSON
                    </Box>
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </GridItem>
      </Grid>
    </Box>
  );
};
