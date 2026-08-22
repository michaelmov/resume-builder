import { sampleResume } from '../mocks/resume.mock';
import { DEFAULT_TEMPLATE_ID, templates } from '../templates';
import { accents } from '../templates/accents';
import { DEFAULT_MARGIN_ID, margins } from '../templates/margins';
import {
  ResumeDocument,
  ResumeSettings,
  ResumeSummary,
} from '../types/resume-library';
import { Resume } from '../types/resume.model';

/**
 * The persistence layer for the resume library.
 *
 * Storage is split in two so the list screen stays cheap and an edit stays
 * narrow: a small `resume-index` holds one summary per resume (the source of
 * truth for names and timestamps), while each resume's content lives under its
 * own `resume-doc:<id>` key. Rendering the list parses only the index; typing a
 * character rewrites only the one document.
 *
 * Everything here is synchronous and defensive — localStorage can be corrupt,
 * full, or disabled, and none of those may take the app down with them.
 */

const INDEX_KEY = 'resume-index';
const DOCUMENT_PREFIX = 'resume-doc:';
const DEFAULTS_KEY = 'resume-defaults';

const INDEX_VERSION = 1;

/**
 * Keys from the single-resume era. Read once by {@link migrateLegacyStorage}
 * and then removed. The three settings keys held bare strings, not JSON.
 */
const LEGACY_KEYS = {
  resume: 'resume-data',
  template: 'selected-template',
  accent: 'selected-accent',
  margin: 'selected-margin',
} as const;

interface StoredIndex {
  version: number;
  resumes: ResumeSummary[];
}

/**
 * Thrown when a write fails. Several resumes plus base64 images in Basics put
 * the ~5MB quota within reach, and a write that fails silently means the user
 * loses work at the next reload having never been warned — so callers surface
 * this rather than swallowing it.
 */
export class ResumeStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResumeStorageError';
  }
}

// ---------------------------------------------------------------------------
// localStorage primitives
// ---------------------------------------------------------------------------

const storage = (): Storage | undefined => {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    // Accessing localStorage throws outright when cookies are blocked.
    return undefined;
  }
};

const isQuotaError = (error: unknown): boolean =>
  error instanceof DOMException &&
  (error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

/** Raw string read — used for the legacy settings keys, which weren't JSON. */
const readRaw = (key: string): string | undefined =>
  storage()?.getItem(key) ?? undefined;

const readJson = (key: string): unknown => {
  const raw = readRaw(key);
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Could not parse "${key}" from localStorage:`, error);
    return undefined;
  }
};

const writeJson = (key: string, value: unknown): void => {
  const store = storage();
  if (!store) {
    throw new ResumeStorageError(
      "This browser is blocking storage, so your resumes can't be saved here."
    );
  }
  try {
    store.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Could not write "${key}" to localStorage:`, error);
    throw new ResumeStorageError(
      isQuotaError(error)
        ? "This browser's storage is full, so your latest changes weren't saved. Deleting a resume or a large profile photo will free up room."
        : "Your latest changes couldn't be saved to this browser."
    );
  }
};

const removeKey = (key: string): void => {
  try {
    storage()?.removeItem(key);
  } catch (error) {
    console.error(`Could not remove "${key}" from localStorage:`, error);
  }
};

const documentKey = (id: string): string => `${DOCUMENT_PREFIX}${id}`;

// ---------------------------------------------------------------------------
// Ids and settings
// ---------------------------------------------------------------------------

/**
 * `crypto.randomUUID` requires a secure context. Both localhost and the
 * deployed https site qualify, but the fallback keeps a plain-http preview
 * (`npm run dev:host` over a LAN address) from failing to create a resume.
 */
export const createResumeId = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const DEFAULT_SETTINGS: ResumeSettings = {
  templateId: DEFAULT_TEMPLATE_ID,
  accentId: null,
  marginId: DEFAULT_MARGIN_ID,
};

