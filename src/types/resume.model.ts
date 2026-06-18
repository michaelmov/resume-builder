export enum SectionTypes {
  Basics = 'basics',
  Skills = 'skills',
  Work = 'work',
  Education = 'education',
  Projects = 'projects',
}

export interface SectionVisibility {
  [SectionTypes.Basics]?: boolean;
  [SectionTypes.Skills]?: boolean;
  [SectionTypes.Work]?: boolean;
  [SectionTypes.Education]?: boolean;
  [SectionTypes.Projects]?: boolean;
}

/** Display titles for each section, shared by the editor and PDF templates. */
export const SECTION_TITLES: Record<SectionTypes, string> = {
  [SectionTypes.Basics]: 'Basics',
  [SectionTypes.Skills]: 'Skills',
  [SectionTypes.Work]: 'Work Experience',
  [SectionTypes.Education]: 'Education',
  [SectionTypes.Projects]: 'Projects',
};

/**
 * Main sections that can be reordered in the editor and output. Basics is
 * deliberately excluded — it is always rendered first as the resume header.
 */
export const REORDERABLE_SECTIONS: SectionTypes[] = [
  SectionTypes.Skills,
  SectionTypes.Work,
  SectionTypes.Education,
  SectionTypes.Projects,
];

/**
 * Resolve the effective order of the reorderable sections, tolerating a
 * missing, partial, or stale `sectionOrder` (older saved resumes, or a section
 * type added after the order was last persisted): keep any saved entries that
 * are still valid and de-duplicated, then append any reorderable sections not
 * yet listed in their default order.
 */
export const resolveSectionOrder = (
  order?: SectionTypes[]
): SectionTypes[] => {
  const seen = new Set<SectionTypes>();
  const resolved: SectionTypes[] = [];

  (order ?? []).forEach((section) => {
    if (REORDERABLE_SECTIONS.includes(section) && !seen.has(section)) {
      seen.add(section);
      resolved.push(section);
    }
  });

  REORDERABLE_SECTIONS.forEach((section) => {
    if (!seen.has(section)) {
      resolved.push(section);
    }
  });

  return resolved;
};

export interface Resume {
  basics: Basics;
  work: Work[];
  volunteer: Work[];
  education: Education[];
  awards: Award[];
  certificates: Certificate[];
  publications: Publication[];
  skills: Skill[];
  languages: Language[];
  interests: Interest[];
  references: Reference[];
  projects: Project[];
  sectionVisibility?: SectionVisibility;
  /** Order of the reorderable main sections (excludes Basics). */
  sectionOrder?: SectionTypes[];
}

export interface Award {
  title: string;
  date: Date | string;
  awarder: string;
  summary: string;
}

export interface Basics {
  name: string;
  label: string;
  image: string;
  email: string;
  phone: string;
  url: string;
  summary: string;
  location?: Location;
  profiles?: Profile[];
}

export interface Location {
  address?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  region?: string;
}

export interface Profile {
  network: string;
  username: string;
  url: string;
}

export interface Certificate {
  name: string;
  date: Date | string;
  issuer: string;
  url: string;
}

export interface Education {
  institution: string;
  url: string;
  area: string;
  studyType: string;
  startDate: Date | string;
  endDate: Date | string;
  score: string;
  courses: string[];
}

export interface Interest {
  name: string;
  keywords: string[];
}

export interface Language {
  language: string;
  fluency: string;
}

export interface Project {
  name: string;
  description: string;
  highlights: string[];
  keywords: string[];
  startDate: Date | string;
  endDate: Date | string;
  url: string;
  roles: string[];
  entity: string;
  type: string;
}

export interface Publication {
  name: string;
  publisher: string;
  releaseDate: Date | string;
  url: string;
  summary: string;
}

export interface Reference {
  name: string;
  reference: string;
}

export interface Skill {
  name: string;
  level: string;
  keywords: { value: string }[];
}

export interface Work {
  organization?: string;
  position: string;
  url: string;
  startDate: Date | string;
  endDate: Date | string;
  isPresent: boolean;
  summary: string;
  highlights: { value: string }[];
  name?: string;
}
