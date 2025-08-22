import { Box, Button, Menu, Portal } from '@chakra-ui/react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { JSX, useMemo } from 'react';
import { BsFiletypeJson, BsFiletypeTxt } from 'react-icons/bs';
import { BsFiletypePdf } from 'react-icons/bs';
import { PiExportLight } from 'react-icons/pi';

import { useResume } from '../../hooks/useResume';
import { exportResumeAsJson } from '../../utils/json-export';
import { exportResumeAsText } from '../../utils/text-export';

const ExportMenu = ({ template }: { template: JSX.Element }) => {
  const { resume } = useResume();

  const handleJsonExport = () => {
    exportResumeAsJson(resume, exportFileName);
  };

  const handleTextExport = () => {
    exportResumeAsText(resume, exportFileName);
  };

  const exportFileName = useMemo(() => {
    if (resume.basics?.name && resume.basics?.label) {
      return `${resume.basics.name} - ${resume.basics.label}`;
    }

    return 'my-resume';
  }, [resume]);
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button size="sm" colorPalette="gray" variant="subtle">
          Export
          <PiExportLight size={24} />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <PDFDownloadLink
              document={template}
              fileName={`${exportFileName}.pdf`}
            >
              <Menu.Item value="export-pdf">
                <Box display="flex" alignItems="center" gap={2}>
                  <BsFiletypePdf size={20} />
                  PDF
                </Box>
              </Menu.Item>
            </PDFDownloadLink>
            <Menu.Item value="export-json" asChild onClick={handleJsonExport}>
              <Box display="flex" alignItems="center" gap={2}>
                <BsFiletypeJson size={20} />
                JSON
              </Box>
            </Menu.Item>
            <Menu.Item value="export-text" asChild onClick={handleTextExport}>
              <Box display="flex" alignItems="center" gap={2}>
                <BsFiletypeTxt size={20} />
                TXT
              </Box>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default ExportMenu;
