import { Box, Grid, GridItem, IconButton } from '@chakra-ui/react';
import { JSX } from 'react';
import { GoSidebarCollapse, GoSidebarExpand } from 'react-icons/go';

import { useResume } from '../../hooks/useResume';

import AccentMenu from './AccentMenu';
import ExportMenu from './ExportMenu';
import TemplateMenu from './TemplateMenu';
interface PreviewNavBarProps {
  resumeTemplate: JSX.Element;
  selectedTemplateId: string;
  onTemplateChange: (templateId: string) => void;
  selectedAccentId: string | null;
  resolvedAccentId: string;
  onAccentChange: (accentId: string | null) => void;
  isEditorCollapsed: boolean;
  onEditorCollapseChange: (isEditorCollapsed: boolean) => void;
}

export const PreviewNavBar = ({
  resumeTemplate,
  selectedTemplateId,
  onTemplateChange,
  selectedAccentId,
  resolvedAccentId,
  onAccentChange,
  isEditorCollapsed,
  onEditorCollapseChange,
}: PreviewNavBarProps) => {
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
      <Grid templateColumns="1fr 1fr 1fr" width="100%" alignItems="center">
        <GridItem display="flex" justifyContent="start">
          <IconButton
            aria-label={isEditorCollapsed ? 'Expand editor' : 'Collapse editor'}
            onClick={() => onEditorCollapseChange(!isEditorCollapsed)}
            variant="ghost"
            color="white"
            _hover={{ backgroundColor: 'whiteAlpha.200' }}
          >
            {isEditorCollapsed ? <GoSidebarCollapse /> : <GoSidebarExpand />}
          </IconButton>
        </GridItem>
        <GridItem display="flex" justifyContent="center" gap={2}>
          <TemplateMenu
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={onTemplateChange}
          />
          <AccentMenu
            selectedAccentId={selectedAccentId}
            resolvedAccentId={resolvedAccentId}
            onAccentChange={onAccentChange}
          />
        </GridItem>
        <GridItem display="flex" justifyContent="end">
          <ExportMenu template={resumeTemplate} />
        </GridItem>
      </Grid>
    </Box>
  );
};
