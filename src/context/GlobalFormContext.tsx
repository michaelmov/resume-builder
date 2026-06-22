import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';

interface SectionFormState {
  isDirty: boolean;
  handleSubmit: () => void;
  /** Revert this section's staged edits back to the last committed state. */
  reset?: () => void;
}

interface GlobalFormContextType {
  sections: Record<string, SectionFormState | null>;
  registerSection: (sectionId: string, formState: SectionFormState) => void;
  unregisterSection: (sectionId: string) => void;
  hasAnyDirtySection: boolean;
  saveAllSections: () => void;
  discardAllSections: () => void;
  getDirtySections: () => string[];
}

const GlobalFormContext = createContext<GlobalFormContextType | null>(null);

export const GlobalFormProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sections, setSections] = useState<
    Record<string, SectionFormState | null>
  >({});

  const registerSection = useCallback(
    (sectionId: string, formState: SectionFormState) => {
      setSections((prev) => ({
        ...prev,
        [sectionId]: formState,
      }));
    },
    []
  );

  const unregisterSection = useCallback((sectionId: string) => {
    setSections((prev) => ({
      ...prev,
      [sectionId]: null,
    }));
  }, []);

  const hasAnyDirtySection = useMemo(
    () => Object.values(sections).some((section) => section?.isDirty === true),
    [sections]
  );

  const getDirtySections = useCallback((): string[] => {
    return Object.keys(sections).filter(
      (sectionId) => sections[sectionId]?.isDirty === true
    );
  }, [sections]);

  const saveAllSections = useCallback(() => {
    Object.values(sections).forEach((section) => {
      if (section?.isDirty) {
        section.handleSubmit();
      }
    });
  }, [sections]);

  // Revert every section to its last committed state, discarding staged adds,
  // removes, reorders, and field edits in one action.
  const discardAllSections = useCallback(() => {
    Object.values(sections).forEach((section) => {
      if (section?.isDirty) {
        section.reset?.();
      }
    });
  }, [sections]);

  return (
    <GlobalFormContext.Provider
      value={{
        sections,
        registerSection,
        unregisterSection,
        hasAnyDirtySection,
        saveAllSections,
        discardAllSections,
        getDirtySections,
      }}
    >
      {children}
    </GlobalFormContext.Provider>
  );
};

export const useGlobalForm = () => {
  const context = useContext(GlobalFormContext);
  if (!context) {
    throw new Error('useGlobalForm must be used within a GlobalFormProvider');
  }
  return context;
};
