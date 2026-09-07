import { z } from 'zod';

import { templates } from '../templates';
import { accents } from '../templates/accents';
import { margins } from '../templates/margins';
import { ResumeSettings } from '../types/resume-library';
import {
  Award,
  Basics,
  Certificate,
  Education,
  Interest,
  Language,
  Location,
  normalizeSectionTitles,
  Profile,
  Project,
  Publication,
  Reference,
  REORDERABLE_SECTIONS,
  Resume,
  SectionTitles,
  SectionTypes,
  SectionVisibility,
  Skill,
  Work,
} from '../types/resume.model';

/**
 * Translation layer between the app's internal `Resume` model and the public
 * {@link https://jsonresume.org/schema JSON Resume} schema.
 *
 * The internal model diverges from the standard in three ways, all reconciled
 * here so import/export is genuinely interoperable with other JSON Resume tools:
 *
 *  1. `work`/`volunteer` `highlights` and `skills` `keywords` are stored as
 *     `{ value: string }[]` (react-hook-form `useFieldArray` needs objects),
 *     whereas the schema uses `string[]`.
 *  2. Dates may be `Date` objects internally; the schema wants `YYYY-MM-DD`
 *     strings.
 *  3. `work.isPresent` and `sectionVisibility`/`sectionOrder` are app-only
 *     extensions, as are a resume's user-visible name and its PDF settings
 *     (template/accent/margin). "Present" is expressed in the schema by
 *     omitting `endDate`; the app extensions are tucked under a namespaced
 *     `meta` key so our own exports round-trip losslessly without polluting
 *     standard fields.
 */

const META_NAMESPACE = 'resume-builder';

// A keyword/highlight item may be a plain string (real JSON Resume) or the
// internal `{ value }` object (legacy app exports). Accept either on import.
const flexibleList = z
  .array(z.union([z.string(), z.object({ value: z.string() })]))
  .optional();

const locationSchema = z.object({
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  countryCode: z.string().optional(),
  region: z.string().optional(),
});

const profileSchema = z.object({
  network: z.string().optional(),
  username: z.string().optional(),
  url: z.string().optional(),
});

const basicsSchema = z.object({
  name: z.string().optional(),
  label: z.string().optional(),
  image: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  url: z.string().optional(),
  summary: z.string().optional(),
  location: locationSchema.optional(),
  profiles: z.array(profileSchema).optional(),
});

// `work` and `volunteer` share a shape; `name` (company) is used by work and
// `organization` by volunteer, so both are declared and the unused one is empty.
const workSchema = z.object({
  name: z.string().optional(),
  organization: z.string().optional(),
  position: z.string().optional(),
  url: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isPresent: z.boolean().optional(),
  summary: z.string().optional(),
  highlights: flexibleList,
});

const educationSchema = z.object({
  institution: z.string().optional(),
  url: z.string().optional(),
  area: z.string().optional(),
  studyType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  score: z.string().optional(),
  courses: z.array(z.string()).optional(),
});

const awardSchema = z.object({
  title: z.string().optional(),
  date: z.string().optional(),
  awarder: z.string().optional(),
  summary: z.string().optional(),
});

const certificateSchema = z.object({
  name: z.string().optional(),
  date: z.string().optional(),
  issuer: z.string().optional(),
  url: z.string().optional(),
});

const publicationSchema = z.object({
  name: z.string().optional(),
  publisher: z.string().optional(),
  releaseDate: z.string().optional(),
  url: z.string().optional(),
  summary: z.string().optional(),
});

const skillSchema = z.object({
  name: z.string().optional(),
  level: z.string().optional(),
  keywords: flexibleList,
});

const languageSchema = z.object({
  language: z.string().optional(),
  fluency: z.string().optional(),
});

const interestSchema = z.object({
  name: z.string().optional(),
  keywords: flexibleList,
});

const referenceSchema = z.object({
  name: z.string().optional(),
  reference: z.string().optional(),
});

const projectSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  highlights: flexibleList,
  keywords: flexibleList,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  url: z.string().optional(),
  roles: z.array(z.string()).optional(),
  entity: z.string().optional(),
  type: z.string().optional(),
});

