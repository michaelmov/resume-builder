import { Box, Button, Text } from '@chakra-ui/react';
import { FC } from 'react';

import { ImportError } from '../hooks/useJsonImport';

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
  error: ImportError | null;
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
          <Text color="fg.muted">{error?.message}</Text>
          {error?.detail && (
            <Box
              as="pre"
              mt={3}
              px={3}
              py={2}
              colorPalette="red"
              bg="colorPalette.subtle"
              color="colorPalette.fg"
              borderWidth="1px"
              borderColor="colorPalette.muted"
              rounded="md"
              fontFamily="mono"
              fontSize="xs"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              maxH="40"
              overflowY="auto"
            >
              {error.detail}
            </Box>
          )}
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
