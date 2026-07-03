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
  /**
   * True once the provider's initial children have mounted. A subsection that
   * mounts *after* that (a freshly added entry) uses this to auto-expand.
   */
  hasInitialized: () => boolean;
}

const OpenSubsectionContext = createContext<
  OpenSubsectionContextValue | undefined
>(undefined);

interface OpenSubsectionProviderProps {
  children: ReactNode;
}

/**
 * Scopes the entries within a single parent section (e.g. each Work role) to an
 * accordion: opening one collapses whichever was open before. Mirrors the
 * top-level section accordion in `OpenSectionContext`, but one provider is
 * mounted per parent section so entries only coordinate with their siblings.
 */
export const OpenSubsectionProvider: FC<OpenSubsectionProviderProps> = ({
  children,
}) => {
  const [openSubsectionId, setOpenSubsectionId] = useState<string | null>(null);

  // Children effects run before this one, so during the initial mount every
  // existing entry sees `false` (and stays collapsed); anything that mounts
  // later — a newly added entry — sees `true` and expands itself.
  const initializedRef = useRef(false);
  useEffect(() => {
    initializedRef.current = true;
  }, []);
  const hasInitialized = useCallback(() => initializedRef.current, []);

  const value = useMemo(
    () => ({ openSubsectionId, setOpenSubsectionId, hasInitialized }),
    [openSubsectionId, hasInitialized]
  );

  return (
    <OpenSubsectionContext.Provider value={value}>
      {children}
    </OpenSubsectionContext.Provider>
  );
};

/**
 * Open/close state for a single subsection entry. Within an
 * `OpenSubsectionProvider` the state is shared (accordion); outside one it
 * falls back to local state, defaulting open, so the entry still works
 * standalone.
 */
export const useSubsectionOpenState = (
  id: string
): [boolean, (open: boolean) => void] => {
  const context = useContext(OpenSubsectionContext);
  const [localOpen, setLocalOpen] = useState(true);

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

  // A subsection added after the initial render (via "Add …") auto-expands,
  // collapsing whatever was open — matching the click-to-open accordion flow.
  const hasInitialized = context?.hasInitialized;
  useEffect(() => {
    if (hasInitialized?.()) {
      setShared?.(id);
    }
    // Mount-only: `id`, `setShared`, and `hasInitialized` are stable for the
    // lifetime of a given entry, and we only want this to fire when it mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOpen = context ? context.openSubsectionId === id : localOpen;

  return [isOpen, setIsOpen];
};
