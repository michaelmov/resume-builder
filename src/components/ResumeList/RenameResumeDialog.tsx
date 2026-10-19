import { Button, Field, Input } from '@chakra-ui/react';
import { FormEvent, useEffect, useRef, useState } from 'react';

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

interface RenameResumeDialogProps {
  /** The resume being renamed; `null` keeps the dialog closed. */
  resume: ResumeSummary | null;
  onCancel: () => void;
  /** Called only with a non-blank name that differs from the current one. */
  onRename: (name: string) => void;
}

/** Matches `EditableTitle`, so a name fits wherever either one is edited. */
const MAX_NAME_LENGTH = 80;

/**
 * Renaming from the list. A modal rather than an inline field because the
 * whole card is a link into the editor — an editable name inside it would
 * fight that click target.
 *
 * Blank can't be submitted, for the same reason `EditableTitle` reverts it: a
 * card with no name is unrecoverable from the UI.
 */
export const RenameResumeDialog = ({
  resume,
  onCancel,
  onRename,
}: RenameResumeDialogProps) => {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reseed on every open, so a cancelled edit doesn't linger into the next.
  useEffect(() => {
    if (resume) setDraft(resume.name);
  }, [resume]);

  const trimmed = draft.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!resume || !trimmed) return;
    if (trimmed === resume.name) {
      onCancel();
      return;
    }
    onRename(trimmed);
  };

  return (
    <DialogRoot
      open={resume !== null}
      onOpenChange={(details) => {
        if (!details.open) onCancel();
      }}
      initialFocusEl={() => inputRef.current}
      placement="center"
      size="sm"
    >
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Rename resume</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Field.Root>
              <Field.Label>Name</Field.Label>
              <Input
                ref={inputRef}
                value={draft}
                maxLength={MAX_NAME_LENGTH}
                onChange={(event) => setDraft(event.target.value)}
                onFocus={(event) => event.target.select()}
              />
            </Field.Root>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" colorPalette="gray" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" colorPalette="brand" disabled={!trimmed}>
              Rename
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
};
