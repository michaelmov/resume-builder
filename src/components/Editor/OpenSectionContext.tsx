import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

interface OpenSectionContextValue {
  openSectionId: string | null;
  setOpenSectionId: (id: string | null) => void;
}

const OpenSectionContext = createContext<OpenSectionContextValue | undefined>(
  undefined
);

interface OpenSectionProviderProps {
  children: ReactNode;
  /** Section that should start expanded; `null` opens none. */
  defaultOpenId?: string | null;
}

/**
 * Tracks which single editor section is expanded so the sections behave like an
 * accordion: opening one collapses whichever was open before.
 */
export const OpenSectionProvider: FC<OpenSectionProviderProps> = ({
  children,
  defaultOpenId = null,
}) => {
  const [openSectionId, setOpenSectionId] = useState<string | null>(
    defaultOpenId
  );

  const value = useMemo(
    () => ({ openSectionId, setOpenSectionId }),
    [openSectionId]
  );

  return (
    <OpenSectionContext.Provider value={value}>
      {children}
    </OpenSectionContext.Provider>
  );
};

/**
 * Imperatively open a section by id (or close all with `null`). Used when a
 * newly added section should expand so it's ready to fill in.
 */
export const useOpenSection = (): ((id: string | null) => void) => {
  const context = useContext(OpenSectionContext);
  return context?.setOpenSectionId ?? (() => undefined);
};

/**
 * Open/close state for a single section. Within an `OpenSectionProvider` the
 * state is shared (accordion); outside one it falls back to local state so the
 * section still works standalone.
 */
export const useSectionOpenState = (
  id: string
): [boolean, (open: boolean) => void] => {
  const context = useContext(OpenSectionContext);
  const [localOpen, setLocalOpen] = useState(false);

  const setShared = context?.setOpenSectionId;
  const setIsOpen = useCallback(
    (open: boolean) => {
      if (setShared) {
        setShared(open ? id : null);
      } else {
        setLocalOpen(open);
      }
    },
    [setShared, id]
  );

  const isOpen = context ? context.openSectionId === id : localOpen;

  return [isOpen, setIsOpen];
};
