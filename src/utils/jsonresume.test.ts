import { describe, expect, it } from 'vitest';

import { resumeMock } from '../mocks/resume.mock';
import { ResumeSettings } from '../types/resume-library';
import { Resume, SectionTypes, Work } from '../types/resume.model';

import {
  fromJsonResume,
  JsonResume,
  readResumeDocumentMeta,
  ResumeDocumentMeta,
  toJsonResume,
} from './jsonresume';

/** A complete but empty `Resume` so each test only sets the fields it cares about. */
const emptyResume = (): Resume => ({
  basics: {
    name: '',
    label: '',
    image: '',
    email: '',
    phone: '',
    url: '',
    summary: '',
  },
  work: [],
  volunteer: [],
  education: [],
  awards: [],
  certificates: [],
  publications: [],
  skills: [],
  languages: [],
  interests: [],
  references: [],
  projects: [],
});

const workEntry = (overrides: Partial<Work> = {}): Work => ({
  name: 'Acme',
  position: 'Engineer',
  url: 'https://acme.test',
  startDate: '2020-01-01',
  endDate: '2022-01-01',
  isPresent: false,
  summary: 'Did things',
  highlights: [{ value: 'Shipped a feature' }],
  ...overrides,
});

/** Ids that exist in the real template/accent/margin registries. */
const realSettings = (
  overrides: Partial<ResumeSettings> = {}
): ResumeSettings => ({
  templateId: 'linea',
  accentId: 'sage',
  marginId: 'wide',
  ...overrides,
});

/** Wrap an arbitrary value as the app's namespaced block inside `meta`. */
const withAppMeta = (block: unknown) => ({ meta: { 'resume-builder': block } });

const appMetaOf = (json: JsonResume): Record<string, unknown> =>
  (json.meta?.['resume-builder'] ?? {}) as Record<string, unknown>;

/** Mimic the real file write/read boundary. */
const throughFile = (json: JsonResume) => JSON.parse(JSON.stringify(json));

