import { createContext, FC, ReactNode, useContext } from 'react';

import { SectionTypes } from '../../types/resume.model';

interface SectionActionsValue {
  /** Stage removal of a section type (committed on "Save All Changes"). */
  removeSection: (id: SectionTypes) => void;
}

const SectionActionsContext = createContext<SectionActionsValue | null>(null);

export const SectionActionsProvider: FC<{
  value: SectionActionsValue;
  children: ReactNode;
}> = ({ value, children }) => (
  <SectionActionsContext.Provider value={value}>
    {children}
  </SectionActionsContext.Provider>
);

/**
 * Section-level actions (currently: remove) exposed to the section header.
 * Returns null outside a provider so a section can still render standalone.
 */
export const useSectionActions = (): SectionActionsValue | null =>
  useContext(SectionActionsContext);
