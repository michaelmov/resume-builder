import { beforeEach, describe, expect, it, vi } from 'vitest';

import { emptyResume } from '../mocks/empty-resume';
import { Resume } from '../types/resume.model';

import {
  createResumeId,
  DEFAULT_SETTINGS,
  loadLibrary,
  readDefaultSettings,
  readDocument,
  removeDocument,
  ResumeStorageError,
  resolveSettings,
  saveDocument,
  saveIndex,
  sortByRecency,
} from './resume-storage';

/**
 * Vitest runs in the `node` environment, so there is no `window`. A hand-rolled
 * store is enough here and keeps the quota case testable — jsdom's localStorage
 * has no way to make a write fail on demand.
 */
class MemoryStorage implements Storage {
  private entries = new Map<string, string>();

  /** Set to make the next `setItem` throw, standing in for a full disk. */
  failWrites: DOMException | null = null;

  get length(): number {
    return this.entries.size;
  }

  key(index: number): string | null {
    return [...this.entries.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw this.failWrites;
    this.entries.set(key, value);
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}

let store: MemoryStorage;

beforeEach(() => {
  store = new MemoryStorage();
  vi.stubGlobal('window', { localStorage: store });
  // Migration and repair log through console.error by design; keep the test
  // output readable without hiding a genuine crash.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const readIndexEntries = () =>
  JSON.parse(store.getItem('resume-index') ?? '{}').resumes as {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
  }[];

const legacyResume = (overrides: Partial<Resume> = {}): Resume => ({
  ...emptyResume(),
  basics: { ...emptyResume().basics, name: 'Ada Lovelace' },
  ...overrides,
});

describe('loadLibrary — first run', () => {
  it('seeds the sample resume when there is nothing to migrate', () => {
    const library = loadLibrary();

    expect(library).toHaveLength(1);
    expect(library[0].name).toBe('Sample Resume');

    const document = readDocument(library[0].id);
    expect(document?.resume.basics.name).toBeTruthy();
    expect(document?.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('migrates a legacy resume, keeping its name and look', () => {
    store.setItem('resume-data', JSON.stringify(legacyResume()));
    store.setItem('selected-template', 'aria');
    store.setItem('selected-accent', 'sage');
    store.setItem('selected-margin', 'wide');

    const library = loadLibrary();

    expect(library).toHaveLength(1);
    expect(library[0].name).toBe('Ada Lovelace');

    const document = readDocument(library[0].id);
    expect(document?.resume.basics.name).toBe('Ada Lovelace');
    expect(document?.settings).toEqual({
      templateId: 'aria',
      accentId: 'sage',
      marginId: 'wide',
    });
    // The migrated look also becomes the default the next new resume inherits.
    expect(readDefaultSettings()).toEqual(document?.settings);
  });

  it('names an unnamed legacy resume "My Resume"', () => {
    store.setItem('resume-data', JSON.stringify(emptyResume()));

    expect(loadLibrary()[0].name).toBe('My Resume');
  });

  it('retires the legacy keys once the new shape is written', () => {
    store.setItem('resume-data', JSON.stringify(legacyResume()));
    store.setItem('selected-template', 'aria');
    store.setItem('selected-accent', 'sage');
    store.setItem('selected-margin', 'wide');

    loadLibrary();

    expect(store.getItem('resume-data')).toBeNull();
    expect(store.getItem('selected-template')).toBeNull();
    expect(store.getItem('selected-accent')).toBeNull();
    expect(store.getItem('selected-margin')).toBeNull();
  });

  it('treats a missing legacy accent as Auto', () => {
    store.setItem('resume-data', JSON.stringify(legacyResume()));
    store.setItem('selected-template', 'aria');

    const library = loadLibrary();

    expect(readDocument(library[0].id)?.settings.accentId).toBeNull();
  });

  it('migrates legacy string interest keywords to { value }', () => {
    store.setItem(
      'resume-data',
      JSON.stringify({
        ...legacyResume(),
        interests: [{ name: 'Music', keywords: ['Jazz', 'Piano'] }],
      })
    );

    const library = loadLibrary();

    expect(readDocument(library[0].id)?.resume.interests[0].keywords).toEqual([
      { value: 'Jazz' },
      { value: 'Piano' },
    ]);
  });
});

describe('loadLibrary — subsequent runs', () => {
  it('does not re-seed the sample after every resume is deleted', () => {
    loadLibrary();
    const seeded = readIndexEntries();
    removeDocument(seeded[0].id);
    saveIndex([]);

    // An index that exists but is empty means "migrated, then emptied" — the
    // distinction that keeps the sample from reappearing.
    expect(loadLibrary()).toEqual([]);
  });

  it('reads an existing index without touching it', () => {
    const entries = [
      { id: 'a', name: 'Senior PM', createdAt: 1, updatedAt: 10 },
      { id: 'b', name: 'Frontend', createdAt: 2, updatedAt: 20 },
    ];
    saveIndex(entries);

    expect(loadLibrary().map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('drops malformed entries rather than failing the whole read', () => {
    saveIndex([
      { id: 'a', name: 'Kept', createdAt: 1, updatedAt: 1 },
      { name: 'No id', createdAt: 1, updatedAt: 1 },
      null,
    ] as never);

    expect(loadLibrary().map((r) => r.name)).toEqual(['Kept']);
  });
});

describe('loadLibrary — recovery', () => {
  it('rebuilds a damaged index from the documents still on disk', () => {
    saveDocument('one', {
      resume: legacyResume(),
      settings: DEFAULT_SETTINGS,
    });
    store.setItem('resume-index', '{ not json');

    const library = loadLibrary();

    expect(library).toHaveLength(1);
    expect(library[0]).toMatchObject({ id: 'one', name: 'Ada Lovelace' });
    // The repair is persisted, so the next load is an ordinary read.
    expect(readIndexEntries()).toHaveLength(1);
  });

  it('does not resurrect the sample when the index is damaged but empty', () => {
    store.setItem('resume-index', 'null');

    expect(loadLibrary()).toEqual([]);
  });

  it('returns an empty library instead of throwing when writes fail', () => {
    store.failWrites = new DOMException('full', 'QuotaExceededError');

    expect(loadLibrary()).toEqual([]);
  });
});

describe('documents', () => {
  it('round-trips a document', () => {
    const document = {
      resume: legacyResume(),
      settings: { templateId: 'mono', accentId: null, marginId: 'narrow' },
    };
    saveDocument('x', document);

    expect(readDocument('x')).toEqual(document);
  });

  it('returns undefined for a missing or shapeless document', () => {
    store.setItem('resume-doc:y', JSON.stringify({ settings: {} }));

    expect(readDocument('missing')).toBeUndefined();
    expect(readDocument('y')).toBeUndefined();
  });

  it('reports a quota failure rather than losing the write silently', () => {
    store.failWrites = new DOMException('full', 'QuotaExceededError');

    expect(() =>
      saveDocument('x', { resume: emptyResume(), settings: DEFAULT_SETTINGS })
    ).toThrow(ResumeStorageError);
  });
});

describe('resolveSettings', () => {
  it('keeps ids that still exist', () => {
    expect(
      resolveSettings({
        templateId: 'folio',
        accentId: 'blush',
        marginId: 'wide',
      })
    ).toEqual({ templateId: 'folio', accentId: 'blush', marginId: 'wide' });
  });

  it('falls back when a template or margin has been retired', () => {
    expect(
      resolveSettings({
        templateId: 'gone',
        accentId: 'gone',
        marginId: 'gone',
      })
    ).toEqual(DEFAULT_SETTINGS);
  });

  it('treats a missing accent as Auto rather than a default color', () => {
    expect(resolveSettings({ templateId: 'duo' }).accentId).toBeNull();
    expect(resolveSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });
});

describe('helpers', () => {
  it('mints distinct ids', () => {
    expect(createResumeId()).not.toBe(createResumeId());
  });

  it('sorts by most recently edited without mutating the input', () => {
    const input = [
      { id: 'a', name: 'A', createdAt: 0, updatedAt: 1 },
      { id: 'b', name: 'B', createdAt: 0, updatedAt: 3 },
      { id: 'c', name: 'C', createdAt: 0, updatedAt: 2 },
    ];

    expect(sortByRecency(input).map((r) => r.id)).toEqual(['b', 'c', 'a']);
    expect(input.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
});