export const jsonResumeSchema = z.object({
  basics: basicsSchema.optional(),
  work: z.array(workSchema).optional(),
  volunteer: z.array(workSchema).optional(),
  education: z.array(educationSchema).optional(),
  awards: z.array(awardSchema).optional(),
  certificates: z.array(certificateSchema).optional(),
  publications: z.array(publicationSchema).optional(),
  skills: z.array(skillSchema).optional(),
  languages: z.array(languageSchema).optional(),
  interests: z.array(interestSchema).optional(),
  references: z.array(referenceSchema).optional(),
  projects: z.array(projectSchema).optional(),
  // Deliberately loose. Other tools write whatever they like here, and this
  // app's own `[META_NAMESPACE]` block (name, PDF settings, section state) is
  // read defensively by `readResumeDocumentMeta` rather than validated up
  // front — a stale or malformed block must cost the settings, not the import.
  meta: z.record(z.unknown()).optional(),
  // Legacy app exports stored these at the root rather than under `meta`.
  sectionVisibility: z.record(z.boolean()).optional(),
  sectionOrder: z.array(z.string()).optional(),
});

export type JsonResume = z.infer<typeof jsonResumeSchema>;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const ISO_DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

/** Normalize an internal date (`Date` or string) to a JSON Resume date string. */
const toIsoDate = (date?: Date | string): string | undefined => {
  if (date === undefined || date === null) return undefined;
  if (date instanceof Date) {
    return Number.isNaN(date.getTime())
      ? undefined
      : date.toISOString().slice(0, 10);
  }
  const trimmed = String(date).trim();
  if (trimmed === '') return undefined;
  // Already a valid partial/full date (YYYY, YYYY-MM, YYYY-MM-DD): keep as-is.
  if (ISO_DATE.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime())
    ? trimmed // unparseable — preserve rather than drop
    : parsed.toISOString().slice(0, 10);
};

/** Drop empty strings, nullish values, and empty arrays to keep output clean. */
const omitEmpty = <T extends object>(obj: T): Partial<T> => {
  const out: Record<string, unknown> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    out[key] = value;
  });
  return out as Partial<T>;
};

/** Like `omitEmpty`, but drops the object itself once nothing is left. */
const omitIfEmpty = <T extends object>(obj?: T): Partial<T> | undefined => {
  if (!obj) return undefined;
  const out = omitEmpty(obj);
  return Object.keys(out).length > 0 ? out : undefined;
};

type ListItem = string | { value: string };

/** Coerce a schema list (strings or `{ value }`) to internal `{ value }[]`. */
const toValueArray = (items?: ListItem[]): { value: string }[] =>
  (items ?? []).map((item) =>
    typeof item === 'string' ? { value: item } : { value: item.value }
  );

/** Coerce a schema list (strings or `{ value }`) to a plain `string[]`. */
const toStringArray = (items?: ListItem[]): string[] =>
  (items ?? []).map((item) => (typeof item === 'string' ? item : item.value));

const nonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/** Plain-object guard for walking untrusted `meta` without validating it. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Fill in every `Location` key, like the sibling `basics` fields do with `?? ''`.
 *
 * An imported resume must not leave an editable field `undefined`: the Basics
 * editor registers `location.city`, and when react-hook-form re-seeds a form
 * with `undefined` for a registered field it does not clear that input — it
 * adopts whatever text the input still holds back into the form state (see
 * `updateValidAndValue` in react-hook-form). Auto-commit then writes the
 * previous resume's location onto the freshly imported one.
 */
const withLocationDefaults = (location?: Location): Location => ({
  address: '',
  postalCode: '',
  city: '',
  countryCode: '',
  region: '',
  ...location,
});

// ---------------------------------------------------------------------------
// Export: internal Resume -> JSON Resume
// ---------------------------------------------------------------------------

/**
 * The parts of a stored resume that live outside the `Resume` model itself —
 * its name and PDF settings are owned by the resume library, not the document.
 */
export interface ResumeDocumentMeta {
  name?: string;
  settings?: ResumeSettings;
}

