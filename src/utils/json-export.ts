import { Resume } from '../types/resume.model';

export const exportResumeAsJson = (resume: Resume, exportFileName: string) => {
  try {
    const resumeData = JSON.stringify(resume, null, 2);
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
