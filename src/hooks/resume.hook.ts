import { useContext } from 'react';
import { resumeStoreContext } from '../context/resume.context';
import { ACTIONS } from '../context/resume.reducer';
import { Basics, Resume, Skill, Work } from '../models/resume.model';

export const useResume = () => {
  const { dispatch, state } = useContext(resumeStoreContext);

  const updateResume = (updated: Resume) => {
    dispatch({ type: ACTIONS.updateResume, payload: updated });
  };
  const updateBasics = (payload: Basics) => {
    dispatch({ type: ACTIONS.updateBasics, payload });
  };
  const updateSkills = (payload: Skill[]) => {
    dispatch({ type: ACTIONS.updateSkills, payload });
  };

  const updateWork = (payload: Work[]) => {
    dispatch({ type: ACTIONS.updateWork, payload });
  };

  return {
    resume: state,
    updateResume,
    updateBasics,
    updateSkills,
    updateWork,
  };
};
