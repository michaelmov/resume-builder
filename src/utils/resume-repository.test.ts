import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { emptyResume } from '../mocks/empty-resume';
import { SectionTypes } from '../types/resume.model';

import {
  closeDatabase,
  countStoredRows,
  createResume,
  createResumeId,
  deleteResume,
  deleteThumbnail,
  duplicateResume,
  getThumbnail,
  initDatabase,
  listResumes,
  putThumbnail,
  readDefaultSettings,
  readDocument,
  renameResume,
  saveDefaultSettings,
  saveDocument,
  subscribeToResumes,
} from './resume-repository';
import { DEFAULT_SETTINGS } from './resume-settings';

/**
 * Run against RxDB's in-memory storage rather than IndexedDB: it needs no shim
 * in the `node` test environment and exercises the same RxDB code paths. What
 * is under test is this module's logic, not the Dexie adapter.
 */
beforeEach(async () => {
  await initDatabase({ storage: 'memory' });
});

afterEach(async () => {
  await closeDatabase();
  vi.restoreAllMocks();
});

/** Lets pending subscription callbacks run. */
const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Waits long enough for the next write to land on a later `updatedAt`. The
 * timestamps are epoch milliseconds, so writes in one tick sort as a tie.
 */
const nextMillisecond = () => new Promise((resolve) => setTimeout(resolve, 2));

describe('the library', () => {
  it('starts empty — a new browser is not seeded with a sample resume', async () => {
    expect(await listResumes()).toEqual([]);
  });

  it('creates a resume with sample content and the default look', async () => {
    const summary = await createResume();

    expect(summary.name).toBe('Untitled resume');
    expect(summary.createdAt).toBe(summary.updatedAt);

    const document = await readDocument(summary.id);
    expect(document?.settings).toEqual(DEFAULT_SETTINGS);
    expect(document?.resume.basics.name).toBeTruthy();
    expect(document?.resume.work.length).toBeGreaterThan(0);
  });

  it('takes a name, content and settings when given them', async () => {
    const resume = emptyResume();
    resume.basics.name = 'Ada Lovelace';

    const summary = await createResume({
      name: '  Research role  ',
      resume,
      settings: { templateId: 'mono', accentId: null, marginId: 'wide' },
    });

    expect(summary.name).toBe('Research role');

    const document = await readDocument(summary.id);
    expect(document?.resume.basics.name).toBe('Ada Lovelace');
    expect(document?.settings.templateId).toBe('mono');
    expect(document?.settings.marginId).toBe('wide');
  });

  it('lists resumes most recently edited first', async () => {
    const first = await createResume({ name: 'First' });
    await nextMillisecond();
    await createResume({ name: 'Second' });

    expect((await listResumes()).map((resume) => resume.name)).toEqual([
      'Second',
      'First',
    ]);

    // Editing the older one moves it to the front — the list sorts by edit,
    // not by creation.
    await nextMillisecond();
    await saveDocument(first.id, {
      resume: emptyResume(),
      settings: DEFAULT_SETTINGS,
    });

    expect((await listResumes()).map((resume) => resume.name)).toEqual([
      'First',
      'Second',
    ]);
  });

  it('returns undefined for a resume that does not exist', async () => {
    expect(await readDocument('nope')).toBeUndefined();
  });
});

describe('editing', () => {
  it('saves content and counts it as an edit', async () => {
    const summary = await createResume({ name: 'Editable' });
    const resume = emptyResume();
    resume.basics.name = 'Grace Hopper';

    await saveDocument(summary.id, { resume, settings: DEFAULT_SETTINGS });

    const [listed] = await listResumes();
    expect(listed.updatedAt).toBeGreaterThanOrEqual(summary.updatedAt);
    expect((await readDocument(summary.id))?.resume.basics.name).toBe(
      'Grace Hopper'
    );
  });

  it('renames a resume, but ignores a blank name', async () => {
    const summary = await createResume({ name: 'Before' });

    await renameResume(summary.id, '  After  ');
    expect((await listResumes())[0].name).toBe('After');

    await renameResume(summary.id, '   ');
    expect((await listResumes())[0].name).toBe('After');
  });

  it('saving a missing resume is a no-op, not a crash', async () => {
    await expect(
      saveDocument('gone', {
        resume: emptyResume(),
        settings: DEFAULT_SETTINGS,
      })
    ).resolves.toBeUndefined();
  });
});

describe('sectionOrder round-trip', () => {
  it('keeps an absent order absent — it means "the default sections"', async () => {
    const resume = emptyResume();
    delete resume.sectionOrder;

    const summary = await createResume({ resume });

    expect(
      (await readDocument(summary.id))?.resume.sectionOrder
    ).toBeUndefined();
  });

  it('keeps an empty order empty — it means "no sections at all"', async () => {
    const resume = emptyResume();
    resume.sectionOrder = [];

    const summary = await createResume({ resume });

    expect((await readDocument(summary.id))?.resume.sectionOrder).toEqual([]);
  });

  it('preserves a populated order', async () => {
    const resume = emptyResume();
    resume.sectionOrder = [SectionTypes.Projects, SectionTypes.Skills];

    const summary = await createResume({ resume });

    expect((await readDocument(summary.id))?.resume.sectionOrder).toEqual([
      SectionTypes.Projects,
      SectionTypes.Skills,
    ]);
  });
});