export const toJsonResume = (
  resume: Resume,
  meta?: ResumeDocumentMeta
): JsonResume => {
  const json: JsonResume = {
    basics: omitEmpty({
      name: resume.basics.name,
      label: resume.basics.label,
      image: resume.basics.image,
      email: resume.basics.email,
      phone: resume.basics.phone,
      url: resume.basics.url,
      summary: resume.basics.summary,
      // Drop the key entirely when no part of the location is filled in, so a
      // resume imported without one doesn't start exporting `location: {}`.
      location: omitIfEmpty(resume.basics.location),
      profiles: resume.basics.profiles,
    }),
    work: resume.work.map((w) =>
      omitEmpty({
        name: w.name,
        position: w.position,
        url: w.url,
        startDate: toIsoDate(w.startDate),
        // "Present" roles omit endDate per the JSON Resume convention.
        endDate: w.isPresent ? undefined : toIsoDate(w.endDate),
        summary: w.summary,
        highlights: w.highlights.map((h) => h.value).filter(nonEmpty),
      })
    ),
    volunteer: resume.volunteer.map((v) =>
      omitEmpty({
        organization: v.organization,
        position: v.position,
        url: v.url,
        startDate: toIsoDate(v.startDate),
        endDate: v.isPresent ? undefined : toIsoDate(v.endDate),
        summary: v.summary,
        highlights: v.highlights.map((h) => h.value).filter(nonEmpty),
      })
    ),
    education: resume.education.map((e) =>
      omitEmpty({
        institution: e.institution,
        url: e.url,
        area: e.area,
        studyType: e.studyType,
        startDate: toIsoDate(e.startDate),
        endDate: toIsoDate(e.endDate),
        score: e.score,
        courses: e.courses,
      })
    ),
    awards: resume.awards.map((a) =>
      omitEmpty({
        title: a.title,
        date: toIsoDate(a.date),
        awarder: a.awarder,
        summary: a.summary,
      })
    ),
    certificates: resume.certificates.map((c) =>
      omitEmpty({
        name: c.name,
        date: toIsoDate(c.date),
        issuer: c.issuer,
        url: c.url,
      })
    ),
    publications: resume.publications.map((p) =>
      omitEmpty({
        name: p.name,
        publisher: p.publisher,
        releaseDate: toIsoDate(p.releaseDate),
        url: p.url,
        summary: p.summary,
      })
    ),
    skills: resume.skills.map((s) =>
      omitEmpty({
        name: s.name,
        level: s.level,
        keywords: s.keywords.map((k) => k.value).filter(nonEmpty),
      })
    ),
    languages: resume.languages.map((l) =>
      omitEmpty({ language: l.language, fluency: l.fluency })
    ),
    interests: resume.interests.map((i) =>
      omitEmpty({
        name: i.name,
        keywords: i.keywords.map((k) => k.value).filter(nonEmpty),
      })
    ),
    references: resume.references.map((r) =>
      omitEmpty({ name: r.name, reference: r.reference })
    ),
    projects: resume.projects.map((p) =>
      omitEmpty({
        name: p.name,
        description: p.description,
        highlights: p.highlights,
        keywords: p.keywords,
        startDate: toIsoDate(p.startDate),
        endDate: toIsoDate(p.endDate),
        url: p.url,
        roles: p.roles,
        entity: p.entity,
        type: p.type,
      })
    ),
    meta: {
      canonical: 'https://jsonresume.org/schema/',
      version: 'v1.0.0',
      lastModified: new Date().toISOString().slice(0, 19) + 'Z',
      // App-specific state, namespaced so other tools ignore it. `omitEmpty`
      // keeps an export without document meta identical to what it always was.
      [META_NAMESPACE]: omitEmpty({
        name: meta?.name,
        settings: meta?.settings,
        sectionVisibility: resume.sectionVisibility,
        sectionOrder: resume.sectionOrder,
        sectionTitles: resume.sectionTitles,
      }),
    },
  };

  return json;
};

// ---------------------------------------------------------------------------
// Import: JSON Resume (validated) -> internal Resume
// ---------------------------------------------------------------------------

/** True when a "current" role/entry has no end date (JSON Resume convention). */
const derivePresent = (
  endDate: unknown,
  explicit: boolean | undefined
): boolean => (typeof explicit === 'boolean' ? explicit : !nonEmpty(endDate));

/**
 * Map an optional schema array through a per-item mapper.
 *
 * Every section is optional in the schema, so absent and empty both have to
 * land on `[]`. Keeping that `?? []` here rather than at each of the twelve
 * call sites is what lets `fromJsonResume` stay inside the `complexity` budget.
 */