describe('toJsonResume (export → JSON Resume schema)', () => {
  it('normalizes Date objects to YYYY-MM-DD strings', () => {
    const resume = emptyResume();
    resume.work = [workEntry({ startDate: new Date('2013-01-01') })];

    const json = toJsonResume(resume);

    expect(json.work?.[0].startDate).toBe('2013-01-01');
  });

  it('normalizes ISO timestamp strings to date-only strings', () => {
    const resume = emptyResume();
    resume.work = [workEntry({ endDate: '2014-06-15T00:00:00.000Z' })];

    expect(toJsonResume(resume).work?.[0].endDate).toBe('2014-06-15');
  });

  it('preserves valid partial dates and leaves unparseable values untouched', () => {
    const resume = emptyResume();
    resume.projects = [
      {
        name: 'P',
        description: '',
        highlights: [],
        keywords: [],
        startDate: '2019',
        endDate: 'someday',
        url: '',
        roles: [],
        entity: '',
        type: '',
      },
    ];

    const project = toJsonResume(resume).projects?.[0];
    expect(project?.startDate).toBe('2019');
    expect(project?.endDate).toBe('someday');
  });

  it('unwraps { value } highlights and keywords to plain strings', () => {
    const resume = emptyResume();
    resume.work = [
      workEntry({
        highlights: [{ value: 'One' }, { value: 'Two' }],
      }),
    ];
    resume.skills = [
      { name: 'Web', level: 'Master', keywords: [{ value: 'HTML' }] },
    ];

    const json = toJsonResume(resume);
    expect(json.work?.[0].highlights).toEqual(['One', 'Two']);
    expect(json.skills?.[0].keywords).toEqual(['HTML']);
  });

  it('omits endDate for a present role and keeps it otherwise', () => {
    const resume = emptyResume();
    resume.work = [
      workEntry({ isPresent: true, endDate: '2022-01-01' }),
      workEntry({ isPresent: false, endDate: '2019-01-01' }),
    ];

    const [present, past] = toJsonResume(resume).work ?? [];
    expect(present).not.toHaveProperty('endDate');
    expect(past.endDate).toBe('2019-01-01');
  });

  it('strips the isPresent field (not part of the schema)', () => {
    const resume = emptyResume();
    resume.work = [workEntry()];

    expect(toJsonResume(resume).work?.[0]).not.toHaveProperty('isPresent');
  });

  it('prunes empty strings and empty arrays', () => {
    const resume = emptyResume();
    resume.work = [workEntry({ url: '', summary: '', highlights: [] })];

    const entry = toJsonResume(resume).work?.[0] ?? {};
    expect(entry).not.toHaveProperty('url');
    expect(entry).not.toHaveProperty('summary');
    expect(entry).not.toHaveProperty('highlights');
    expect(entry.name).toBe('Acme');
  });

  it('moves app state under meta and keeps it out of the root', () => {
    const resume = emptyResume();
    resume.sectionVisibility = { skills: true };

    const json = toJsonResume(resume);
    expect(json).not.toHaveProperty('sectionVisibility');
    expect(json.meta).toHaveProperty(
      ['resume-builder', 'sectionVisibility', 'skills'],
      true
    );
  });

  it('emits standard JSON Resume meta fields', () => {
    const json = toJsonResume(emptyResume());
    expect(json.meta).toHaveProperty('canonical');
    expect(json.meta).toHaveProperty('version');
    expect(json.meta).toHaveProperty('lastModified');
  });

  it('unwraps interests keywords to plain strings', () => {
    const resume = emptyResume();
    resume.interests = [{ name: 'Wildlife', keywords: [{ value: 'Ferrets' }] }];

    expect(toJsonResume(resume).interests?.[0].keywords).toEqual(['Ferrets']);
  });

  it('emits an unchanged document when no document meta is passed', () => {
    const json = toJsonResume(emptyResume());

    // Pinned in full: the optional second argument must be invisible when
    // absent, since exported files (and the assertions above) depend on this
    // exact shape.
    expect({
      ...json,
      meta: { ...json.meta, lastModified: '<timestamp>' },
    }).toStrictEqual({
      basics: {},
      work: [],
      volunteer: [],
      education: [],
      awards: [],
      certificates: [],
      publications: [],
      skills: [],
      languages: [],
      interests: [],
      references: [],
      projects: [],
      meta: {
        canonical: 'https://jsonresume.org/schema/',
        version: 'v1.0.0',
        lastModified: '<timestamp>',
        'resume-builder': {},
      },
    });
  });

  it('adds no meta keys for an absent or empty document meta', () => {
    const resume = emptyResume();
    resume.sectionOrder = [SectionTypes.Work];

    const keys = (meta?: ResumeDocumentMeta) =>
      Object.keys(appMetaOf(toJsonResume(resume, meta)));

    expect(keys()).toEqual(['sectionOrder']);
    expect(keys({})).toEqual(['sectionOrder']);
    expect(keys({ name: undefined, settings: undefined })).toEqual([
      'sectionOrder',
    ]);
  });

  it('writes name and settings alongside the existing section state', () => {
    const resume = emptyResume();
    resume.sectionTitles = { [SectionTypes.Work]: 'Experience' };

    const json = toJsonResume(resume, {
      name: 'Backend roles',
      settings: realSettings(),
    });

    expect(json).not.toHaveProperty('name');
    expect(appMetaOf(json)).toEqual({
      name: 'Backend roles',
      settings: realSettings(),
      sectionTitles: { [SectionTypes.Work]: 'Experience' },
    });
  });
});

