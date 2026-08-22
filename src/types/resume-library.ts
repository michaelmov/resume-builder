import { Resume } from './resume.model';

/**
 * How a resume should be rendered to PDF. These three used to be app-wide
 * localStorage keys; with multiple resumes each one carries its own, so a
 * designer-styled resume and an ATS-plain one can coexist.
 */
export interface ResumeSettings {
  templateId: string;
  /** `null` is "Auto" — resolved to the active template's signature accent. */
  accentId: string | null;
  marginId: string;
}

/**
 * One row of the resume index: everything the list screen needs to render a
 * card, without parsing the resume itself. The index is the source of truth
 * for a resume's name and timestamps; the document holds only resume data.
 */
export interface ResumeSummary {
  id: string;
  name: string;
  /** Epoch milliseconds. */
  createdAt: number;
  /** Epoch milliseconds; drives the list's sort order. */
  updatedAt: number;
}

/** A single stored resume — its content plus how it's rendered. */
export interface ResumeDocument {
  resume: Resume;
  settings: ResumeSettings;
}
