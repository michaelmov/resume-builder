import { UNTITLED_RESUME_NAME } from '../context/ResumeLibraryContext/ResumeLibraryContext';
import { Resume } from '../types/resume.model';

/** Push a blob to the user as a file download. */
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * What an exported file is called. The resume's own name wins: with several
 * resumes in the library it's what distinguishes two exports of the same
 * profile, and it's the label the user chose. A resume still called "Untitled
 * resume" falls back to the derivation used before names existed.
 *
 * Shared so the editor's Export menu and the list card's Download menu can't
 * drift into naming the same file two different things.
 */
export const resumeExportFileName = (
  resumeName: string,
  resume: Resume
): string => {
  const named = resumeName.trim();
  if (named && named !== UNTITLED_RESUME_NAME) return named;

  if (resume.basics?.name && resume.basics?.label) {
    return `${resume.basics.name} - ${resume.basics.label}`;
  }

  return 'my-resume';
};
