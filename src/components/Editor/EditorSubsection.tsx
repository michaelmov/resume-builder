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
import { HiChevronUp, HiChevronDown } from 'react-icons/hi';

import { ConfirmDeleteButton } from '../ui/ConfirmDeleteButton';

import { useSubsectionOpenState } from './OpenSubsectionContext';

interface EditorSubsectionProps extends BoxProps {
  /** Unique id used to coordinate the single-open accordion within a section. */
  id: string;
  title: string;
  subtitle?: string;
  /**
   * Noun for this kind of entry ("work entry", "project", …), used in the
   * delete confirmation and the trash button's label.
   */
  entryLabel?: string;
  onDeleteClick: () => void;
  onMoveUpClick?: () => void;
  moveUpDisabled?: boolean;
  onMoveDownClick?: () => void;
  moveDownDisabled?: boolean;
}

export const EditorSubsection: FC<EditorSubsectionProps> = ({
  id,
  children,
  onDeleteClick,
  onMoveUpClick,
  onMoveDownClick,
  moveUpDisabled = false,
  moveDownDisabled = false,
  title,
  subtitle = '',
  entryLabel = 'entry',
  ...rest
}) => {
  const [isActionButtonsVisible, setIsActionButtonsVisible] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isOpen, setIsOpen] = useSubsectionOpenState(id);
  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={(details) => setIsOpen(details.open)}
    >
      <Box
        borderWidth={1}
        borderColor={isOpen ? 'border.emphasized' : 'border'}
        p={4}
        pt={8}
        pb={isOpen ? 4 : 8}
        borderRadius={6}
        position="relative"
        transition="border-color 0.15s ease-in-out"
        _hover={{ borderColor: 'border.emphasized' }}
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
              <Heading as="h4" fontSize="md" color="fg">
                {title}
              </Heading>
            </Flex>
            {subtitle && (
              <Text
                fontSize="sm"
                color="fg.muted"
                maxWidth="200px"
                textAlign="right"
              >
                {subtitle}
              </Text>
            )}
          </Flex>
        </Collapsible.Trigger>
        {/* The controls live on hover, but a confirmation in flight has to keep
            them mounted — its popover is the trigger's own anchor. */}
        {(isActionButtonsVisible || isConfirmingDelete) && (
          <Box position="absolute" top={-0.5} right={0} my={0}>
            <IconButton
              onClick={onMoveUpClick}
              aria-label={`Move ${entryLabel} up`}
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
              aria-label={`Move ${entryLabel} down`}
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
            <ConfirmDeleteButton
              aria-label={`Delete ${entryLabel}`}
              variant="subtle"
              size="sm"
              borderBottomLeftRadius={0}
              borderBottomRightRadius={0}
              borderTopLeftRadius={0}
              confirmTitle={
                title?.trim()
                  ? `Delete “${title}”?`
                  : `Delete this ${entryLabel}?`
              }
              confirmDescription={`This permanently removes this ${entryLabel} and everything in it.`}
              onConfirm={onDeleteClick}
              onConfirmOpenChange={setIsConfirmingDelete}
            />
          </Box>
        )}
        <Collapsible.Content mt={8}>{children}</Collapsible.Content>
      </Box>
    </Collapsible.Root>
  );
};