const mapList = <In, Out>(
  items: In[] | undefined,
  map: (item: In) => Out
): Out[] => (items ?? []).map(map);

// Per-section mappers. Each one is the same shape — fill every internal field,
// defaulting a missing schema value to `''` — but they live as named functions
// so `fromJsonResume` reads as a list of sections rather than 130 lines of
// field defaults. The `= {}` defaults stand in for an absent object without
// the optional chaining that the field defaults would otherwise each need.

const toProfile = (p: z.infer<typeof profileSchema>): Profile => ({
  network: p.network ?? '',
  username: p.username ?? '',
  url: p.url ?? '',
});

const toBasics = (basics: z.infer<typeof basicsSchema> = {}): Basics => ({
  name: basics.name ?? '',
  label: basics.label ?? '',
  image: basics.image ?? '',
  email: basics.email ?? '',
  phone: basics.phone ?? '',
  url: basics.url ?? '',
  summary: basics.summary ?? '',
  location: withLocationDefaults(basics.location),
  profiles: basics.profiles?.map(toProfile),
});

// `work` and `volunteer` share `workSchema` but not a mapper: work names the
// employer in `name`, volunteer names it in `organization`, and each section
// leaves the other key off entirely. Filling in both would put a stray empty
// string on every entry and start exporting it.
const toWork = (w: z.infer<typeof workSchema>): Work => ({
  name: w.name ?? '',
  position: w.position ?? '',
  url: w.url ?? '',
  startDate: w.startDate ?? '',
  endDate: w.endDate ?? '',
  isPresent: derivePresent(w.endDate, w.isPresent),
  summary: w.summary ?? '',
  highlights: toValueArray(w.highlights),
});

const toVolunteer = (v: z.infer<typeof workSchema>): Work => ({
  organization: v.organization ?? '',
  position: v.position ?? '',
  url: v.url ?? '',
  startDate: v.startDate ?? '',
  endDate: v.endDate ?? '',
  isPresent: derivePresent(v.endDate, v.isPresent),
  summary: v.summary ?? '',
  highlights: toValueArray(v.highlights),
});

const toEducation = (e: z.infer<typeof educationSchema>): Education => ({
  institution: e.institution ?? '',
  url: e.url ?? '',
  area: e.area ?? '',
  studyType: e.studyType ?? '',
  startDate: e.startDate ?? '',
  endDate: e.endDate ?? '',
  score: e.score ?? '',
  courses: e.courses ?? [],
});

const toAward = (a: z.infer<typeof awardSchema>): Award => ({
  title: a.title ?? '',
  date: a.date ?? '',
  awarder: a.awarder ?? '',
  summary: a.summary ?? '',
});

const toCertificate = (c: z.infer<typeof certificateSchema>): Certificate => ({
  name: c.name ?? '',
  date: c.date ?? '',
  issuer: c.issuer ?? '',
  url: c.url ?? '',
});

const toPublication = (p: z.infer<typeof publicationSchema>): Publication => ({
  name: p.name ?? '',
  publisher: p.publisher ?? '',
  releaseDate: p.releaseDate ?? '',
  url: p.url ?? '',
  summary: p.summary ?? '',
});

const toSkill = (s: z.infer<typeof skillSchema>): Skill => ({
  name: s.name ?? '',
  level: s.level ?? '',
  keywords: toValueArray(s.keywords),
});

const toLanguage = (l: z.infer<typeof languageSchema>): Language => ({
  language: l.language ?? '',
  fluency: l.fluency ?? '',
});

const toInterest = (i: z.infer<typeof interestSchema>): Interest => ({
  name: i.name ?? '',
  keywords: toValueArray(i.keywords),
});

const toReference = (ref: z.infer<typeof referenceSchema>): Reference => ({
  name: ref.name ?? '',
  reference: ref.reference ?? '',
});

const toProject = (p: z.infer<typeof projectSchema>): Project => ({
  name: p.name ?? '',
  description: p.description ?? '',
  highlights: toStringArray(p.highlights),
  keywords: toStringArray(p.keywords),
  startDate: p.startDate ?? '',
  endDate: p.endDate ?? '',
  url: p.url ?? '',
  roles: p.roles ?? [],
  entity: p.entity ?? '',
  type: p.type ?? '',
});

