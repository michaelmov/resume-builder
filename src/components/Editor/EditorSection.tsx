import {
  Box,
  Collapsible,
  Flex,
  Heading,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { HiChevronDown, HiEyeOff, HiEye } from 'react-icons/hi';
import { MdDragIndicator } from 'react-icons/md';

import { Tooltip } from '../ui/Tooltip';

import { useDragHandle, useIsSectionDragging } from './SortableSection';

interface EditorSectionProps {
  title: string;
  children: React.ReactNode;
  isHidden?: boolean;
  onHiddenChange?: (isHidden: boolean) => void;
  enableShowHideToggle?: boolean;
}
export const EditorSection: FC<EditorSectionProps> = ({
  title,
  children,
  isHidden = false,
  onHiddenChange,
  enableShowHideToggle = true,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const dragHandle = useDragHandle();
  const isSectionDragging = useIsSectionDragging();

  // Collapse every section once a drag begins so reorder targets stay compact,
  // and keep them collapsed after the drop (the user re-opens as needed).
  useEffect(() => {
    if (isSectionDragging) {
      setIsOpen(false);
    }
  }, [isSectionDragging]);

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
