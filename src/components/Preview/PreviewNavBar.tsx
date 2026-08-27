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
  /** Phone layout: one row of icon-only controls, no editor-collapse toggle. */
  isMobile?: boolean;
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
  isMobile = false,
}: PreviewNavBarProps) => {
  const controls = (
    <>
      <TemplateMenu
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={onTemplateChange}
        compact={isMobile}
      />
      <AccentMenu
        selectedAccentId={selectedAccentId}
        resolvedAccentId={resolvedAccentId}
        onAccentChange={onAccentChange}
        disabled={accentDisabled}
        compact={isMobile}
      />
      <MarginMenu
        selectedMarginId={selectedMarginId}
        onMarginChange={onMarginChange}
        compact={isMobile}
      />
    </>
  );

  return (
    <Box
      as="header"
      position="absolute"
      display="flex"
      alignItems="center"
      top={0}
      width="100%"
      height={isMobile ? '52px' : '60px'}
      bg="bg.panel"
      borderBottomWidth="1px"
      borderColor="border"
      zIndex={900}
      px={isMobile ? 2 : 4}
    >
      {/* Three even columns keep the design controls optically centred on
          desktop. On a phone there is no room for that: the title takes what
          is left after the controls, which are icon-only and right-aligned. */}
      <Grid
        templateColumns={isMobile ? '1fr auto' : '1fr 1fr 1fr'}
        width="100%"
        alignItems="center"
        gap={isMobile ? 1 : 0}
      >
        <GridItem
          display="flex"
          justifyContent="start"
          alignItems="center"
          gap={1}
          minWidth={0}
        >
          {!isMobile && (
            <IconButton
              aria-label={
                isEditorCollapsed ? 'Expand editor' : 'Collapse editor'
              }
              onClick={() => onEditorCollapseChange(!isEditorCollapsed)}
              variant="ghost"
              color="fg.muted"
              _hover={{ color: 'fg', backgroundColor: 'bg.muted' }}
            >
              {isEditorCollapsed ? <GoSidebarCollapse /> : <GoSidebarExpand />}
            </IconButton>
          )}
          <EditableTitle
            value={resumeName}
            onCommit={onRename}
            autoEdit={focusName}
            label="Resume name"
          />
        </GridItem>
        {!isMobile && (
          <GridItem display="flex" justifyContent="center" gap={2}>
            {controls}
          </GridItem>
        )}
        <GridItem display="flex" justifyContent="end" gap={1} flexShrink={0}>
          {isMobile && controls}
          <ExportMenu
            template={resumeTemplate}
            resumeName={resumeName}
            compact={isMobile}
          />
        </GridItem>
      </Grid>
    </Box>
  );
};
