import {
  Box,
  BoxProps,
  Collapsible,
  Flex,
  Heading,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import React, { FC, useState } from 'react';
import {
  HiOutlineTrash,
  HiChevronUp,
  HiChevronDown,
  HiEyeOff,
  HiEye,
} from 'react-icons/hi';

import { Tooltip } from '../ui/Tooltip';
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

  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={(details) => setIsOpen(details.open)}
    >
      <Box width="100%">
        <Flex width="100%" justifyContent="space-between" alignItems="center">
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
                transform={isOpen ? 'rotate(0deg)' : 'rotate(-90deg)'}
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

interface EditorSubsectionProps extends BoxProps {
  onDeleteClick: () => void;
  onMoveUpClick?: () => void;
  moveUpDisabled?: boolean;
  onMoveDownClick?: () => void;
  moveDownDisabled?: boolean;
}

export const EditorSubsection: FC<EditorSubsectionProps> = ({
  children,
  onDeleteClick,
  onMoveUpClick,
  onMoveDownClick,
  moveUpDisabled = false,
  moveDownDisabled = false,
  ...rest
}) => {
  const [isActionButtonsVisible, setIsActionButtonsVisible] = useState(false);
  return (
    <Box
      borderWidth={1}
      borderColor="gray.200"
      p={4}
      pt={8}
      borderRadius={6}
      position="relative"
      onMouseOver={() => setIsActionButtonsVisible(true)}
      onMouseLeave={() => setIsActionButtonsVisible(false)}
      {...rest}
    >
      {isActionButtonsVisible && (
        <Box position="absolute" top={-0.5} right={0} my={0}>
          <IconButton
            onClick={onMoveUpClick}
            aria-label="Delete skill"
            variant="subtle"
            size="sm"
            borderTopLeftRadius={0}
            borderTopRightRadius={0}
            borderBottomLeftRadius={5}
            borderBottomRightRadius={5}
            mr={1}
            disabled={moveUpDisabled}
          >
            <HiChevronUp />
          </IconButton>
          <IconButton
            onClick={onMoveDownClick}
            aria-label="Delete skill"
            variant="subtle"
            size="sm"
            borderTopLeftRadius={0}
            borderTopRightRadius={0}
            borderBottomLeftRadius={5}
            borderBottomRightRadius={5}
            mr={1}
            disabled={moveDownDisabled}
          >
            <HiChevronDown />
          </IconButton>
          <IconButton
            onClick={onDeleteClick}
            aria-label="Delete skill"
            variant="subtle"
            size="sm"
            borderBottomLeftRadius={0}
            borderBottomRightRadius={0}
            borderTopLeftRadius={0}
          >
            <HiOutlineTrash />
          </IconButton>
        </Box>
      )}
      {children}
    </Box>
  );
};
