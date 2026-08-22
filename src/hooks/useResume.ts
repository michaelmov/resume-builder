import { useContext, useCallback } from 'react';

import { resumeStoreContext } from '../context/ResumeContext/ResumeContext';
import { ACTIONS, SectionData } from '../context/ResumeContext/ResumeReducer';
import { Resume, SectionTitles, SectionTypes } from '../types/resume.model';

export const useResume = () => {
  const { dispatch, state, settings, updateSettings } =
    useContext(resumeStoreContext);

  const updateResume = useCallback(
    (updated: Resume) => {
      dispatch?.({ type: ACTIONS.updateResume, payload: updated });
    },
    [dispatch]
  );

  /** Commit a single section's data (Basics object or any section array). */
  const updateSectionData = useCallback(
    (section: SectionTypes, data: SectionData) => {
      dispatch?.({ type: ACTIONS.updateSection, payload: { section, data } });
    },
    [dispatch]
  );

  const updateSectionOrder = useCallback(
    (payload: SectionTypes[]) => {
      dispatch?.({ type: ACTIONS.updateSectionOrder, payload });
    },
    [dispatch]
  );

  const updateSectionTitles = useCallback(
    (payload: SectionTitles | undefined) => {
      dispatch?.({ type: ACTIONS.updateSectionTitles, payload });
    },
    [dispatch]
  );

  return {
    resume: state,
    /** Template / accent / margin for this resume, persisted alongside it. */
    settings,
    updateSettings,
    updateResume,
    updateSectionData,
    updateSectionOrder,
    updateSectionTitles,
  };
};
