export enum SectionTypes {
  Basics = 'basics',
  Skills = 'skills',
  Work = 'work',
  Education = 'education',
}

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
  summary: string;
  highlights: { value: string }[];
  name?: string;
}
