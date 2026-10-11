import { createContext, ReactNode, useContext, useEffect, useRef } from 'react';

import { SectionTypes } from '../../types/resume.model';

interface SectionActionsValue {
  /** Stage removal of a section type (committed on "Save All Changes"). */
  removeSection: (id: SectionTypes) => void;
  /** Pending effective display title for a section (override or default). */
  getSectionTitle: (id: SectionTypes) => string;
  /**
   * Stage a section rename (committed on "Save All Changes"). An empty/blank
   * title restores the built-in default.
   */
  renameSection: (id: SectionTypes, title: string) => void;
  /**
   * Whether this section was just added from the picker. Reading it clears the
   * flag, so it answers `true` once per add.
   */
  consumeJustAdded: (id: SectionTypes) => boolean;
}

const SectionActionsContext = createContext<SectionActionsValue | null>(null);

export const SectionActionsProvider = ({
  value,
  children,
}: {
  value: SectionActionsValue;
  children: ReactNode;
}) => (
  <SectionActionsContext.Provider value={value}>
    {children}
  </SectionActionsContext.Provider>
);

/**
 * Section-level actions (remove, rename) exposed to the section header.
 * Returns null outside a provider so a section can still render standalone.
 */
export const useSectionActions = (): SectionActionsValue | null =>
  useContext(SectionActionsContext);

/**
 * Gives a section its first entry when it is added from the picker, so it opens
 * on a form to fill in rather than on a lone "Add" button. A section that
 * mounts for any other reason (opening a resume, a reorder) is left alone, as
 * is one that already has entries.
 *
 * Call it after `useAutoCommitSection`: effects run in hook order, and the
 * append has to land once the auto-save subscription is listening or the new
 * entry would never be committed.
 */
export const useSeedEntryOnSectionAdd = (
  id: SectionTypes,
  isEmpty: boolean,
  addEntry: () => void
): void => {
  const consumeJustAdded = useSectionActions()?.consumeJustAdded;
  const isEmptyRef = useRef(isEmpty);
  const addEntryRef = useRef(addEntry);
  isEmptyRef.current = isEmpty;
  addEntryRef.current = addEntry;

  useEffect(() => {
    if (consumeJustAdded?.(id) && isEmptyRef.current) {
      addEntryRef.current();
    }
  }, [consumeJustAdded, id]);
};
