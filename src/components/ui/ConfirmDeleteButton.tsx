import {
  Button,
  Flex,
  IconButton,
  IconButtonProps,
  Popover,
  Portal,
  Text,
} from '@chakra-ui/react';
import { FC, useState } from 'react';
import { HiOutlineTrash } from 'react-icons/hi';

export interface ConfirmDeleteButtonProps
  extends Omit<IconButtonProps, 'children' | 'onClick'> {
  /** Popover heading, e.g. `Delete “Work Experience”?`. */
  confirmTitle: string;
  /** One line spelling out what the delete takes with it. */
  confirmDescription: string;
  onConfirm: () => void;
  /**
   * Fired as the confirmation opens and closes. Triggers that only render on
   * hover need this: moving the pointer onto the (portalled) popover counts as
   * leaving the trigger, and unmounting the trigger mid-confirmation would tear
   * the popover down with it.
   */
  onConfirmOpenChange?: (open: boolean) => void;
}

/**
 * Trash button that requires a confirmation before it fires. Deleting in the
 * editor is a permanent delete — it takes the content down with the container —
 * so every delete affordance (sections and their entries alike) asks first
 * through this anchored popover rather than acting on the first click.
 */
export const ConfirmDeleteButton: FC<ConfirmDeleteButtonProps> = ({
  confirmTitle,
  confirmDescription,
  onConfirm,
  onConfirmOpenChange,
  ...buttonProps
}) => {
  const [open, setOpen] = useState(false);

  const changeOpen = (next: boolean) => {
    setOpen(next);
    onConfirmOpenChange?.(next);
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(details) => changeOpen(details.open)}
      positioning={{ placement: 'bottom-end' }}
    >
      <Popover.Trigger asChild>
        <IconButton {...buttonProps}>
          <HiOutlineTrash />
        </IconButton>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content width="auto" maxW="16rem">
            <Popover.Arrow />
            <Popover.Body>
              <Popover.Title fontWeight="medium">{confirmTitle}</Popover.Title>
              <Text fontSize="sm" color="gray.600" mt={1}>
                {confirmDescription}
              </Text>
              <Flex justify="flex-end" gap={2} mt={4}>
                <Button
                  size="sm"
                  variant="ghost"
                  colorPalette="gray"
                  onClick={() => changeOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  colorPalette="red"
                  onClick={() => {
                    changeOpen(false);
                    onConfirm();
                  }}
                >
                  Delete
                </Button>
              </Flex>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};
