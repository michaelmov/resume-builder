import {
  Box,
  Collapsible,
  Flex,
  Heading,
  IconButton,
  Input,
} from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { HiCheck, HiChevronDown, HiOutlinePencil } from 'react-icons/hi';
import { MdDragIndicator } from 'react-icons/md';

import { SectionTypes } from '../../types/resume.model';
import { ConfirmDeleteButton } from '../ui/ConfirmDeleteButton';
import { Tooltip } from '../ui/Tooltip';

import { useSectionOpenState } from './OpenSectionContext';
import { useSectionActions } from './SectionActionsContext';
import { useDragHandle, useIsSectionDragging } from './SortableSection';

/**
 * Horizontal inset of the pinned (`alwaysOpen`) card. Tracks `EditorSubsection`'s
 * so a field is about as wide in Basics as it is inside any other section, and
 * tightens below `md` for the same reason it does there — on a phone the editor
 * is the whole screen and this inset is most of what a field doesn't get.
 */
const CARD_PX = { base: 3, md: 6 };

interface EditorSectionProps {
  /** Unique id used to coordinate the single-open accordion behavior. */
  id: string;
  title: string;
  children: React.ReactNode;
  /**
   * Render the section as a permanent, always-expanded card with no collapse,
   * reorder, or remove affordances. Used for Basics, whose name and contact
   * details head every resume and so can't be removed or collapsed away.
   */
  alwaysOpen?: boolean;
  /**
   * Drop the in-card heading because something else already names the section —
   * Basics sits alone in the editor's "Profile" pane, which would otherwise
   * label it twice in a row. Only meaningful alongside `alwaysOpen`; a
   * collapsible section's title is its trigger and can't be hidden.
   */
  hideTitle?: boolean;
  /**
   * Fired when focus leaves the section's content (React blur bubbles), letting
   * auto-saving sections flush a pending edit the moment a field is left.
   */
  onBlur?: React.FocusEventHandler<HTMLDivElement>;
}
export const EditorSection = ({
  id,
  title,
  children,
  alwaysOpen = false,
  hideTitle = false,
  onBlur,
}: EditorSectionProps) => {
  const [isOpen, setIsOpen] = useSectionOpenState(id);
  const dragHandle = useDragHandle();
  const isSectionDragging = useIsSectionDragging();
  const sectionActions = useSectionActions();

  // Rename is staged through the section-actions context; without it (a section
  // rendered standalone, or pinned Basics) the title is fixed to the prop.
  const canRename = !alwaysOpen && sectionActions != null;
  const displayTitle = sectionActions
    ? sectionActions.getSectionTitle(id as SectionTypes)
    : title;

  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(displayTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  // Set when Escape cancels so the input's blur handler doesn't re-commit it.
  const cancelledRef = useRef(false);

  const startRename = () => {
    setDraftTitle(displayTitle);
    setIsRenaming(true);
  };

  const commitRename = () => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    sectionActions?.renameSection(id as SectionTypes, draftTitle.trim());
    setIsRenaming(false);
  };

  const cancelRename = () => {
    cancelledRef.current = true;
    setIsRenaming(false);
  };

  // Collapse every section once a drag begins so reorder targets stay compact,
  // and keep them collapsed after the drop (the user re-opens as needed).
  useEffect(() => {
    if (isSectionDragging) {
      setIsOpen(false);
    }
  }, [isSectionDragging, setIsOpen]);

  // A drag mid-rename would orphan the open input; close it back to read mode.
  useEffect(() => {
    if (isSectionDragging && isRenaming) {
      cancelRename();
    }
  }, [isSectionDragging, isRenaming]);

  // Focus and select the field when entering rename mode (avoids autoFocus,
  // which lint flags for accessibility) so the user can type over the name.
  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  // A pinned section (Basics) is a permanent fixture: it always shows its
  // content, has no chevron/remove controls, and pulls the title inside the
  // card so it reads as one grounded block rather than a collapsible panel.
  if (alwaysOpen) {
    return (
      <Box
        as="section"
        width="100%"
        bg="bg.panel"
        borderRadius={8}
        boxShadow="xs"
        borderWidth="1px"
        borderColor="border"
        overflow="hidden"
      >
        {!hideTitle && (
          <Flex align="center" px={CARD_PX} pt={6} pb={4}>
            <Heading as="h3" fontSize="xl" fontWeight="medium" color="fg">
              {title}
            </Heading>
          </Flex>
        )}
        {/* `px` is kept close to the entry cards' own inset so a field is
            about as wide here as it is inside a section — this card is the
            only one Basics gets, where the sections stack a card per entry. */}
        <Box px={CARD_PX} pt={hideTitle ? 8 : 0} pb={8} onBlur={onBlur}>
          {children}
        </Box>
      </Box>
    );
  }

  // `isOpen` catches up via the effect a tick later; force the collapsed view
  // on the very first drag frame so there is no flash of the expanded section.
  const open = isSectionDragging ? false : isOpen;

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={(details) => {
        if (!isSectionDragging) {
          setIsOpen(details.open);
        }
      }}
    >
      <Box width="100%">
        <Flex width="100%" justifyContent="space-between" alignItems="center">
          {dragHandle && (
            <Tooltip content="Drag to reorder section">
              <IconButton
                ref={dragHandle.setActivatorNodeRef}
                {...dragHandle.attributes}
                {...dragHandle.listeners}
                aria-label="Reorder section"
                variant="ghost"
                size="sm"
                color="fg.subtle"
                _hover={{ color: 'fg.muted', bg: 'bg.muted' }}
                cursor={dragHandle.isDragging ? 'grabbing' : 'grab'}
                touchAction="none"
                mr={1}
                mb={2}
              >
                <MdDragIndicator />
              </IconButton>
            </Tooltip>
          )}
          {isRenaming ? (
            <Flex flex="1" alignItems="center" gap={1} mb={2}>
              <Input
                ref={inputRef}
                size="sm"
                value={draftTitle}
                placeholder={title}
                onChange={(event) => setDraftTitle(event.target.value)}
                onBlur={commitRename}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commitRename();
                  } else if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelRename();
                  }
                }}
              />
              <Tooltip content="Done">
                <IconButton
                  aria-label="Confirm section name"
                  variant="ghost"
                  size="sm"
                  color="fg.muted"
                  // Commit before the input's blur fires so it isn't skipped.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={commitRename}
                >
                  <HiCheck />
                </IconButton>
              </Tooltip>
            </Flex>
          ) : (
            <Collapsible.Trigger
              display="flex"
              justifyContent="space-between"
              width="100%"
            >
              <Heading
                as="h3"
                fontSize="xl"
                mb={2}
                color="fg.muted"
                fontWeight="normal"
                cursor="pointer"
                display="flex"
                alignItems="center"
                gap={1}
                _hover={{ color: 'fg' }}
                transition="color 0.15s ease-in-out"
              >
                <Box
                  as="span"
                  transform={open ? 'rotate(0deg)' : 'rotate(-90deg)'}
                  transition="transform 0.2s ease-in-out"
                >
                  <HiChevronDown />
                </Box>
                {displayTitle}
              </Heading>
            </Collapsible.Trigger>
          )}
          {canRename && !isRenaming && (
            <Tooltip content="Rename section">
              <IconButton
                aria-label="Rename section"
                variant="ghost"
                size="sm"
                mb={2}
                color="fg.subtle"
                _hover={{ color: 'brand.fg', bg: 'brand.subtle' }}
                onClick={startRename}
              >
                <HiOutlinePencil />
              </IconButton>
            </Tooltip>
          )}
          {sectionActions && !isRenaming && (
            <ConfirmDeleteButton
              aria-label="Remove section"
              variant="ghost"
              size="sm"
              mb={2}
              color="fg.subtle"
              _hover={{ color: 'fg.error', bg: 'bg.error' }}
              confirmTitle={`Delete “${displayTitle}”?`}
              confirmDescription="This permanently removes the section and everything in it."
              onConfirm={() => sectionActions.removeSection(id as SectionTypes)}
            />
          )}
        </Flex>
        {/* Deliberately no card of its own. A section used to draw a panel
            surface here and then every entry drew a second one inside it, and
            the two insets together cost a quarter of the sidebar's width. The
            entries carry the card (see `EditorSubsection`); what groups them
            is the header above and the gap to the next section. */}
        <Collapsible.Content as="section" onBlur={onBlur}>
          {children}
        </Collapsible.Content>
      </Box>
    </Collapsible.Root>
  );
};
