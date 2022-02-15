import { useContext } from 'react';
import { resumeStoreContext } from '../context/resume.context';
import { ACTIONS } from '../context/resume.reducer';
import { Resume } from '../models/resume.model';

export const useResume = () => {
  const { dispatch, state } = useContext(resumeStoreContext);

  const updateResume = (updated: Resume) => {
    dispatch({ type: ACTIONS.updateResume, payload: updated });
  };
  return { resume: state, updateResume };
};
