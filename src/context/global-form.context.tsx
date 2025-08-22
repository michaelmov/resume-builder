import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';

import { useResume } from '../hooks/useResume';
import { SectionTypes } from '../types/resume.model';

interface SectionFormState {
  isDirty: boolean;
  handleSubmit: () => void;
}

interface GlobalFormContextType {
  sections: Record<SectionTypes, SectionFormState | null>;
  registerSection: (
    sectionType: SectionTypes,
    formState: SectionFormState
  ) => void;
  unregisterSection: (sectionType: SectionTypes) => void;
  hasAnyDirtySection: boolean;
  saveAllSections: () => void;
  getDirtySections: () => SectionTypes[];
}

const GlobalFormContext = createContext<GlobalFormContextType | null>(null);

export const GlobalFormProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sections, setSections] = useState<
    Record<SectionTypes, SectionFormState | null>
  >({
    [SectionTypes.Basics]: null,
    [SectionTypes.Skills]: null,
    [SectionTypes.Work]: null,
    [SectionTypes.Education]: null,
  });

  const registerSection = useCallback(
    (sectionType: SectionTypes, formState: SectionFormState) => {
      setSections((prev) => ({
        ...prev,
        [sectionType]: formState,
      }));
    },
    []
  );

  const unregisterSection = useCallback((sectionType: SectionTypes) => {
    setSections((prev) => ({
      ...prev,
      [sectionType]: null,
    }));
  }, []);

  const hasAnyDirtySection = useMemo(
    () => Object.values(sections).some((section) => section?.isDirty === true),
    [sections]
  );

  const getDirtySections = useCallback((): SectionTypes[] => {
    return Object.keys(sections).filter(
      (sectionType) => sections[sectionType as SectionTypes]?.isDirty === true
    ) as SectionTypes[];
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
