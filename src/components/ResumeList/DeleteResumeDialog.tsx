import { Button, Text } from '@chakra-ui/react';
import { FC } from 'react';

import { ResumeSummary } from '../../types/resume-library';
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from '../ui/Dialog';

interface DeleteResumeDialogProps {
  /** The resume awaiting confirmation; `null` keeps the dialog closed. */
  resume: ResumeSummary | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Deleting a resume is final — there is no server, no trash, and no undo
 * history. A modal rather than the section-level confirm popover, because
 * losing a whole resume is a different order of mistake, and it names the
 * resume so the wrong card can't be deleted by muscle memory.
 */
export const DeleteResumeDialog: FC<DeleteResumeDialogProps> = ({
  resume,
  onCancel,
  onConfirm,
}) => (
  <DialogRoot
    open={resume !== null}
    onOpenChange={(details) => {
      if (!details.open) onCancel();
    }}
    placement="center"
    role="alertdialog"
    size="sm"
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete &ldquo;{resume?.name}&rdquo;?</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <Text fontSize="sm" color="fg.muted">
          Its content and PDF settings are removed from this browser. This
          can&apos;t be undone.
        </Text>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" colorPalette="gray" onClick={onCancel}>
          Cancel
        </Button>
        <Button colorPalette="red" onClick={onConfirm}>
          Delete resume
        </Button>
      </DialogFooter>
      <DialogCloseTrigger />
    </DialogContent>
  </DialogRoot>
);
