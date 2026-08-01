import { Box, Grid, GridItem, IconButton } from '@chakra-ui/react';
import { JSX } from 'react';
import { GoSidebarCollapse, GoSidebarExpand } from 'react-icons/go';

import { useResume } from '../../hooks/useResume';

import AccentMenu from './AccentMenu';
import ExportMenu from './ExportMenu';
import MarginMenu from './MarginMenu';
import TemplateMenu from './TemplateMenu';
interface PreviewNavBarProps {
  resumeTemplate: JSX.Element;
  selectedTemplateId: string;
  onTemplateChange: (templateId: string) => void;
  selectedAccentId: string | null;
  resolvedAccentId: string;
  onAccentChange: (accentId: string | null) => void;
  /** Disable the accent picker for monochrome templates (no secondary color). */
  accentDisabled: boolean;
  selectedMarginId: string;
  onMarginChange: (marginId: string) => void;
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
  accentDisabled,
  selectedMarginId,
  onMarginChange,
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
      bg="bg.panel"
      borderBottomWidth="1px"
      borderColor="border"
      zIndex={900}
      px={4}
    >
      <Grid templateColumns="1fr 1fr 1fr" width="100%" alignItems="center">
        <GridItem display="flex" justifyContent="start">
          <IconButton
            aria-label={isEditorCollapsed ? 'Expand editor' : 'Collapse editor'}
            onClick={() => onEditorCollapseChange(!isEditorCollapsed)}
            variant="ghost"
            color="fg.muted"
            _hover={{ color: 'fg', backgroundColor: 'bg.muted' }}
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
            disabled={accentDisabled}
          />
          <MarginMenu
            selectedMarginId={selectedMarginId}
            onMarginChange={onMarginChange}
          />
        </GridItem>
        <GridItem display="flex" justifyContent="end">
          <ExportMenu template={resumeTemplate} />
        </GridItem>
      </Grid>
    </Box>
  );
};
