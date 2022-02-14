import { useContext } from 'react';
import { resumeStoreContext } from '../context/resume.context';
import { ACTIONS } from '../context/resume.reducer';
import { Basics } from '../models/resume.model';

export const useResume = () => {
  const { dispatch, state } = useContext(resumeStoreContext);

  const updateBasics = (updated: Basics) => {
    dispatch({ type: ACTIONS.updateBasics, payload: updated });
  };
  return { resume: state, basics: state.basics, updateBasics };
};