/**
 * Validate and convert an arbitrary parsed JSON value into a complete internal
 * `Resume`. Throws a descriptive `Error` when the input is not a recognizable
 * JSON Resume document. Tolerates both real JSON Resume files (string lists,
 * `YYYY-MM-DD` dates) and this app's own legacy exports (`{ value }` lists,
 * top-level `sectionVisibility`).
 */
export const fromJsonResume = (input: unknown): Resume => {
  const parsed = jsonResumeSchema.safeParse(input);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Not a valid JSON Resume file — ${detail}`);
  }

  const r = parsed.data;
  const appMeta = (r.meta?.[META_NAMESPACE] ?? {}) as {
    sectionVisibility?: SectionVisibility;
    sectionOrder?: SectionTypes[];
    sectionTitles?: SectionTitles;
  };

  const resume: Resume = {
    basics: toBasics(r.basics),
    work: mapList(r.work, toWork),
    volunteer: mapList(r.volunteer, toVolunteer),
    education: mapList(r.education, toEducation),
    awards: mapList(r.awards, toAward),
    certificates: mapList(r.certificates, toCertificate),
    publications: mapList(r.publications, toPublication),
    skills: mapList(r.skills, toSkill),
    languages: mapList(r.languages, toLanguage),
    interests: mapList(r.interests, toInterest),
    references: mapList(r.references, toReference),
    projects: mapList(r.projects, toProject),
    sectionVisibility:
      appMeta.sectionVisibility ?? (r.sectionVisibility as SectionVisibility),
  };

  // Decide which sections are active (on the resume). Prefer an explicit order
  // from this app's own export; otherwise activate every section that carries
  // data so a standard JSON Resume file "just works" on import. Left undefined
  // only when there's nothing to show, so the app falls back to its defaults.
  const explicitOrder =
    appMeta.sectionOrder ?? (r.sectionOrder as SectionTypes[] | undefined);
  const sections = resume as unknown as Record<string, unknown>;
  const dataSections = REORDERABLE_SECTIONS.filter((type) => {
    const value = sections[type];
    return Array.isArray(value) && value.length > 0;
  });
  resume.sectionOrder =
    explicitOrder && explicitOrder.length > 0
      ? explicitOrder
      : dataSections.length > 0
        ? dataSections
        : undefined;

  const customTitles = normalizeSectionTitles(appMeta.sectionTitles);
  resume.sectionTitles =
    Object.keys(customTitles).length > 0 ? customTitles : undefined;

  return resume;
};

/**
 * Read back the PDF settings, checking every id against the live registries.
 *
 * A file may name a template, accent, or margin this app has since renamed or
 * dropped. Rather than hand the editor an id nothing resolves, the whole
 * settings block is discarded so the resume opens on the app defaults.
 */
const readResumeSettings = (input: unknown): ResumeSettings | undefined => {
  if (!isRecord(input)) return undefined;

  const { templateId, marginId } = input;
  if (!nonEmpty(templateId) || !nonEmpty(marginId)) return undefined;
  if (!templates.some((template) => template.id === templateId)) {
    return undefined;
  }
  if (!margins.some((margin) => margin.id === marginId)) return undefined;

  // A missing accent means "Auto", the same as an explicit null.
  const accentId = input.accentId ?? null;
  if (accentId !== null) {
    if (typeof accentId !== 'string') return undefined;
    if (!accents.some((accent) => accent.id === accentId)) return undefined;
  }

  return { templateId, accentId, marginId };
};

/**
 * Pull this app's own name/settings out of a JSON Resume file, if present.
 *
 * Kept separate from `fromJsonResume` — which already validates the document —
 * so it can be forgiving: anything unrecognized under `meta['resume-builder']`
 * yields `{}` and the caller falls back to its own defaults.
 */
export const readResumeDocumentMeta = (input: unknown): ResumeDocumentMeta => {
  if (!isRecord(input) || !isRecord(input.meta)) return {};

  const appMeta = input.meta[META_NAMESPACE];
  if (!isRecord(appMeta)) return {};

  const meta: ResumeDocumentMeta = {};
  if (nonEmpty(appMeta.name)) meta.name = appMeta.name.trim();

  const settings = readResumeSettings(appMeta.settings);
  if (settings) meta.settings = settings;

  return meta;
};
