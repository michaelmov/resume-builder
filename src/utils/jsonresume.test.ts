import { describe, expect, it } from 'vitest';

import { resumeMock } from '../mocks/resume.mock';
import { Resume, Work } from '../types/resume.model';

import { fromJsonResume, toJsonResume } from './jsonresume';

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

  it('keeps projects/interests keywords as plain strings', () => {
    const resume = emptyResume();
    resume.interests = [{ name: 'Wildlife', keywords: ['Ferrets'] }];

    expect(toJsonResume(resume).interests?.[0].keywords).toEqual(['Ferrets']);
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
      location: undefined,
      profiles: undefined,
    });
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
    expect(back.projects[0].highlights).toEqual(resumeMock.projects[0].highlights);
    expect(back.sectionVisibility).toEqual(resumeMock.sectionVisibility);
  });

  it('round-trips a present role (isPresent → omit endDate → isPresent)', () => {
    const resume = emptyResume();
    resume.work = [workEntry({ isPresent: true })];

    const json = JSON.parse(JSON.stringify(toJsonResume(resume)));
    const back = fromJsonResume(json);

    expect(back.work[0].isPresent).toBe(true);
    expect(back.work[0].endDate).toBe('');
  });
});
