import {
  getSectionTitle,
  resolveSectionOrder,
  Resume,
  SectionTypes,
} from '../types/resume.model';

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

/** Join a list of cells with " | ", dropping the empty ones. */
const joinCells = (...cells: (string | undefined)[]): string =>
  cells.filter((cell) => cell && cell.trim() !== '').join(' | ');

export const generateAtsCompliantText = (resume: Resume): string => {
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

  const heading = (type: SectionTypes) =>
    getSectionTitle(type, resume.sectionTitles).toUpperCase();

  // One builder per reorderable section. Each returns an empty list when its
  // section has no content, so empty (and inactive) sections are omitted.
  const sectionBuilders: Partial<Record<SectionTypes, () => string[]>> = {
    [SectionTypes.Skills]: () => {
      if (!resume.skills?.length) return [];
      const lines = [heading(SectionTypes.Skills)];
      resume.skills.forEach((skill) => {
        if (skill.name && skill.keywords?.length) {
          lines.push(
            `${skill.name}: ${skill.keywords.map((k) => k.value).join(', ')}`
          );
        }
      });
      lines.push('');
      return lines;
    },

    [SectionTypes.Work]: () => {
      if (!resume.work?.length) return [];
      const lines = [heading(SectionTypes.Work)];
      resume.work.forEach((work) => {
        const endDate = formatDate(work.endDate) || 'Present';
        lines.push(
          joinCells(work.name, work.position, `${formatDate(work.startDate)} - ${endDate}`)
        );
        if (work.summary) lines.push(work.summary);
        work.highlights?.forEach((h) => lines.push(`• ${h.value}`));
        lines.push('');
      });
      return lines;
    },

    [SectionTypes.Volunteer]: () => {
      if (!resume.volunteer?.length) return [];
      const lines = [heading(SectionTypes.Volunteer)];
      resume.volunteer.forEach((v) => {
        const endDate = formatDate(v.endDate) || 'Present';
        lines.push(
          joinCells(v.organization, v.position, `${formatDate(v.startDate)} - ${endDate}`)
        );
        if (v.summary) lines.push(v.summary);
        v.highlights?.forEach((h) => lines.push(`• ${h.value}`));
        lines.push('');
      });
      return lines;
    },

    [SectionTypes.Education]: () => {
      if (!resume.education?.length) return [];
      const lines = [heading(SectionTypes.Education)];
      resume.education.forEach((education) => {
        const startDate = formatDate(education.startDate);
        const endDate = formatDate(education.endDate);
        const dateRange =
          startDate && endDate ? `${startDate} - ${endDate}` : '';
        lines.push(joinCells(education.institution, education.area, dateRange));
      });
      lines.push('');
      return lines;
    },

    [SectionTypes.Awards]: () => {
      if (!resume.awards?.length) return [];
      const lines = [heading(SectionTypes.Awards)];
      resume.awards.forEach((award) => {
        lines.push(joinCells(award.title, award.awarder, formatDate(award.date)));
        if (award.summary) lines.push(award.summary);
      });
      lines.push('');
      return lines;
    },

    [SectionTypes.Certificates]: () => {
      if (!resume.certificates?.length) return [];
      const lines = [heading(SectionTypes.Certificates)];
      resume.certificates.forEach((cert) => {
        lines.push(joinCells(cert.name, cert.issuer, formatDate(cert.date)));
      });
      lines.push('');
      return lines;
    },

    [SectionTypes.Publications]: () => {
      if (!resume.publications?.length) return [];
      const lines = [heading(SectionTypes.Publications)];
      resume.publications.forEach((pub) => {
        lines.push(
          joinCells(pub.name, pub.publisher, formatDate(pub.releaseDate))
        );
        if (pub.summary) lines.push(pub.summary);
      });
      lines.push('');
      return lines;
    },

    [SectionTypes.Languages]: () => {
      if (!resume.languages?.length) return [];
      const lines = [heading(SectionTypes.Languages)];
      resume.languages.forEach((lang) => {
        if (lang.language) {
          lines.push(joinCells(lang.language, lang.fluency));
        }
      });
      lines.push('');
      return lines;
    },

    [SectionTypes.Interests]: () => {
      if (!resume.interests?.length) return [];
      const lines = [heading(SectionTypes.Interests)];
      resume.interests.forEach((interest) => {
        if (interest.name) {
          const keywords = interest.keywords?.length
            ? `: ${interest.keywords.map((k) => k.value).join(', ')}`
            : '';
          lines.push(`${interest.name}${keywords}`);
        }
      });
      lines.push('');
      return lines;
    },

    [SectionTypes.References]: () => {
      if (!resume.references?.length) return [];
      const lines = [heading(SectionTypes.References)];
      resume.references.forEach((ref) => {
        if (ref.name) lines.push(ref.name);
        if (ref.reference) lines.push(ref.reference);
      });
      lines.push('');
      return lines;
    },

    [SectionTypes.Projects]: () => {
      if (!resume.projects?.length) return [];
      const lines = [heading(SectionTypes.Projects)];
      resume.projects.forEach((project) => {
        const startDate = formatDate(project.startDate);
        const endDate = formatDate(project.endDate);
        const dateRange =
          startDate && endDate ? `${startDate} - ${endDate}` : '';
        lines.push(joinCells(project.name, dateRange));
        if (project.description) lines.push(project.description);
        project.highlights?.forEach((h) => lines.push(`• ${h}`));
        lines.push('');
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