describe('fromJsonResume (import → internal model)', () => {
  it('wraps string highlights and keywords into { value } objects', () => {
    const imported = fromJsonResume({
      work: [{ name: 'Co', highlights: ['Did a thing'] }],
      skills: [{ name: 'Web', keywords: ['HTML', 'CSS'] }],
    });

    expect(imported.work[0].highlights).toEqual([{ value: 'Did a thing' }]);
    expect(imported.skills[0].keywords).toEqual([
      { value: 'HTML' },
      { value: 'CSS' },
    ]);
  });

  it('tolerates legacy { value } lists on input', () => {
    const imported = fromJsonResume({
      skills: [{ name: 'Web', keywords: [{ value: 'HTML' }] }],
    });

    expect(imported.skills[0].keywords).toEqual([{ value: 'HTML' }]);
  });

  it('derives isPresent=true when endDate is missing', () => {
    const imported = fromJsonResume({
      work: [{ name: 'Co', startDate: '2020-01-01' }],
    });

    expect(imported.work[0].isPresent).toBe(true);
  });

  it('derives isPresent=false when endDate is present', () => {
    const imported = fromJsonResume({
      work: [{ name: 'Co', endDate: '2022-01-01' }],
    });

    expect(imported.work[0].isPresent).toBe(false);
  });

  it('honors an explicit isPresent flag from legacy exports', () => {
    const imported = fromJsonResume({
      work: [{ name: 'Co', endDate: '2022-01-01', isPresent: true }],
    });

    expect(imported.work[0].isPresent).toBe(true);
  });

  it('keeps dates as strings rather than Date objects', () => {
    const imported = fromJsonResume({
      work: [{ name: 'Co', startDate: '2020-01-01' }],
    });

    expect(typeof imported.work[0].startDate).toBe('string');
  });

  it('fills a complete basics object with defaults for missing fields', () => {
    const imported = fromJsonResume({ basics: { name: 'Ada' } });

    expect(imported.basics).toEqual({
      name: 'Ada',
      label: '',
      image: '',
      email: '',
      phone: '',
      url: '',
      summary: '',
      // Every editable key is present: leaving `location.city` undefined makes
      // react-hook-form keep the previous resume's value in that input on
      // re-seed instead of clearing it.
      location: {
        address: '',
        postalCode: '',
        city: '',
        countryCode: '',
        region: '',
      },
      profiles: undefined,
    });
  });

  it('keeps the location fields an imported resume does provide', () => {
    const imported = fromJsonResume({
      basics: { name: 'Ada', location: { city: 'London' } },
    });

    expect(imported.basics.location).toEqual({
      address: '',
      postalCode: '',
      city: 'London',
      countryCode: '',
      region: '',
    });
  });

  it('omits an all-empty location on export rather than emitting {}', () => {
    const imported = fromJsonResume({ basics: { name: 'Ada' } });

    expect(toJsonResume(imported).basics?.location).toBeUndefined();
  });

  it('defaults every missing section to an empty array', () => {
    const imported = fromJsonResume({});

    expect(imported.work).toEqual([]);
    expect(imported.education).toEqual([]);
    expect(imported.projects).toEqual([]);
    expect(imported.skills).toEqual([]);
  });

  it('recovers app state from meta', () => {
    const imported = fromJsonResume({
      meta: { 'resume-builder': { sectionVisibility: { work: true } } },
    });

    expect(imported.sectionVisibility).toEqual({ work: true });
  });

  it('recovers legacy top-level sectionVisibility', () => {
    const imported = fromJsonResume({ sectionVisibility: { work: true } });

    expect(imported.sectionVisibility).toEqual({ work: true });
  });

  it('still imports when the app meta block is garbage', () => {
    // Settings are read separately and leniently, so a malformed block costs
    // the settings, never the resume.
    const imported = fromJsonResume({
      basics: { name: 'Ada' },
      ...withAppMeta({ settings: 42, name: [] }),
    });

    expect(imported.basics.name).toBe('Ada');
  });

  it('ignores unknown fields instead of failing', () => {
    const imported = fromJsonResume({
      basics: { name: 'Ada', somethingExtra: true },
      work: [{ name: 'Co', location: 'Remote', description: 'unused' }],
    });

    expect(imported.basics.name).toBe('Ada');
    expect(imported.work[0].name).toBe('Co');
  });

  it.each([['a string'], [42], [null], [[]]])(
    'throws a descriptive error for invalid input (%s)',
    (input) => {
      expect(() => fromJsonResume(input)).toThrow(/valid JSON Resume/);
    }
  );
});

