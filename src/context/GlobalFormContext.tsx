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
}

interface GlobalFormContextType {
  sections: Record<string, SectionFormState | null>;
  registerSection: (sectionId: string, formState: SectionFormState) => void;
  unregisterSection: (sectionId: string) => void;
  hasAnyDirtySection: boolean;
  saveAllSections: () => void;
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

  return (
    <GlobalFormContext.Provider
      value={{
        sections,
        registerSection,
        unregisterSection,
        hasAnyDirtySection,
        saveAllSections,
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
