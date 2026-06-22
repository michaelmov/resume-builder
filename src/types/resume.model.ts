export enum SectionTypes {
  Basics = 'basics',
  Work = 'work',
  Volunteer = 'volunteer',
  Education = 'education',
  Awards = 'awards',
  Certificates = 'certificates',
  Publications = 'publications',
  Skills = 'skills',
  Languages = 'languages',
  Interests = 'interests',
  References = 'references',
  Projects = 'projects',
}

/**
 * @deprecated The app no longer hides sections — they are added/removed
 * instead (see {@link resolveSectionOrder}). Retained only so legacy saved
 * resumes and older JSON Resume exports that carry this field still parse.
 */
export interface SectionVisibility {
  [section: string]: boolean | undefined;
}

/** Display titles for each section, shared by the editor and PDF templates. */
export const SECTION_TITLES: Record<SectionTypes, string> = {
  [SectionTypes.Basics]: 'Profile',
  [SectionTypes.Work]: 'Work Experience',
  [SectionTypes.Volunteer]: 'Volunteer',
  [SectionTypes.Education]: 'Education',
  [SectionTypes.Awards]: 'Awards',
  [SectionTypes.Certificates]: 'Certificates',
  [SectionTypes.Publications]: 'Publications',
  [SectionTypes.Skills]: 'Skills',
  [SectionTypes.Languages]: 'Languages',
  [SectionTypes.Interests]: 'Interests',
  [SectionTypes.References]: 'References',
  [SectionTypes.Projects]: 'Projects',
};

/** User-supplied display titles, overriding {@link SECTION_TITLES} per type. */
export type SectionTitles = Partial<Record<SectionTypes, string>>;

/**
 * Effective display title for a section: a user override when set, otherwise the
 * built-in default. Used by the editor header and every PDF/text output.
 */
export const getSectionTitle = (
  type: SectionTypes,
  custom?: SectionTitles
): string => {
  const override = custom?.[type]?.trim();
  return override ? override : SECTION_TITLES[type];
};

/**
 * Strip a custom-titles map down to meaningful overrides: drop blank entries and
 * any that merely repeat the default. Used before persisting/exporting and to
 * compare two maps for equality.
 */
export const normalizeSectionTitles = (
  titles?: SectionTitles
): SectionTitles => {
  const out: SectionTitles = {};
  if (!titles) {
    return out;
  }
  (Object.keys(titles) as SectionTypes[]).forEach((type) => {
    const trimmed = titles[type]?.trim();
    if (trimmed && trimmed !== SECTION_TITLES[type]) {
      out[type] = trimmed;
    }
  });
  return out;
};

/** One-line descriptions surfaced in the "Add Section" picker. */
export const SECTION_DESCRIPTIONS: Partial<Record<SectionTypes, string>> = {
  [SectionTypes.Work]: 'Jobs, roles, and accomplishments',
  [SectionTypes.Volunteer]: 'Unpaid roles and community work',
  [SectionTypes.Education]: 'Degrees, schools, and coursework',
  [SectionTypes.Awards]: 'Honors and recognitions',
  [SectionTypes.Certificates]: 'Licenses and certifications',
  [SectionTypes.Publications]: 'Papers, articles, and books',
  [SectionTypes.Skills]: 'Grouped skills and keywords',
  [SectionTypes.Languages]: 'Spoken languages and fluency',
  [SectionTypes.Interests]: 'Hobbies and areas of interest',
  [SectionTypes.References]: 'People who can vouch for you',
  [SectionTypes.Projects]: 'Side projects and notable work',
};

/**
 * Every section that can be added, removed, and reordered. Basics is
 * deliberately excluded — it is always rendered first as the resume header and
 * can be neither hidden nor moved. The order here is also the canonical order
 * the "Add Section" picker and migrations fall back to.
 */
export const REORDERABLE_SECTIONS: SectionTypes[] = [
  SectionTypes.Work,
  SectionTypes.Volunteer,
  SectionTypes.Education,
  SectionTypes.Awards,
  SectionTypes.Certificates,
  SectionTypes.Publications,
  SectionTypes.Skills,
  SectionTypes.Languages,
  SectionTypes.Interests,
  SectionTypes.References,
  SectionTypes.Projects,
];

/**
 * The sections active by default — used when a resume has no explicit
 * `sectionOrder` yet (a brand-new resume or a save from before sections were
 * add/removable). Mirrors the original fixed layout so existing users see no
 * change on upgrade.
 */
export const DEFAULT_ACTIVE_SECTIONS: SectionTypes[] = [
  SectionTypes.Skills,
  SectionTypes.Work,
  SectionTypes.Education,
  SectionTypes.Projects,
];

/** Grouping used to organize the "Add Section" picker menu. */
export const SECTION_CATEGORIES: { label: string; sections: SectionTypes[] }[] =
  [
    {
      label: 'Experience',
      sections: [
        SectionTypes.Work,
        SectionTypes.Volunteer,
        SectionTypes.Projects,
      ],
    },
    {
      label: 'Education & Credentials',
      sections: [
        SectionTypes.Education,
        SectionTypes.Awards,
        SectionTypes.Certificates,
        SectionTypes.Publications,
      ],
    },
    {
      label: 'Skills & Background',
      sections: [
        SectionTypes.Skills,
        SectionTypes.Languages,
        SectionTypes.Interests,
        SectionTypes.References,
      ],
    },
  ];

/**
 * Resolve the effective set + order of active sections from a persisted
 * `sectionOrder`. Unlike the original implementation, the order now *is* the
 * active set: a section is on the resume iff it appears here, so the picker can
 * add and remove section types.
 *
 * - `undefined` (a brand-new resume, or a save from before this feature) falls
 *   back to {@link DEFAULT_ACTIVE_SECTIONS} so existing users are unaffected.
 * - An explicit array (including an empty one — every section removed) is taken
 *   at face value, with Basics, unknown/stale values, and duplicates dropped.
 */
export const resolveSectionOrder = (
  order?: SectionTypes[]
): SectionTypes[] => {
  if (order === undefined) {
    return [...DEFAULT_ACTIVE_SECTIONS];
  }

  const seen = new Set<SectionTypes>();
  const resolved: SectionTypes[] = [];

  order.forEach((section) => {
    if (REORDERABLE_SECTIONS.includes(section) && !seen.has(section)) {
      seen.add(section);
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
  /** Per-section title overrides; absent types fall back to {@link SECTION_TITLES}. */
  sectionTitles?: SectionTitles;
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
  // Stored as `{ value }[]` (like Skill.keywords) so the editor can reuse the
  // press-Enter tag input; unwrapped to plain strings for JSON Resume export.
  keywords: { value: string }[];
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
