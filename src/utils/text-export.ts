import { resolveSectionOrder, Resume, SectionTypes } from '../types/resume.model';

import { formatDate } from './date-utilities';
import { ensureProtocol } from './url-utilities';

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
  if (resume.basics?.url) contactInfo.push(ensureProtocol(resume.basics.url)!);

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

  // Reorderable sections follow the order chosen in the Editor.
  const sectionBuilders: Partial<Record<SectionTypes, () => string[]>> = {
    [SectionTypes.Skills]: () => {
      if (
        !resume.skills ||
        resume.skills.length === 0 ||
        resume.sectionVisibility?.skills
      ) {
        return [];
      }

      const lines: string[] = ['SKILLS'];
      resume.skills.forEach((skill) => {
        if (skill.name && skill.keywords && skill.keywords.length > 0) {
          const keywords = skill.keywords
            .map((keyword) => keyword.value)
            .join(', ');
          lines.push(`${skill.name}: ${keywords}`);
        }
      });
      lines.push(''); // Empty line
      return lines;
    },

    [SectionTypes.Work]: () => {
      if (
        !resume.work ||
        resume.work.length === 0 ||
        resume.sectionVisibility?.work
      ) {
        return [];
      }

      const lines: string[] = ['WORK EXPERIENCE'];
      resume.work.forEach((work) => {
        const startDate = formatDate(work.startDate);
        const endDate = formatDate(work.endDate) || 'Present';

        lines.push(
          `${work.name} | ${work.position} | ${startDate} - ${endDate}`
        );

        if (work.summary) {
          lines.push(work.summary);
        }

        if (work.highlights && work.highlights.length > 0) {
          work.highlights.forEach((highlight) => {
            lines.push(`• ${highlight.value}`);
          });
        }

        lines.push(''); // Empty line between work experiences
      });
      return lines;
    },

    [SectionTypes.Education]: () => {
      if (
        !resume.education ||
        resume.education.length === 0 ||
        resume.sectionVisibility?.education
      ) {
        return [];
      }

      const lines: string[] = ['EDUCATION'];
      resume.education.forEach((education) => {
        const startDate = formatDate(education.startDate);
        const endDate = formatDate(education.endDate);
        const dateRange =
          startDate && endDate ? ` | ${startDate} - ${endDate}` : '';

        lines.push(`${education.institution} | ${education.area}${dateRange}`);
      });
      lines.push(''); // Empty line
      return lines;
    },

    [SectionTypes.Projects]: () => {
      if (
        !resume.projects ||
        resume.projects.length === 0 ||
        resume.sectionVisibility?.projects
      ) {
        return [];
      }

      const lines: string[] = ['PROJECTS'];
      resume.projects.forEach((project) => {
        const startDate = formatDate(project.startDate);
        const endDate = formatDate(project.endDate);
        const dateRange =
          startDate && endDate ? ` | ${startDate} - ${endDate}` : '';

        lines.push(`${project.name}${dateRange}`);

        if (project.description) {
          lines.push(project.description);
        }

        if (project.highlights && project.highlights.length > 0) {
          project.highlights.forEach((highlight) => {
            lines.push(`• ${highlight}`);
          });
        }

        lines.push(''); // Empty line between projects
      });
      return lines;
    },
  };

  resolveSectionOrder(resume.sectionOrder).forEach((sectionType) => {
    const build = sectionBuilders[sectionType];
    if (build) {
      sections.push(...build());
    }
  });

  return sections.join('\n');
};
