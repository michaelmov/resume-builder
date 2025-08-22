import { Resume } from '../types/resume.model';

import { formatDate } from './date-utilities';

export const exportResumeAsText = (resume: Resume, fileName: string) => {
  const textContent = generateAtsCompliantText(resume);
  const blob = new Blob([textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

const generateAtsCompliantText = (resume: Resume): string => {
  const sections: string[] = [];

  // Header Section
  if (resume.basics?.name) {
    sections.push(resume.basics.name.toUpperCase());
  }

  if (resume.basics?.label) {
    sections.push(resume.basics.label);
  }

  // Contact Information
  const contactInfo: string[] = [];
  if (resume.basics?.location?.city)
    contactInfo.push(resume.basics.location.city);
  if (resume.basics?.phone) contactInfo.push(resume.basics.phone);
  if (resume.basics?.email) contactInfo.push(resume.basics.email);
  if (resume.basics?.url) contactInfo.push(resume.basics.url);

  if (contactInfo.length > 0) {
    sections.push(contactInfo.join(' | '));
  }

  sections.push(''); // Empty line

  // Summary Section
  if (resume.basics?.summary) {
    sections.push('SUMMARY');
    sections.push(resume.basics.summary);
    sections.push(''); // Empty line
  }

  // Skills Section
  if (resume.skills && resume.skills.length > 0) {
    sections.push('SKILLS');
    resume.skills.forEach((skill) => {
      if (skill.name && skill.keywords && skill.keywords.length > 0) {
        const keywords = skill.keywords
          .map((keyword) => keyword.value)
          .join(', ');
        sections.push(`${skill.name}: ${keywords}`);
      }
    });
    sections.push(''); // Empty line
  }

  // Work Experience Section
  if (resume.work && resume.work.length > 0) {
    sections.push('WORK EXPERIENCE');
    resume.work.forEach((work) => {
      const startDate = formatDate(work.startDate);
      const endDate = formatDate(work.endDate) || 'Present';

      sections.push(
        `${work.name} | ${work.position} | ${startDate} - ${endDate}`
      );

      if (work.summary) {
        sections.push(work.summary);
      }

      if (work.highlights && work.highlights.length > 0) {
        work.highlights.forEach((highlight) => {
          sections.push(`• ${highlight.value}`);
        });
      }

      sections.push(''); // Empty line between work experiences
    });
  }

  // Education Section
  if (resume.education && resume.education.length > 0) {
    sections.push('EDUCATION');
    resume.education.forEach((education) => {
      const startDate = formatDate(education.startDate);
      const endDate = formatDate(education.endDate);
      const dateRange =
        startDate && endDate ? ` | ${startDate} - ${endDate}` : '';

      sections.push(`${education.institution} | ${education.area}${dateRange}`);
    });
  }

  return sections.join('\n');
};
