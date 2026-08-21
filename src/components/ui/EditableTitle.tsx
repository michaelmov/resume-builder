import { Editable, IconButton } from '@chakra-ui/react';
import { FC, useEffect, useState } from 'react';
import { HiOutlinePencil } from 'react-icons/hi';

export interface EditableTitleProps {
  value: string;
  /** Called only when the name actually changed to something non-blank. */
  onCommit: (next: string) => void;
  /** Open in edit mode with the text selected — used by a just-created resume. */
  autoEdit?: boolean;
  /** Drive edit mode from outside, e.g. a card's "Rename" menu item. */
  edit?: boolean;
  onEditChange?: (edit: boolean) => void;
  /** Accessible name for the input and the pencil trigger. */
  label?: string;
  fontSize?: string;
  fontWeight?: string;
  maxWidth?: string;
}

/**
 * Click-to-edit name, shared by the editor's title bar and the list card's
 * Rename action so a resume is renamed the same way wherever you are.
 *
 * Blank reverts rather than committing: a card or title bar with no name is
 * unrecoverable from the UI, and an empty field is far more often a
 * select-all-and-tab-away accident than an intention.
 */
export const EditableTitle: FC<EditableTitleProps> = ({
  value,
  onCommit,
  autoEdit = false,
  edit,
  onEditChange,
  label = 'Resume name',
  fontSize = 'sm',
  fontWeight = 'medium',
  maxWidth = '20rem',
}) => {
  const [draft, setDraft] = useState(value);
  const [internalEdit, setInternalEdit] = useState(autoEdit);

  // Controlled when `edit` is supplied, self-managing otherwise — so the title
  // bar can just be clicked while the list card also opens it from a menu.
  const editing = edit ?? internalEdit;
  const setEditing = (next: boolean) => {
    setInternalEdit(next);
    onEditChange?.(next);
  };

  // Adopt renames made elsewhere (the other screen, or an import), but never
  // over the top of an edit in progress.
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = (next: string) => {
    const trimmed = next.trim();
    if (!trimmed) {
      setDraft(value);
      return;
    }
    setDraft(trimmed);
    if (trimmed !== value) onCommit(trimmed);
  };

  return (
    <Editable.Root
      className="group"
      value={draft}
      edit={editing}
      onEditChange={(details) => setEditing(details.edit)}
      onValueChange={(details) => setDraft(details.value)}
      onValueCommit={(details) => commit(details.value)}
      onValueRevert={() => setDraft(value)}
      activationMode="click"
      selectOnFocus
      maxLength={80}
      display="flex"
      alignItems="center"
      gap={0.5}
      width="auto"
      // `minWidth={0}` is what actually lets the name truncate: a flex item
      // defaults to min-content, so without it the preview forces the row wider
      // than the card and the text is clipped mid-word with no ellipsis.
      minWidth={0}
      maxWidth={maxWidth}
      fontSize={fontSize}
      fontWeight={fontWeight}
    >
      <Editable.Preview
        px={2}
        py={1}
        rounded="md"
        truncate
        display="block"
        minWidth={0}
        _hover={{ bg: 'bg.muted' }}
      />
      <Editable.Input px={2} py={1} minWidth={0} aria-label={label} />
      <Editable.Control flexShrink={0}>
        <Editable.EditTrigger asChild>
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="gray"
            color="fg.muted"
            aria-label={label}
            // Dimmed until the row is hovered or keyboard-focused: the title is
            // chrome, and a permanently bright pencil competes with the name.
            opacity={0.35}
            _groupHover={{ opacity: 1 }}
            _focusVisible={{ opacity: 1 }}
          >
            <HiOutlinePencil />
          </IconButton>
        </Editable.EditTrigger>
      </Editable.Control>
    </Editable.Root>
  );
};