describe('round-trip', () => {
  it('preserves semantic content through export → JSON → import', () => {
    // Serialize through JSON to mimic the real file write/read boundary.
    const json = JSON.parse(JSON.stringify(toJsonResume(resumeMock)));
    const back = fromJsonResume(json);

    expect(back.basics.name).toBe(resumeMock.basics.name);
    expect(back.work[0].name).toBe(resumeMock.work[0].name);
    expect(back.work[0].highlights).toEqual(resumeMock.work[0].highlights);
    expect(back.skills[0].keywords).toEqual(resumeMock.skills[0].keywords);
    expect(back.projects[0].highlights).toEqual(
      resumeMock.projects[0].highlights
    );
    expect(back.sectionVisibility).toEqual(resumeMock.sectionVisibility);
  });

  it('round-trips custom section titles via namespaced meta', () => {
    const resume = emptyResume();
    resume.work = [workEntry()];
    resume.sectionOrder = [SectionTypes.Work];
    resume.sectionTitles = { [SectionTypes.Work]: 'Experience' };

    const json = JSON.parse(JSON.stringify(toJsonResume(resume)));
    // Stored under the app's namespaced meta so other tools ignore it.
    expect(json.meta['resume-builder'].sectionTitles).toEqual({
      [SectionTypes.Work]: 'Experience',
    });

    const back = fromJsonResume(json);
    expect(back.sectionTitles).toEqual({ [SectionTypes.Work]: 'Experience' });
  });

  it('drops a custom title that merely repeats the default', () => {
    const resume = emptyResume();
    resume.work = [workEntry()];
    resume.sectionTitles = { [SectionTypes.Work]: 'Work Experience' };

    const back = fromJsonResume(
      JSON.parse(JSON.stringify(toJsonResume(resume)))
    );
    expect(back.sectionTitles).toBeUndefined();
  });

  it('round-trips a present role (isPresent → omit endDate → isPresent)', () => {
    const resume = emptyResume();
    resume.work = [workEntry({ isPresent: true })];

    const json = JSON.parse(JSON.stringify(toJsonResume(resume)));
    const back = fromJsonResume(json);

    expect(back.work[0].isPresent).toBe(true);
    expect(back.work[0].endDate).toBe('');
  });

  it('round-trips a name and PDF settings via namespaced meta', () => {
    const meta: ResumeDocumentMeta = {
      name: 'Backend roles',
      settings: realSettings(),
    };

    const json = throughFile(toJsonResume(emptyResume(), meta));

    expect(readResumeDocumentMeta(json)).toEqual(meta);
  });

  it('round-trips a null accentId ("Auto") as null', () => {
    const meta: ResumeDocumentMeta = {
      name: 'Auto accent',
      settings: realSettings({ templateId: 'duo', accentId: null }),
    };

    const json = throughFile(toJsonResume(emptyResume(), meta));

    // `null` is the default, so coercing it to undefined — or dropping the
    // settings over it — would break the common case rather than an edge one.
    expect(json.meta['resume-builder'].settings.accentId).toBeNull();
    expect(readResumeDocumentMeta(json).settings?.accentId).toBeNull();
  });

  it('leaves the document meta out of the imported Resume', () => {
    const json = throughFile(
      toJsonResume(emptyResume(), { name: 'Named', settings: realSettings() })
    );
    const back = fromJsonResume(json);

    expect(back).not.toHaveProperty('name');
    expect(back).not.toHaveProperty('settings');
  });
});

describe('readResumeDocumentMeta (document name + PDF settings)', () => {
  it('trims the stored name', () => {
    const meta = readResumeDocumentMeta(withAppMeta({ name: '  Spaced  ' }));

    expect(meta).toEqual({ name: 'Spaced' });
  });

  it('treats a missing accentId as "Auto" (null)', () => {
    const meta = readResumeDocumentMeta(
      withAppMeta({ settings: { templateId: 'duo', marginId: 'normal' } })
    );

    expect(meta.settings).toEqual({
      templateId: 'duo',
      accentId: null,
      marginId: 'normal',
    });
  });

  it('keeps a usable name when the settings block is not usable', () => {
    const meta = readResumeDocumentMeta(
      withAppMeta({ name: 'Keep me', settings: { templateId: 'retired-2019' } })
    );

    expect(meta).toEqual({ name: 'Keep me' });
  });

  it('never throws on a document fromJsonResume would reject', () => {
    expect(readResumeDocumentMeta({ meta: { 'resume-builder': 42 } })).toEqual(
      {}
    );
  });

  it.each([
    ['a JSON Resume file with no meta at all', { basics: { name: 'Ada' } }],
    ['meta without the app namespace', { meta: { canonical: 'x' } }],
    ['a non-object namespace', withAppMeta('duo')],
    ['a blank name', withAppMeta({ name: '   ' })],
    ['a non-string name', withAppMeta({ name: 42 })],
    [
      'a template id no longer in the registry',
      withAppMeta({
        settings: realSettings({ templateId: 'sidebar-classic' }),
      }),
    ],
    [
      'a margin id no longer in the registry',
      withAppMeta({ settings: realSettings({ marginId: 'gigantic' }) }),
    ],
    [
      'an accent id no longer in the registry',
      withAppMeta({ settings: realSettings({ accentId: 'neon' }) }),
    ],
    [
      'settings missing marginId',
      withAppMeta({ settings: { templateId: 'duo', accentId: null } }),
    ],
    [
      'settings missing templateId',
      withAppMeta({ settings: { accentId: null, marginId: 'normal' } }),
    ],
    [
      'a non-string accentId',
      withAppMeta({
        settings: { templateId: 'duo', accentId: 7, marginId: 'normal' },
      }),
    ],
    ['a non-object settings block', withAppMeta({ settings: 'duo' })],
    ['null', null],
    ['a string', 'not a resume'],
    ['an array', []],
  ])('returns {} for %s', (_label, input) => {
    expect(readResumeDocumentMeta(input)).toEqual({});
  });
});
