import { addRxPlugin, createRxDatabase } from 'rxdb';
import type { RxCollection, RxDatabase, RxJsonSchema, RxStorage } from 'rxdb';
import { RxDBAttachmentsPlugin } from 'rxdb/plugins/attachments';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

import { sampleResume } from '../mocks/resume.mock';
import {
  ResumeDocument,
  ResumeSettings,
  ResumeSummary,
  ThumbnailRecord,
  UNTITLED_RESUME_NAME,
} from '../types/resume-library';
import { Resume } from '../types/resume.model';

import { resolveSettings } from './resume-settings';

/**
 * The persistence layer for the resume library — every resume, its settings,
 * and its list thumbnail, in one RxDB database backed by IndexedDB.
 *
 * This is the only module in the app that imports `rxdb`. Everything above it
 * sees plain `Resume` / `ResumeSummary` / `ResumeDocument` values and Promises:
 * no `RxDocument`, no `RxCollection`, no observable escapes this file. Swapping
 * the database out means rewriting this module and nothing else.
 *
 * Writes throw {@link ResumeStorageError}. Everything auto-saves with no Save
 * button, so a write that fails silently means the user loses work at their
 * next reload having never been warned. Thumbnail functions are the exception —
 * they fail soft, because a broken image cache must never break the list.
 */

const DB_NAME = 'resumebuilder';

/** Attachment id for the cached page-1 PNG. One per thumbnail document. */
const THUMBNAIL_ATTACHMENT_ID = 'page1';

/** The `appmeta` collection holds exactly one document, under this id. */
const APP_META_ID = 'app';

export type StorageMode = 'indexeddb' | 'memory';

export interface CreateResumeOptions {
  name?: string;
  /** Content for the new resume; the sample when omitted. */
  resume?: Resume;
  /** Look for the new resume; the last-used default when omitted. */
  settings?: ResumeSettings;
}

/**
 * Thrown when a write fails. Base64 profile images in Basics make the browser's
 * storage quota reachable, and a dropped write is invisible until the user
 * reloads and finds their work gone — so callers surface this rather than
 * swallowing it.
 */
export class ResumeStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResumeStorageError';
  }
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

interface ResumeDocType {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  resume: Resume;
  settings: ResumeSettings;
}

interface ThumbnailDocType {
  resumeId: string;
  stamp: number;
}

interface AppMetaDocType {
  id: string;
  defaultSettings: ResumeSettings;
}

/**
 * `resume` and `settings` are deliberately open objects. RxDB only needs the
 * top-level fields it actually queries, and leaving these opaque sidesteps
 * three real hazards in the model: date fields typed `Date | string`, an
 * `accentId` whose `null` means "Auto", and `sectionOrder`, where the
 * difference between absent and `[]` is load-bearing (`resolveSectionOrder`
 * reads the first as "the default four sections" and the second as "none").
 */
const resumeSchema: RxJsonSchema<ResumeDocType> = {
  title: 'resume',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    createdAt: { type: 'number' },
    // RxDB rejects an indexed number without all three bounds.
    updatedAt: { type: 'number', minimum: 0, maximum: 1e15, multipleOf: 1 },
    resume: { type: 'object' },
    settings: { type: 'object' },
  },
  required: ['id', 'name', 'createdAt', 'updatedAt', 'resume'],
  indexes: ['updatedAt'],
};

/**
 * Thumbnails live in their own collection rather than as an attachment on the
 * resume itself. Capturing one mid-edit would otherwise be a write to the very
 * document the editor is auto-saving, bumping its revision and firing a change
 * event back at the screen that produced it.
 */
const thumbnailSchema: RxJsonSchema<ThumbnailDocType> = {
  title: 'thumbnail',
  version: 0,
  primaryKey: 'resumeId',
  type: 'object',
  properties: {
    resumeId: { type: 'string', maxLength: 100 },
    stamp: { type: 'number' },
  },
  required: ['resumeId', 'stamp'],
  attachments: {},
};

const appMetaSchema: RxJsonSchema<AppMetaDocType> = {
  title: 'appMeta',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 20 },
    defaultSettings: { type: 'object' },
  },
  required: ['id'],
};

