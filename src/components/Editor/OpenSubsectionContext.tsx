import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface OpenSubsectionContextValue {
  openSubsectionId: string | null;
  setOpenSubsectionId: (id: string | null) => void;
}

const OpenSubsectionContext = createContext<
  OpenSubsectionContextValue | undefined
>(undefined);

interface OpenSubsectionProviderProps {
  children: ReactNode;
}

/**
 * Tracks which single entry inside one section is expanded, so entries behave
 * like the sections themselves: opening one collapses whichever was open
 * before. The `Editor` wraps each section in its own provider, so the accordion
 * is scoped per section and every section remembers its own open entry.
 */
export const OpenSubsectionProvider: FC<OpenSubsectionProviderProps> = ({
  children,
}) => {
  const [openSubsectionId, setOpenSubsectionId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ openSubsectionId, setOpenSubsectionId }),
    [openSubsectionId]
  );

  return (
    <OpenSubsectionContext.Provider value={value}>
      {children}
    </OpenSubsectionContext.Provider>
  );
};

/** Imperatively open an entry by id (or close all with `null`). */
export const useOpenSubsection = (): ((id: string | null) => void) => {
  const context = useContext(OpenSubsectionContext);
  return context?.setOpenSubsectionId ?? (() => undefined);
};

/**
 * Open/close state for a single entry. Within an `OpenSubsectionProvider` the
 * state is shared (accordion); outside one it falls back to local state so the
 * subsection still works standalone.
 */
export const useSubsectionOpenState = (
  id: string
): [boolean, (open: boolean) => void] => {
  const context = useContext(OpenSubsectionContext);
  const [localOpen, setLocalOpen] = useState(false);

  const setShared = context?.setOpenSubsectionId;
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

  const isOpen = context ? context.openSubsectionId === id : localOpen;

  return [isOpen, setIsOpen];
};

/**
 * Expands the entry a section has just appended. `useFieldArray` mints the new
 * entry's id inside `append`, so the caller can't name it up front: calling the
 * returned function flags the add, and the next id to show up at the end of
 * `fields` is the one that opens. Without this a freshly added (and therefore
 * untitled) entry would appear as a blank collapsed row.
 */
export const useOpenAppendedSubsection = (
  fields: { id: string }[]
): (() => void) => {
  const openSubsection = useOpenSubsection();
  const isPendingRef = useRef(false);
  const lastId = fields.length > 0 ? fields[fields.length - 1].id : null;

  useEffect(() => {
    if (isPendingRef.current && lastId) {
      isPendingRef.current = false;
      openSubsection(lastId);
    }
  }, [lastId, openSubsection]);

  return useCallback(() => {
    isPendingRef.current = true;
  }, []);
};
