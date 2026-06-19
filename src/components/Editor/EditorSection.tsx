import {
  Box,
  Collapsible,
  Flex,
  Heading,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import React, { FC, useEffect } from 'react';
import { HiChevronDown, HiEyeOff, HiEye } from 'react-icons/hi';
import { MdDragIndicator } from 'react-icons/md';

import { Tooltip } from '../ui/Tooltip';

import { useSectionOpenState } from './OpenSectionContext';
import { useDragHandle, useIsSectionDragging } from './SortableSection';

interface EditorSectionProps {
  /** Unique id used to coordinate the single-open accordion behavior. */
  id: string;
  title: string;
  children: React.ReactNode;
  isHidden?: boolean;
  onHiddenChange?: (isHidden: boolean) => void;
  enableShowHideToggle?: boolean;
  /**
   * Render the section as a permanent, always-expanded card with no collapse,
   * reorder, or hide affordances. Used for Basics, whose name and contact
   * details head every resume and so can't be hidden or collapsed away.
   */
  alwaysOpen?: boolean;
}
export const EditorSection: FC<EditorSectionProps> = ({
  id,
  title,
  children,
  isHidden = false,
  onHiddenChange,
  enableShowHideToggle = true,
  alwaysOpen = false,
}) => {
  const [isOpen, setIsOpen] = useSectionOpenState(id);
  const dragHandle = useDragHandle();
  const isSectionDragging = useIsSectionDragging();

  // Collapse every section once a drag begins so reorder targets stay compact,
  // and keep them collapsed after the drop (the user re-opens as needed).
  useEffect(() => {
    if (isSectionDragging) {
      setIsOpen(false);
    }
  }, [isSectionDragging, setIsOpen]);

  // A pinned section (Basics) is a permanent fixture: it always shows its
  // content, has no chevron/hide controls, and pulls the title inside the card
  // so it reads as one grounded block rather than a collapsible panel.
  if (alwaysOpen) {
    return (
      <Box
        as="section"
        width="100%"
        bgColor="white"
        borderRadius={8}
        boxShadow="sm"
        borderLeftWidth="3px"
        borderLeftColor="purple.400"
        overflow="hidden"
      >
        <Flex align="center" px={8} pt={6} pb={4}>
          <Heading as="h3" fontSize="xl" fontWeight="medium" color="gray.700">
            {title}
          </Heading>
        </Flex>
        <Box px={8} pb={8}>
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
                color="gray.400"
                cursor={dragHandle.isDragging ? 'grabbing' : 'grab'}
                touchAction="none"
                mr={1}
                mb={2}
              >
                <MdDragIndicator />
              </IconButton>
            </Tooltip>
          )}
          <Collapsible.Trigger
            display="flex"
            justifyContent="space-between"
            width="100%"
          >
            <Heading
              as="h3"
              fontSize="xl"
              mb={2}
              color="blackAlpha.600"
              fontWeight="normal"
              cursor="pointer"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <Box
                as="span"
                transform={open ? 'rotate(0deg)' : 'rotate(-90deg)'}
                transition="transform 0.2s ease-in-out"
              >
                <HiChevronDown />
              </Box>
              {title}
            </Heading>
          </Collapsible.Trigger>
          {enableShowHideToggle && (
            <Tooltip content={isHidden ? 'Show section' : 'Hide section'}>
              <IconButton
                variant="ghost"
                onClick={() => onHiddenChange?.(!isHidden)}
              >
                {isHidden ? (
                  <Icon color="gray.400">
                    <HiEyeOff />
                  </Icon>
                ) : (
                  <Icon color="gray.400">
                    <HiEye />
                  </Icon>
                )}
              </IconButton>
            </Tooltip>
          )}
        </Flex>
        <Collapsible.Content
          as="section"
          bgColor="white"
          borderRadius={8}
          p={8}
          boxShadow="sm"
        >
          {children}
        </Collapsible.Content>
      </Box>
    </Collapsible.Root>
  );
};
