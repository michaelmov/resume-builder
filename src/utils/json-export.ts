import { Resume } from '../types/resume.model';

export const exportResumeAsJson = (resume: Resume, exportFileName: string) => {
  try {
    // Create a filtered resume based on section visibility
    const filteredResume = { ...resume };

    if (resume.sectionVisibility?.skills) {
      filteredResume.skills = [];
    }
    if (resume.sectionVisibility?.work) {
      filteredResume.work = [];
    }
    if (resume.sectionVisibility?.education) {
      filteredResume.education = [];
    }
    if (resume.sectionVisibility?.projects) {
      filteredResume.projects = [];
    }

    const resumeData = JSON.stringify(filteredResume, null, 2);
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
