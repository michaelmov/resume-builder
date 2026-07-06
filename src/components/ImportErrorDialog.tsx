import { Button, Text } from '@chakra-ui/react';
import { FC } from 'react';

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from './ui/Dialog';

interface ImportErrorDialogProps {
  error: string | null;
  onClose: () => void;
}

export const ImportErrorDialog: FC<ImportErrorDialogProps> = ({
  error,
  onClose,
}) => {
  return (
    <DialogRoot
      open={!!error}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      role="alertdialog"
      placement="center"
      size="md"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Couldn&apos;t import resume</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Text color="fg.muted">{error}</Text>
        </DialogBody>
        <DialogFooter>
          <Button colorPalette="brand" onClick={onClose}>
            OK
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
};
