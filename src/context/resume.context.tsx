import React, {
  createContext,
  Dispatch,
  FC,
  useEffect,
  useReducer,
} from 'react';

import { useResumeLocalStorage } from '../hooks/useResumeLocalStorage';
import { resumeMock } from '../mocks/resume.mock';
import { Resume } from '../types/resume.model';

import { ACTIONTYPE, resumeReducer } from './resume.reducer';

interface ResumeContext {
  state: Resume;
  dispatch: Dispatch<ACTIONTYPE> | null;
}

const resumeStoreContext = createContext<ResumeContext>({
  state: resumeMock,
  dispatch: null,
});
const { Provider } = resumeStoreContext;

const ResumeProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getResume, saveResume } = useResumeLocalStorage();
  let localStorageData = getResume();

  const [state, dispatch] = useReducer(
    resumeReducer,
    localStorageData ? localStorageData : resumeMock
  );

  useEffect(() => {
    saveResume(state);
  }, [state, saveResume]);

  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { resumeStoreContext, ResumeProvider };