describe('duplicating', () => {
  it('copies content and settings under an unused "(copy)" name', async () => {
    const resume = emptyResume();
    resume.basics.name = 'Original';
    const source = await createResume({
      name: 'Senior PM',
      resume,
      settings: { templateId: 'mono', accentId: null, marginId: 'narrow' },
    });

    const copy = await duplicateResume(source.id);

    expect(copy?.name).toBe('Senior PM (copy)');
    const document = await readDocument(copy?.id ?? '');
    expect(document?.resume.basics.name).toBe('Original');
    expect(document?.settings.templateId).toBe('mono');
  });

  it('escalates the suffix rather than colliding', async () => {
    const source = await createResume({ name: 'Senior PM' });

    expect((await duplicateResume(source.id))?.name).toBe('Senior PM (copy)');
    expect((await duplicateResume(source.id))?.name).toBe('Senior PM (copy 2)');
    expect((await duplicateResume(source.id))?.name).toBe('Senior PM (copy 3)');
  });

  it('returns undefined for a resume that does not exist', async () => {
    expect(await duplicateResume('gone')).toBeUndefined();
  });
});

describe('deleting', () => {
  it('removes the resume and does not resurrect a sample', async () => {
    const summary = await createResume({ name: 'Temporary' });

    await deleteResume(summary.id);

    expect(await listResumes()).toEqual([]);
    expect(await readDocument(summary.id)).toBeUndefined();
  });

  it('clears the resume thumbnail too', async () => {
    const summary = await createResume({ name: 'With thumbnail' });
    await putThumbnail(summary.id, {
      png: new Blob(['png'], { type: 'image/png' }),
      stamp: summary.updatedAt,
    });
    expect(await getThumbnail(summary.id)).toBeDefined();

    await deleteResume(summary.id);

    expect(await getThumbnail(summary.id)).toBeUndefined();
  });

  it('takes the stored rows with it rather than leaving tombstones', async () => {
    const summary = await createResume({ name: 'Confidential' });
    await putThumbnail(summary.id, {
      png: new Blob(['png'], { type: 'image/png' }),
      stamp: summary.updatedAt,
    });
    expect(await countStoredRows(summary.id)).toBe(2);

    await deleteResume(summary.id);

    // A soft delete would still count both: RxDB keeps the row, body and all,
    // marked `_deleted` — invisible to every query but sitting in the browser.
    expect(await countStoredRows(summary.id)).toBe(0);
  });

  it('deleting a missing resume is a no-op', async () => {
    await expect(deleteResume('gone')).resolves.toBeUndefined();
  });
});

describe('thumbnails', () => {
  it('round-trips a PNG blob with its stamp', async () => {
    const summary = await createResume();
    const png = new Blob(['fake-png-bytes'], { type: 'image/png' });

    await putThumbnail(summary.id, { png, stamp: 1234 });
    const cached = await getThumbnail(summary.id);

    expect(cached?.stamp).toBe(1234);
    expect(await cached?.png.text()).toBe('fake-png-bytes');
  });

  it('replaces an existing thumbnail on re-capture', async () => {
    const summary = await createResume();

    await putThumbnail(summary.id, {
      png: new Blob(['first'], { type: 'image/png' }),
      stamp: 1,
    });
    await putThumbnail(summary.id, {
      png: new Blob(['second'], { type: 'image/png' }),
      stamp: 2,
    });

    const cached = await getThumbnail(summary.id);
    expect(cached?.stamp).toBe(2);
    expect(await cached?.png.text()).toBe('second');
  });

  it('reports a miss rather than throwing', async () => {
    expect(await getThumbnail('never-rendered')).toBeUndefined();
    await expect(deleteThumbnail('never-rendered')).resolves.toBeUndefined();
  });
});

describe('default settings', () => {
  it('falls back to the defaults before anything is remembered', async () => {
    expect(await readDefaultSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('remembers a look for the next new resume to inherit', async () => {
    await saveDefaultSettings({
      templateId: 'mono',
      accentId: null,
      marginId: 'wide',
    });

    expect(await readDefaultSettings()).toMatchObject({
      templateId: 'mono',
      marginId: 'wide',
    });
    expect(
      (await readDocument((await createResume()).id))?.settings
    ).toMatchObject({ templateId: 'mono', marginId: 'wide' });
  });

  it('coerces a retired template id back to the default', async () => {
    await saveDefaultSettings({
      templateId: 'retired-template',
      accentId: 'retired-accent',
      marginId: 'retired-margin',
    });

    expect(await readDefaultSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('subscribeToResumes', () => {
  it('reports the current list and every change to it', async () => {
    const seen: string[][] = [];
    const unsubscribe = subscribeToResumes((resumes) =>
      seen.push(resumes.map((resume) => resume.name))
    );

    await nextTick();
    await createResume({ name: 'Watched' });
    await nextTick();
    await renameResume((await listResumes())[0].id, 'Renamed');
    await nextTick();

    unsubscribe();
    expect(seen[0]).toEqual([]);
    expect(seen.at(-1)).toEqual(['Renamed']);
  });

  it('stops reporting once unsubscribed', async () => {
    const seen: number[] = [];
    const unsubscribe = subscribeToResumes((resumes) =>
      seen.push(resumes.length)
    );

    await nextTick();
    unsubscribe();
    const before = seen.length;

    await createResume({ name: 'Ignored' });
    await nextTick();

    expect(seen.length).toBe(before);
  });
});

describe('createResumeId', () => {
  it('mints unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createResumeId()));
    expect(ids.size).toBe(50);
  });

  it('falls back when randomUUID is unavailable outside a secure context', () => {
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
      throw new Error('not a secure context');
    });
    // The guard checks for the function, so stub it away entirely instead.
    vi.stubGlobal('crypto', {});

    expect(createResumeId()).toMatch(/^r-/);

    vi.unstubAllGlobals();
  });
});
