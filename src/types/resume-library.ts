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

/** What a resume is called before anyone names it. */
export const UNTITLED_RESUME_NAME = 'Untitled resume';

/**
 * Everything the list screen needs to render a card, without handling the
 * resume itself. A projection of the stored document, not a separate record.
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

/** A cached PNG of a resume's first page, for the list card. */
export interface ThumbnailRecord {
  /** PNG image of page 1. */
  png: Blob;
  /** The resume's `updatedAt` (epoch ms) this image was rendered from. */
  stamp: number;
}
