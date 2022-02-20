import { useContext } from 'react';
import { resumeStoreContext } from '../context/resume.context';
import { ACTIONS } from '../context/resume.reducer';
import { Basics, Resume } from '../models/resume.model';

export const useResume = () => {
  const { dispatch, state } = useContext(resumeStoreContext);

  const updateResume = (updated: Resume) => {
    dispatch({ type: ACTIONS.updateResume, payload: updated });
  };
  const updateBasics = (section: Basics) => {
    dispatch({ type: ACTIONS.udpateBasics, payload: section });
  };
  return { resume: state, updateResume, updateBasics };
};
