import { z } from 'zod';

import {
  Resume,
  SectionTypes,
  SectionVisibility,
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
 *     extensions. "Present" is expressed in the schema by omitting `endDate`;
 *     the app extensions are tucked under a namespaced `meta` key so our own
 *     exports round-trip losslessly without polluting standard fields.
 */

const META_NAMESPACE = 'resume-builder';

// A keyword/highlight item may be a plain string (real JSON Resume) or the
// internal `{ value }` object (legacy app exports). Accept either on import.
const flexibleList = z
  .array(z.union([z.string(), z.object({ value: z.string() })]))
  .optional();

const locationSchema = z
  .object({
    address: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    countryCode: z.string().optional(),
    region: z.string().optional(),
  });

const profileSchema = z
  .object({
    network: z.string().optional(),
    username: z.string().optional(),
    url: z.string().optional(),
  });

const basicsSchema = z
  .object({
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
const workSchema = z
  .object({
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

const educationSchema = z
  .object({
    institution: z.string().optional(),
    url: z.string().optional(),
    area: z.string().optional(),
    studyType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    score: z.string().optional(),
    courses: z.array(z.string()).optional(),
  });

const awardSchema = z
  .object({
    title: z.string().optional(),
    date: z.string().optional(),
    awarder: z.string().optional(),
    summary: z.string().optional(),
  });

const certificateSchema = z
  .object({
    name: z.string().optional(),
    date: z.string().optional(),
    issuer: z.string().optional(),
    url: z.string().optional(),
  });

const publicationSchema = z
  .object({
    name: z.string().optional(),
    publisher: z.string().optional(),
    releaseDate: z.string().optional(),
    url: z.string().optional(),
    summary: z.string().optional(),
  });

const skillSchema = z
  .object({
    name: z.string().optional(),
    level: z.string().optional(),
    keywords: flexibleList,
  });

const languageSchema = z
  .object({
    language: z.string().optional(),
    fluency: z.string().optional(),
  });

const interestSchema = z
  .object({
    name: z.string().optional(),
    keywords: flexibleList,
  });

const referenceSchema = z
  .object({
    name: z.string().optional(),
    reference: z.string().optional(),
  });

const projectSchema = z
  .object({
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

export const jsonResumeSchema = z
  .object({
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

// ---------------------------------------------------------------------------
// Export: internal Resume -> JSON Resume
// ---------------------------------------------------------------------------

export const toJsonResume = (resume: Resume): JsonResume => {
  const json: JsonResume = {
    basics: omitEmpty({
      name: resume.basics.name,
      label: resume.basics.label,
      image: resume.basics.image,
      email: resume.basics.email,
      phone: resume.basics.phone,
      url: resume.basics.url,
      summary: resume.basics.summary,
      location: resume.basics.location
        ? omitEmpty(resume.basics.location)
        : undefined,
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
      omitEmpty({ name: i.name, keywords: i.keywords })
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
      // App-specific state, namespaced so other tools ignore it.
      [META_NAMESPACE]: omitEmpty({
        sectionVisibility: resume.sectionVisibility,
        sectionOrder: resume.sectionOrder,
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
  };

  return {
    basics: {
      name: r.basics?.name ?? '',
      label: r.basics?.label ?? '',
      image: r.basics?.image ?? '',
      email: r.basics?.email ?? '',
      phone: r.basics?.phone ?? '',
      url: r.basics?.url ?? '',
      summary: r.basics?.summary ?? '',
      location: r.basics?.location,
      profiles: r.basics?.profiles?.map((p) => ({
        network: p.network ?? '',
        username: p.username ?? '',
        url: p.url ?? '',
      })),
    },
    work: (r.work ?? []).map((w) => ({
      name: w.name ?? '',
      position: w.position ?? '',
      url: w.url ?? '',
      startDate: w.startDate ?? '',
      endDate: w.endDate ?? '',
      isPresent: derivePresent(w.endDate, w.isPresent),
      summary: w.summary ?? '',
      highlights: toValueArray(w.highlights),
    })),
    volunteer: (r.volunteer ?? []).map((v) => ({
      organization: v.organization ?? '',
      position: v.position ?? '',
      url: v.url ?? '',
      startDate: v.startDate ?? '',
      endDate: v.endDate ?? '',
      isPresent: derivePresent(v.endDate, v.isPresent),
      summary: v.summary ?? '',
      highlights: toValueArray(v.highlights),
    })),
    education: (r.education ?? []).map((e) => ({
      institution: e.institution ?? '',
      url: e.url ?? '',
      area: e.area ?? '',
      studyType: e.studyType ?? '',
      startDate: e.startDate ?? '',
      endDate: e.endDate ?? '',
      score: e.score ?? '',
      courses: e.courses ?? [],
    })),
    awards: (r.awards ?? []).map((a) => ({
      title: a.title ?? '',
      date: a.date ?? '',
      awarder: a.awarder ?? '',
      summary: a.summary ?? '',
    })),
    certificates: (r.certificates ?? []).map((c) => ({
      name: c.name ?? '',
      date: c.date ?? '',
      issuer: c.issuer ?? '',
      url: c.url ?? '',
    })),
    publications: (r.publications ?? []).map((p) => ({
      name: p.name ?? '',
      publisher: p.publisher ?? '',
      releaseDate: p.releaseDate ?? '',
      url: p.url ?? '',
      summary: p.summary ?? '',
    })),
    skills: (r.skills ?? []).map((s) => ({
      name: s.name ?? '',
      level: s.level ?? '',
      keywords: toValueArray(s.keywords),
    })),
    languages: (r.languages ?? []).map((l) => ({
      language: l.language ?? '',
      fluency: l.fluency ?? '',
    })),
    interests: (r.interests ?? []).map((i) => ({
      name: i.name ?? '',
      keywords: toStringArray(i.keywords),
    })),
    references: (r.references ?? []).map((ref) => ({
      name: ref.name ?? '',
      reference: ref.reference ?? '',
    })),
    projects: (r.projects ?? []).map((p) => ({
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
    })),
    sectionVisibility:
      appMeta.sectionVisibility ?? (r.sectionVisibility as SectionVisibility),
    sectionOrder: appMeta.sectionOrder ?? (r.sectionOrder as SectionTypes[]),
  };
};
