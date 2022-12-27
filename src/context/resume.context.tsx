import { jsx } from '@emotion/react';
import { createContext, Dispatch, FC, useEffect, useReducer } from 'react';
import { useResumeLocalStorage } from '../hooks/useResumeLocalStorage';
import { resumeMock } from '../mocks/resume.mock';
import { Resume } from '../models/resume.model';
import { ACTIONTYPE, resumeReducer } from './resume.reducer';

const resumeStoreContext = createContext({
  state: {} as Resume,
  dispatch: null as unknown as Dispatch<ACTIONTYPE>,
});
const { Provider } = resumeStoreContext;

const ResumeProvider: FC = ({ children }) => {
  const { getResume, saveResume } = useResumeLocalStorage();
  let localStorageData = getResume();

  const [state, dispatch] = useReducer(
    resumeReducer,
    localStorageData ? localStorageData : resumeMock
  );

  useEffect(() => {
    saveResume(state);
  }, [state]);

  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { resumeStoreContext, ResumeProvider };
