import {
  REORDERABLE_SECTIONS,
  resolveSectionOrder,
  Resume,
} from '../types/resume.model';

import { toJsonResume } from './jsonresume';

export const exportResumeAsJson = (resume: Resume, exportFileName: string) => {
  try {
    // Only sections currently on the resume are exported; any section type not
    // in the active set is emptied so removed/never-added sections don't leak.
    const activeSections = new Set(resolveSectionOrder(resume.sectionOrder));
    const filteredResume: Resume = { ...resume };
    const mutable = filteredResume as unknown as Record<string, unknown>;
    REORDERABLE_SECTIONS.forEach((type) => {
      if (!activeSections.has(type)) {
        mutable[type] = [];
      }
    });

    // Convert to the standard JSON Resume schema so the file interoperates
    // with other JSON Resume tooling.
    const resumeData = JSON.stringify(toJsonResume(filteredResume), null, 2);
    const blob = new Blob([resumeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportFileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting JSON:', error);
  }
};
