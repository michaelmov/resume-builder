import { Editable, IconButton } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { HiOutlinePencil } from 'react-icons/hi';

export interface EditableTitleProps {
  value: string;
  /** Called only when the name actually changed to something non-blank. */
  onCommit: (next: string) => void;
  /** Open in edit mode with the text selected — used by a just-created resume. */
  autoEdit?: boolean;
  /** Accessible name for the input and the pencil trigger. */
  label?: string;
  fontSize?: string;
  fontWeight?: string;
  maxWidth?: string;
}

/**
 * Both slots take their height from the text itself, so the equal `py` is what
 * centers it. Chakra's recipe instead pads them out to a `min-height` taller
 * than the line — which centers the text only while the slot is a flex
 * container. The preview can't be one (see `display: block` below), so its text
 * sat at the top of the slot, visibly above the pencil beside it; the input,
 * which centers its own text, then dropped it a few pixels on entering edit
 * mode. Pinning `lineHeight` as well keeps the two exactly the same height,
 * since an `input` doesn't inherit line-height from the root the way the
 * preview's block box does.
 */
const slotHeight = {
  px: 2,
  py: 1,
  lineHeight: '1.5rem',
  minHeight: 0,
} as const;

/**
 * Click-to-edit name, shared by the editor's title bar and the list card so a
 * resume is renamed the same way wherever you are. It owns its own edit mode —
 * clicking the name or its pencil is the only way in.
 *
 * Blank reverts rather than committing: a card or title bar with no name is
 * unrecoverable from the UI, and an empty field is far more often a
 * select-all-and-tab-away accident than an intention.
 */
export const EditableTitle = ({
  value,
  onCommit,
  autoEdit = false,
  label = 'Resume name',
  fontSize = 'sm',
  fontWeight = 'medium',
  maxWidth = '20rem',
}: EditableTitleProps) => {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(autoEdit);

  // Adopt renames made elsewhere (the other page, or an import), but never over
  // the top of an edit in progress.
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
        rounded="md"
        truncate
        // `display: block` (Chakra's recipe makes this slot `inline-flex`) is
        // what lets `truncate` ellipsize at all — `text-overflow` has no effect
        // on a flex container, whose text is an anonymous item. It also drops
        // the recipe's `alignItems: center`, so see `slotHeight` above.
        display="block"
        {...slotHeight}
        minWidth={0}
        _hover={{ bg: 'bg.muted' }}
      />
      <Editable.Input {...slotHeight} minWidth={0} aria-label={label} />
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
