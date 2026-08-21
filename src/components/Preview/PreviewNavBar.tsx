import { Box, Grid, GridItem, IconButton } from '@chakra-ui/react';
import { JSX } from 'react';
import { GoSidebarCollapse, GoSidebarExpand } from 'react-icons/go';

import { EditableTitle } from '../ui/EditableTitle';

import AccentMenu from './AccentMenu';
import ExportMenu from './ExportMenu';
import MarginMenu from './MarginMenu';
import TemplateMenu from './TemplateMenu';

interface PreviewNavBarProps {
  resumeTemplate: JSX.Element;
  /** The resume's name — it labels the document on screen, so it sits here. */
  resumeName: string;
  onRename: (name: string) => void;
  focusName: boolean;
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
  resumeName,
  onRename,
  focusName,
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
        <GridItem
          display="flex"
          justifyContent="start"
          alignItems="center"
          gap={1}
          minWidth={0}
        >
          <IconButton
            aria-label={isEditorCollapsed ? 'Expand editor' : 'Collapse editor'}
            onClick={() => onEditorCollapseChange(!isEditorCollapsed)}
            variant="ghost"
            color="fg.muted"
            _hover={{ color: 'fg', backgroundColor: 'bg.muted' }}
          >
            {isEditorCollapsed ? <GoSidebarCollapse /> : <GoSidebarExpand />}
          </IconButton>
          <EditableTitle
            value={resumeName}
            onCommit={onRename}
            autoEdit={focusName}
            label="Resume name"
          />
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
          <ExportMenu template={resumeTemplate} resumeName={resumeName} />
        </GridItem>
      </Grid>
    </Box>
  );
};
