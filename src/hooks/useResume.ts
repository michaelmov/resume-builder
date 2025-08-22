import { useContext, useCallback } from 'react';

import { resumeStoreContext } from '../context/resume.context';
import { ACTIONS } from '../context/resume.reducer';
import { Basics, Resume, Skill, Work, Education } from '../types/resume.model';

export const useResume = () => {
  const { dispatch, state } = useContext(resumeStoreContext);

  const updateResume = useCallback(
    (updated: Resume) => {
      if (dispatch) {
        dispatch({ type: ACTIONS.updateResume, payload: updated });
      }
    },
    [dispatch]
  );

  const updateBasics = useCallback(
    (payload: Basics) => {
      if (dispatch) {
        dispatch({ type: ACTIONS.updateBasics, payload });
      }
    },
    [dispatch]
  );

  const updateSkills = useCallback(
    (payload: Skill[]) => {
      if (dispatch) {
        dispatch({ type: ACTIONS.updateSkills, payload });
      }
    },
    [dispatch]
  );

  const updateWork = useCallback(
    (payload: Work[]) => {
      if (dispatch) {
        dispatch({ type: ACTIONS.updateWork, payload });
      }
    },
    [dispatch]
  );

  const updateEducation = useCallback(
    (payload: Education[]) => {
      if (dispatch) {
        dispatch({ type: ACTIONS.updateEducation, payload });
      }
    },
    [dispatch]
  );

  return {
    resume: state,
    updateResume,
    updateBasics,
    updateSkills,
    updateWork,
    updateEducation,
  };
};
