import { Resume } from '../types/resume.model';

const RESUME_KEY = 'resume-data';

export const useResumeLocalStorage = () => {
  const getResume = (): Resume | undefined => {
    const data = window.localStorage.getItem(RESUME_KEY);
    if (data) return JSON.parse(data) as Resume;
  };

  const saveResume = (resume: Resume): void => {
    window.localStorage.setItem(RESUME_KEY, JSON.stringify(resume));
  };

  return {
    getResume,
    saveResume,
  };
};
