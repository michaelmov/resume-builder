import { Resume } from '../types/resume.model';

const RESUME_KEY = 'resume-data';

/**
 * Migrate older saved resumes to the current model. `interests[].keywords` used
 * to be `string[]`; it is now `{ value }[]` (so the editor can reuse the Skills
 * tag input), so coerce any legacy string entries on load.
 */
const migrateResume = (resume: Resume): Resume => {
  if (Array.isArray(resume.interests)) {
    resume.interests = resume.interests.map((interest) => ({
      ...interest,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      keywords: ((interest?.keywords as any[]) ?? []).map((keyword) =>
        typeof keyword === 'string' ? { value: keyword } : keyword
      ),
    }));
  }
  return resume;
};

export const useResumeLocalStorage = () => {
  const getResume = (): Resume | undefined => {
    const data = window.localStorage.getItem(RESUME_KEY);
    if (data) return migrateResume(JSON.parse(data) as Resume);
  };

  const saveResume = (resume: Resume): void => {
    window.localStorage.setItem(RESUME_KEY, JSON.stringify(resume));
  };

  return {
    getResume,
    saveResume,
  };
};
