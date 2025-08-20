import { useContext } from 'react';
import { resumeStoreContext } from '../context/resume.context';
import { ACTIONS } from '../context/resume.reducer';
import { Basics, Resume, Skill, Work, Education } from '../types/resume.model';

export const useResume = () => {
  const { dispatch, state } = useContext(resumeStoreContext);

  const updateResume = (updated: Resume) => {
    dispatch && dispatch({ type: ACTIONS.updateResume, payload: updated });
  };
  const updateBasics = (payload: Basics) => {
    dispatch && dispatch({ type: ACTIONS.updateBasics, payload });
  };
  const updateSkills = (payload: Skill[]) => {
    dispatch && dispatch({ type: ACTIONS.updateSkills, payload });
  };

  const updateWork = (payload: Work[]) => {
    dispatch && dispatch({ type: ACTIONS.updateWork, payload });
  };

  const updateEducation = (payload: Education[]) => {
    dispatch && dispatch({ type: ACTIONS.updateEducation, payload });
  };

  return {
    resume: state,
    updateResume,
    updateBasics,
    updateSkills,
    updateWork,
    updateEducation,
  };
};