/**
 * Coerce stored settings back into something renderable. A template or margin
 * id that no longer exists — retired between releases, or hand-edited storage —
 * falls back to the default instead of leaving the preview with no component to
 * render. `accentId: null` is meaningful ("Auto"), not a missing value.
 */
export const resolveSettings = (raw: unknown): ResumeSettings => {
  const value = (raw ?? {}) as Partial<ResumeSettings>;

  return {
    templateId: templates.some((template) => template.id === value.templateId)
      ? (value.templateId as string)
      : DEFAULT_TEMPLATE_ID,
    accentId: accents.some((accent) => accent.id === value.accentId)
      ? (value.accentId as string)
      : null,
    marginId: margins.some((margin) => margin.id === value.marginId)
      ? (value.marginId as string)
      : DEFAULT_MARGIN_ID,
  };
};

/** The look a newly created resume inherits — whatever was last chosen. */
export const readDefaultSettings = (): ResumeSettings =>
  resolveSettings(readJson(DEFAULTS_KEY));

export const saveDefaultSettings = (settings: ResumeSettings): void => {
  writeJson(DEFAULTS_KEY, settings);
};

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

/**
 * `interests[].keywords` used to be `string[]`; it is now `{ value }[]` so the
 * editor can reuse the Skills tag input. Carried over from the retired
 * `useResumeLocalStorage` — resumes saved before that change are still out
 * there, including the one this module migrates in from `resume-data`.
 */
const migrateResumeShape = (resume: Resume): Resume => {
  if (!Array.isArray(resume.interests)) return resume;

  return {
    ...resume,
    interests: resume.interests.map((interest) => ({
      ...interest,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      keywords: ((interest?.keywords as any[]) ?? []).map((keyword) =>
        typeof keyword === 'string' ? { value: keyword } : keyword
      ),
    })),
  };
};

export const readDocument = (id: string): ResumeDocument | undefined => {
  const raw = readJson(documentKey(id)) as Partial<ResumeDocument> | undefined;
  if (!raw || typeof raw !== 'object' || !raw.resume) return undefined;

  return {
    resume: migrateResumeShape(raw.resume as Resume),
    settings: resolveSettings(raw.settings),
  };
};

export const saveDocument = (id: string, document: ResumeDocument): void => {
  writeJson(documentKey(id), document);
};

export const removeDocument = (id: string): void => {
  removeKey(documentKey(id));
};

/**
 * A new resume in the current default look, ready to be edited. It starts from
 * the sample content rather than an empty form: a blank editor gives the
 * preview nothing to render, so the first thing a new resume shows is an empty
 * page. Seeded content makes every section visibly editable, and overwriting
 * placeholder text is a shorter path than filling twelve empty ones.
 */
export const createDocument = (settings?: ResumeSettings): ResumeDocument => ({
  resume: sampleResume(),
  settings: settings ?? readDefaultSettings(),
});

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

const isSummary = (value: unknown): value is ResumeSummary => {
  const summary = value as Partial<ResumeSummary> | null;
  return (
    !!summary &&
    typeof summary.id === 'string' &&
    summary.id !== '' &&
    typeof summary.name === 'string' &&
    typeof summary.createdAt === 'number' &&
    typeof summary.updatedAt === 'number'
  );
};

/** Newest edit first — the list's running order. */
export const sortByRecency = (resumes: ResumeSummary[]): ResumeSummary[] =>
  [...resumes].sort((a, b) => b.updatedAt - a.updatedAt);

type IndexRead =
  | { status: 'absent' }
  | { status: 'damaged' }
  | { status: 'ok'; resumes: ResumeSummary[] };

/**
 * The index's *absence* is what marks storage as never-migrated. An index that
 * is present but empty means "migrated, then every resume deleted", so the
 * sample must not come back — the same undefined-vs-empty distinction
 * `resolveSectionOrder` draws for `sectionOrder`.
 */