type Collections = {
  resumes: RxCollection<ResumeDocType>;
  thumbnails: RxCollection<ThumbnailDocType>;
  appmeta: RxCollection<AppMetaDocType>;
};

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

interface OpenDatabase {
  db: RxDatabase<Collections>;
  mode: StorageMode;
}

let openPromise: Promise<OpenDatabase> | null = null;
let pluginsAdded = false;

const addPlugins = async (): Promise<void> => {
  if (pluginsAdded) return;
  pluginsAdded = true;

  addRxPlugin(RxDBAttachmentsPlugin);

  // Dev-mode gives readable errors and catches schema mistakes, but it inflates
  // the bundle and slows every write, so it must never reach production. The
  // dynamic import is what keeps it out of the build.
  if (import.meta.env.DEV) {
    const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode');
    addRxPlugin(RxDBDevModePlugin);
  }
};

// The two storages carry different `Internals` generics, so the union has to
// be widened here rather than left for `createRxDatabase` to reconcile.
const resolveStorage = async (
  mode: StorageMode
): Promise<RxStorage<unknown, unknown>> => {
  const storage: RxStorage<unknown, unknown> =
    mode === 'memory'
      ? // Imported lazily: this is the private-browsing fallback and what the
        // tests run against, and neither should cost the production bundle.
        (await import('rxdb/plugins/storage-memory')).getRxStorageMemory()
      : getRxStorageDexie();

  // Dev-mode refuses to run without a validator wrapping the storage, on the
  // grounds that data which doesn't match its schema is the single biggest
  // source of baffling RxDB bugs. Like dev-mode, it never reaches production.
  if (import.meta.env.DEV) {
    const { wrappedValidateAjvStorage } = await import(
      'rxdb/plugins/validate-ajv'
    );
    return wrappedValidateAjvStorage({ storage });
  }

  return storage;
};

const create = async (mode: StorageMode): Promise<RxDatabase<Collections>> => {
  const db = await createRxDatabase<Collections>({
    name:
      mode === 'indexeddb'
        ? DB_NAME
        : // An in-memory database is gone at the next reload, so it has no
          // identity worth preserving. Naming each one uniquely stops a fresh
          // open from attaching to the state a closed one left behind.
          `${DB_NAME}-${createResumeId()}`,
    storage: await resolveStorage(mode),
    // Cross-tab coordination is pointless for a database that lives and dies
    // with the page, and it makes tests reach for BroadcastChannel.
    multiInstance: mode === 'indexeddb',
    eventReduce: true,
  });

  await db.addCollections({
    resumes: { schema: resumeSchema },
    thumbnails: { schema: thumbnailSchema },
    appmeta: { schema: appMetaSchema },
  });

  return db;
};

/**
 * Open the database, falling back to in-memory storage when the browser refuses
 * IndexedDB — private-mode Safari does, and so do some embedded webviews. The
 * session still works; the caller is told it won't persist so it can say so.
 */
export const initDatabase = async (
  options: { storage?: StorageMode } = {}
): Promise<StorageMode> => {
  if (!openPromise) {
    openPromise = (async () => {
      await addPlugins();

      if (options.storage) {
        return { db: await create(options.storage), mode: options.storage };
      }

      try {
        return { db: await create('indexeddb'), mode: 'indexeddb' as const };
      } catch (error) {
        console.error('Could not open the resume database:', error);
        return { db: await create('memory'), mode: 'memory' as const };
      }
    })();

    // A failed open shouldn't be memoized forever — the next attempt retries.
    openPromise.catch(() => {
      openPromise = null;
    });
  }

  return (await openPromise).mode;
};

const getDatabase = async (): Promise<RxDatabase<Collections>> => {
  if (!openPromise) await initDatabase();

  const pending = openPromise;
  if (!pending) {
    throw new ResumeStorageError(
      "This browser is blocking storage, so your resumes can't be saved here."
    );
  }
  return (await pending).db;
};

/** Close and forget the database. Tests use this to start from nothing. */
export const closeDatabase = async (): Promise<void> => {
  const pending = openPromise;
  openPromise = null;
  if (!pending) return;
  await pending.then(({ db }) => db.close()).catch(() => undefined);
};

