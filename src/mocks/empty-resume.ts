import { Resume } from '../types/resume.model';

/**
 * A complete but empty `Resume` so tests only set the fields they care about.
 * Mirrors the shape required by the `Resume` interface (all sections present
 * but empty), letting callers spread overrides on top.
 */
export const emptyResume = (): Resume => ({
  basics: {
    name: '',
    label: '',
    image: '',
    email: '',
    phone: '',
    url: '',
    summary: '',
  },
  work: [],
  volunteer: [],
  education: [],
  awards: [],
  certificates: [],
  publications: [],
  skills: [],
  languages: [],
  interests: [],
  references: [],
  projects: [],
});
