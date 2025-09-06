import {
  Box,
  Collapsible,
  Flex,
  Heading,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import React, { FC, useState } from 'react';
import { HiChevronDown, HiEyeOff, HiEye } from 'react-icons/hi';

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