// ---------------------------------------------------------------------------
// Write errors
// ---------------------------------------------------------------------------

const QUOTA_ERROR_NAMES = ['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'];

/**
 * IndexedDB reports a full disk by aborting the transaction, and RxDB wraps
 * that in an `RxError` — so the `DOMException` we care about is somewhere down
 * a chain of causes rather than the error we were handed.
 */
const isQuotaError = (error: unknown): boolean => {
  const seen = new Set<unknown>();
  const queue: unknown[] = [error];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);

    const { name } = current as { name?: unknown };
    if (typeof name === 'string' && QUOTA_ERROR_NAMES.includes(name)) {
      return true;
    }

    const { cause, parameters } = current as {
      cause?: unknown;
      parameters?: Record<string, unknown>;
    };
    if (cause) queue.push(cause);
    if (parameters) queue.push(...Object.values(parameters));
    if (Array.isArray(current)) queue.push(...current);
  }

  return false;
};

/**
 * Flatten a value to plain JSON before it is stored.
 *
 * Several model fields are typed `Date | string` and really do hold `Date`
 * objects while a resume is being edited. `localStorage` used to swallow that:
 * `JSON.stringify` quietly rendered them as ISO strings. RxDB instead refuses
 * to structured-clone a `Date` at all (error DOC24), so the same flattening has
 * to be explicit here — which keeps what lands in storage identical to what the
 * previous layer wrote.
 */
const toPlainJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Run a write, turning any failure into a message the user can act on. */
const write = async <T>(action: () => Promise<T>): Promise<T> => {
  try {
    return await action();
  } catch (error) {
    console.error('Could not write to the resume database:', error);
    throw new ResumeStorageError(
      isQuotaError(error)
        ? "This browser's storage is full, so your latest changes weren't saved. Deleting a resume or a large profile photo will free up room."
        : "Your latest changes couldn't be saved to this browser."
    );
  }
};

/**
 * Physically drop a collection's deleted rows.
 *
 * `RxDocument.remove()` is a *soft* delete: RxDB rewrites the row with
 * `_deleted: true` and the document body untouched, and only a cleanup sweep
 * ever frees it. Tombstones exist so replication can tell "deleted" from "never
 * seen" — nothing here replicates, so all they do is leave a deleted resume's
 * employers, dates and contact details sitting in IndexedDB, readable from
 * devtools by whoever opens the browser next. A grace period of `0` purges the
 * row being deleted along with any tombstone an earlier version left behind.
 *
 * This calls the storage's own cleanup rather than registering
 * `RxDBCleanupPlugin`, which sweeps on a background timer (a minute after the
 * collection opens, then throttled to every five) instead of at the moment of
 * deletion, needs the leader-election plugin to satisfy its own default policy,
 * and pulls the replication protocol into a bundle that never replicates.
 */
const purgeDeleted = async <T>(collection: RxCollection<T>): Promise<void> => {
  // `cleanup` reports false when it stopped early rather than block the storage
  // for too long, so it has to be asked again until it says it is finished.
  let done = false;
  while (!done) {
    done = await collection.storageInstance.cleanup(0);
  }
};

// ---------------------------------------------------------------------------
// Ids and names
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

