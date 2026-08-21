import { useContext } from 'react';

import { resumeLibraryContext } from '../context/ResumeLibraryContext/ResumeLibraryContext';

/**
 * Access the resume library — the list of resumes and the operations that
 * change it. Use this rather than `useContext` directly, mirroring
 * {@link useResume} for a single resume's content.
 */
export const useResumeLibrary = () => useContext(resumeLibraryContext);
