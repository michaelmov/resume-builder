import {
  Box,
  BoxProps,
  IconButton,
  Collapsible,
  Heading,
  Flex,
  Text,
} from '@chakra-ui/react';
import { FC, useState } from 'react';
import { HiOutlineTrash, HiChevronUp, HiChevronDown } from 'react-icons/hi';

interface EditorSubsectionProps extends BoxProps {
  title: string;
  subtitle?: string;
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
  title,
  subtitle = '',
  ...rest
}) => {
  const [isActionButtonsVisible, setIsActionButtonsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={(details) => setIsOpen(details.open)}
    >
      <Box
        borderWidth={1}
        borderColor="gray.200"
        p={4}
        pt={8}
        pb={isOpen ? 4 : 8}
        borderRadius={6}
        position="relative"
        onMouseOver={() => setIsActionButtonsVisible(true)}
        onMouseLeave={() => setIsActionButtonsVisible(false)}
        {...rest}
      >
        <Collapsible.Trigger width="100%">
          <Flex
            alignItems="center"
            justifyContent="space-between"
            gap={2}
            cursor="pointer"
          >
            <Flex alignItems="center" gap={1}>
              <Box
                as="span"
                transform={isOpen ? 'rotate(0deg)' : 'rotate(-90deg)'}
                transition="transform 0.2s ease-in-out"
              >
                <HiChevronDown />
              </Box>
              <Heading as="h4" fontSize="md" color="blackAlpha.700">
                {title}
              </Heading>
            </Flex>
            {subtitle && (
              <Text
                fontSize="sm"
                color="blackAlpha.700"
                maxWidth="200px"
                textAlign="right"
              >
                {subtitle}
              </Text>
            )}
          </Flex>
        </Collapsible.Trigger>
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
        <Collapsible.Content mt={8}>{children}</Collapsible.Content>
      </Box>
    </Collapsible.Root>
  );
};