const readIndex = (): IndexRead => {
  // Parsed here rather than through `readJson`, which reports unreadable and
  // absent alike as `undefined`. Conflating the two would let a mangled index
  // look like a first run: the sample would be seeded on top of real resumes,
  // and their documents orphaned.
  const raw = readRaw(INDEX_KEY);
  if (raw === undefined) return { status: 'absent' };

  let parsed: StoredIndex | null;
  try {
    parsed = JSON.parse(raw) as StoredIndex | null;
  } catch (error) {
    console.error(`Could not parse "${INDEX_KEY}" from localStorage:`, error);
    return { status: 'damaged' };
  }

  if (!parsed || !Array.isArray(parsed.resumes)) return { status: 'damaged' };
  return { status: 'ok', resumes: parsed.resumes.filter(isSummary) };
};

export const saveIndex = (resumes: ResumeSummary[]): void => {
  writeJson(INDEX_KEY, {
    version: INDEX_VERSION,
    resumes,
  } satisfies StoredIndex);
};

/**
 * Rebuild an unreadable index from the documents themselves. The names and
 * timestamps are gone, but the resumes are not — losing someone's work because
 * one small key got mangled would be the worse failure by far.
 */
const rebuildIndexFromDocuments = (): ResumeSummary[] => {
  const store = storage();
  if (!store) return [];

  const now = Date.now();
  const recovered: ResumeSummary[] = [];

  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i);
    if (!key?.startsWith(DOCUMENT_PREFIX)) continue;

    const id = key.slice(DOCUMENT_PREFIX.length);
    const document = readDocument(id);
    if (!document) continue;

    recovered.push({
      id,
      name: nameForResume(document.resume),
      createdAt: now,
      updatedAt: now,
    });
  }

  return recovered;
};

/** Fall back to the person's own name before resorting to a placeholder. */
const nameForResume = (resume: Resume, fallback = 'Untitled resume'): string =>
  resume.basics?.name?.trim() || fallback;

/**
 * First run after this feature ships. An existing single resume is carried over
 * whole — content plus the look it was last rendered with — and a brand-new
 * visitor gets the sample so their first click lands in a populated editor
 * rather than an empty form.
 */
const migrateLegacyStorage = (): ResumeSummary[] => {
  const now = Date.now();
  const legacy = readJson(LEGACY_KEYS.resume) as Resume | undefined;

  const resume = legacy ? migrateResumeShape(legacy) : sampleResume();
  const name = legacy ? nameForResume(resume, 'My Resume') : 'Sample Resume';
  const settings = legacy
    ? resolveSettings({
        templateId: readRaw(LEGACY_KEYS.template),
        // No stored accent meant "Auto", which `resolveSettings` maps to null.
        accentId: readRaw(LEGACY_KEYS.accent),
        marginId: readRaw(LEGACY_KEYS.margin),
      })
    : DEFAULT_SETTINGS;

  const summary: ResumeSummary = {
    id: createResumeId(),
    name,
    createdAt: now,
    updatedAt: now,
  };

  // Retire the old keys only once the new shape is safely written, so a failed
  // write leaves the legacy resume intact for the next attempt.
  saveDocument(summary.id, { resume, settings });
  saveIndex([summary]);
  saveDefaultSettings(settings);
  Object.values(LEGACY_KEYS).forEach(removeKey);

  return [summary];
};

/**
 * Read the library, migrating or repairing storage as needed. Safe to call on
 * every mount: once an index exists this is a single parse.
 */
export const loadLibrary = (): ResumeSummary[] => {
  const index = readIndex();
  if (index.status === 'ok') return sortByRecency(index.resumes);

  try {
    const resumes =
      index.status === 'damaged'
        ? rebuildIndexFromDocuments()
        : migrateLegacyStorage();

    if (index.status === 'damaged') saveIndex(resumes);
    return sortByRecency(resumes);
  } catch (error) {
    // A failed migration must not block the app. Returning what we recovered
    // keeps this session working, and the next load retries from scratch.
    console.error('Could not initialize resume storage:', error);
    return [];
  }
};