/** "Senior PM" → "Senior PM (copy)" → "Senior PM (copy 2)" → … */
const nextCopyName = (name: string, taken: Set<string>): string => {
  const first = `${name} (copy)`;
  if (!taken.has(first)) return first;

  for (let n = 2; n < taken.size + 3; n += 1) {
    const candidate = `${name} (copy ${n})`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${name} (copy ${Date.now()})`;
};

// ---------------------------------------------------------------------------
// Resumes
// ---------------------------------------------------------------------------

const toSummary = (doc: ResumeDocType): ResumeSummary => ({
  id: doc.id,
  name: doc.name,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

/** Every resume, most recently edited first. */
export const listResumes = async (): Promise<ResumeSummary[]> => {
  const db = await getDatabase();
  const docs = await db.resumes.find({ sort: [{ updatedAt: 'desc' }] }).exec();
  return docs.map((doc) => toSummary(doc.toJSON() as ResumeDocType));
};

/**
 * Watch the library. The callback fires with the current list immediately and
 * again on every change, including one made in another tab. Documents are
 * mapped down to summaries here so the resume bodies never reach React.
 */
export const subscribeToResumes = (
  onChange: (resumes: ResumeSummary[]) => void
): (() => void) => {
  let subscription: { unsubscribe: () => void } | undefined;
  let cancelled = false;

  void (async () => {
    try {
      const db = await getDatabase();
      if (cancelled) return;

      subscription = db.resumes
        .find({ sort: [{ updatedAt: 'desc' }] })
        .$.subscribe((docs) => {
          onChange(docs.map((doc) => toSummary(doc.toJSON() as ResumeDocType)));
        });
    } catch (error) {
      console.error('Could not watch the resume library:', error);
    }
  })();

  return () => {
    cancelled = true;
    subscription?.unsubscribe();
  };
};

export const readDocument = async (
  id: string
): Promise<ResumeDocument | undefined> => {
  const db = await getDatabase();
  const doc = await db.resumes.findOne(id).exec();
  if (!doc) return undefined;

  // `toMutableJSON`, not `toJSON`: dev-mode deep-freezes document data, and
  // this goes straight into the editor's reducer and its forms.
  const data = doc.toMutableJSON();
  return { resume: data.resume, settings: resolveSettings(data.settings) };
};

/** Persist a resume's content and count it as an edit. */
export const saveDocument = async (
  id: string,
  document: ResumeDocument
): Promise<void> =>
  write(async () => {
    const db = await getDatabase();
    const doc = await db.resumes.findOne(id).exec();
    if (!doc) return;

    await doc.incrementalPatch({
      resume: toPlainJson(document.resume),
      settings: toPlainJson(document.settings),
      updatedAt: Date.now(),
    });
  });

/**
 * A new resume starts from the sample content rather than an empty form: a
 * blank editor gives the preview nothing to render, so the first thing a new
 * resume would show is an empty page. Seeded content makes every section
 * visibly editable, and overwriting placeholder text is a shorter path than
 * filling twelve empty ones.
 */
export const createResume = async (
  options: CreateResumeOptions = {}
): Promise<ResumeSummary> => {
  const settings = options.settings ?? (await readDefaultSettings());
  const now = Date.now();
  const summary: ResumeSummary = {
    id: createResumeId(),
    name: options.name?.trim() || UNTITLED_RESUME_NAME,
    createdAt: now,
    updatedAt: now,
  };

  await write(async () => {
    const db = await getDatabase();
    await db.resumes.insert({
      ...summary,
      resume: toPlainJson(options.resume ?? sampleResume()),
      settings: toPlainJson(settings),
    });
  });

  return summary;
};

export const duplicateResume = async (
  id: string
): Promise<ResumeSummary | undefined> => {
  const db = await getDatabase();
  const source = await db.resumes.findOne(id).exec();
  if (!source) return undefined;

  const data = source.toMutableJSON();
  const existing = await db.resumes.find().exec();
  const now = Date.now();
  const summary: ResumeSummary = {
    id: createResumeId(),
    name: nextCopyName(data.name, new Set(existing.map((doc) => doc.name))),
    createdAt: now,
    updatedAt: now,
  };

  await write(() =>
    db.resumes.insert({
      ...summary,
      resume: data.resume,
      settings: data.settings,
    })
  );

  // The copy renders identically, so hand it the original's thumbnail rather
  // than making its card sit blank while a duplicate re-renders.
  void copyThumbnail(id, summary.id);

  return summary;
};

export const renameResume = async (id: string, name: string): Promise<void> => {
  const trimmed = name.trim();
  // An empty title reverts rather than committing a nameless card.
  if (!trimmed) return;

  await write(async () => {
    const db = await getDatabase();
    const doc = await db.resumes.findOne(id).exec();
    await doc?.incrementalPatch({ name: trimmed, updatedAt: Date.now() });
  });
};

/**
 * Delete a resume for good — the row itself, not just a tombstone. Deleting is
 * the only way to get a resume out of this browser, so it has to actually take
 * the contents with it.
 */
export const deleteResume = async (id: string): Promise<void> => {
  await write(async () => {
    const db = await getDatabase();
    const doc = await db.resumes.findOne(id).exec();
    if (!doc) return;

    await doc.remove();
    await purgeDeleted(db.resumes);
  });

  // RxDB only drops attachments belonging to the document being removed, so the
  // thumbnail — which lives in its own collection — has to be cleared here.
  await deleteThumbnail(id);
};

// ---------------------------------------------------------------------------
// Default settings
// ---------------------------------------------------------------------------

/** The look a newly created resume inherits — whatever was last chosen. */
export const readDefaultSettings = async (): Promise<ResumeSettings> => {
  const db = await getDatabase();
  const doc = await db.appmeta.findOne(APP_META_ID).exec();
  return resolveSettings(doc?.toMutableJSON().defaultSettings);
};

export const saveDefaultSettings = async (
  settings: ResumeSettings
): Promise<void> => {
  const db = await getDatabase();
  await db.appmeta.upsert({
    id: APP_META_ID,
    defaultSettings: toPlainJson(settings),
  });
};

// ---------------------------------------------------------------------------
// Thumbnails
//
// Every function below fails soft. The image cache is a convenience; losing it
// costs a re-render, while letting it throw would take down the list screen.
// ---------------------------------------------------------------------------

export const getThumbnail = async (
  id: string
): Promise<ThumbnailRecord | undefined> => {
  try {
    const db = await getDatabase();
    const doc = await db.thumbnails.findOne(id).exec();
    const attachment = doc?.getAttachment(THUMBNAIL_ATTACHMENT_ID);
    if (!doc || !attachment) return undefined;

    return { png: await attachment.getData(), stamp: doc.stamp };
  } catch (error) {
    console.error('Error reading cached thumbnail:', error);
    return undefined;
  }
};

export const putThumbnail = async (
  id: string,
  record: ThumbnailRecord
): Promise<void> => {
  try {
    const db = await getDatabase();
    const doc = await db.thumbnails.upsert({
      resumeId: id,
      stamp: record.stamp,
    });
    await doc.putAttachment({
      id: THUMBNAIL_ATTACHMENT_ID,
      type: 'image/png',
      data: record.png,
    });
  } catch (error) {
    console.error('Error caching thumbnail:', error);
  }
};

export const deleteThumbnail = async (id: string): Promise<void> => {
  try {
    const db = await getDatabase();
    const doc = await db.thumbnails.findOne(id).exec();
    if (!doc) return;

    // Removing the document does hard-delete its PNG — attachment blobs are
    // stored outside the row and dropped outright — so the purge here is for
    // the `{ resumeId, stamp }` row that would otherwise linger behind it.
    await doc.remove();
    await purgeDeleted(db.thumbnails);
  } catch (error) {
    console.error('Error deleting cached thumbnail:', error);
  }
};

/**
 * Files the source resume's image under a second id, so a duplicated resume
 * shows its card immediately instead of blank. Composed from the read and write
 * above, which already swallow their own failures.
 */
export const copyThumbnail = async (
  fromId: string,
  toId: string
): Promise<void> => {
  const record = await getThumbnail(fromId);
  if (!record) return;
  await putThumbnail(toId, record);
};

// ---------------------------------------------------------------------------
// Testing
// ---------------------------------------------------------------------------

/**
 * How many rows the storage still holds under `id` — the resume, its thumbnail,
 * or a tombstone of either.
 *
 * Exists for the tests. A purge is invisible through every other export here,
 * because RxDB's queries hide deleted rows whether or not those rows are
 * actually gone, so this is the only way to prove a delete left nothing behind.
 */
export const countStoredRows = async (id: string): Promise<number> => {
  const db = await getDatabase();
  const [resumes, thumbnails] = await Promise.all([
    db.resumes.storageInstance.findDocumentsById([id], true),
    db.thumbnails.storageInstance.findDocumentsById([id], true),
  ]);

  return resumes.length + thumbnails.length;
};
