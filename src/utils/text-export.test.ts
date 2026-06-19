import { describe, expect, it } from 'vitest';

import { emptyResume } from '../mocks/empty-resume';
import {
  Education,
  Project,
  SectionTypes,
  Skill,
  Work,
} from '../types/resume.model';

import { generateAtsCompliantText } from './text-export';

// Dates are constructed from local components (not ISO strings) so the
// formatted month/year is stable regardless of the test runner's timezone.
const workEntry = (overrides: Partial<Work> = {}): Work => ({
  name: 'Acme',
  position: 'Engineer',
  url: '',
  startDate: new Date(2020, 0, 1),
  endDate: new Date(2022, 5, 1),
  isPresent: false,
  summary: 'Built things',
  highlights: [{ value: 'Shipped a feature' }],
  ...overrides,
});

const skillEntry = (overrides: Partial<Skill> = {}): Skill => ({
  name: 'Languages',
  level: '',
  keywords: [{ value: 'TypeScript' }, { value: 'Go' }],
  ...overrides,
});

const educationEntry = (overrides: Partial<Education> = {}): Education => ({
  institution: 'State University',
  url: '',
  area: 'Computer Science',
  studyType: 'BS',
  startDate: new Date(2014, 8, 1),
  endDate: new Date(2018, 4, 1),
  score: '',
  courses: [],
  ...overrides,
});

const projectEntry = (overrides: Partial<Project> = {}): Project => ({
  name: 'Resume Builder',
  description: 'A client-side resume tool',
  highlights: ['Open source'],
  keywords: [],
  startDate: new Date(2021, 0, 1),
  endDate: new Date(2021, 11, 1),
  url: '',
  roles: [],
  entity: '',
  type: '',
  ...overrides,
});

describe('generateAtsCompliantText', () => {
  describe('header', () => {
    it('uppercases the name and joins label + contact info', () => {
      const resume = emptyResume();
      resume.basics = {
        ...resume.basics,
        name: 'Jane Doe',
        label: 'Software Engineer',
        email: 'jane@example.com',
        phone: '555-1234',
        url: 'janedoe.dev',
        summary: 'Builder of things.',
        location: { city: 'New York' },
      };

      const text = generateAtsCompliantText(resume);

      expect(text).toContain('JANE DOE');
      expect(text).toContain('Software Engineer');
      // City, phone, email, then a protocol-prefixed URL.
      expect(text).toContain(
        'New York | 555-1234 | jane@example.com | https://janedoe.dev'
      );
      expect(text).toContain('SUMMARY');
      expect(text).toContain('Builder of things.');
    });

    it('omits the summary section when there is no summary', () => {
      expect(generateAtsCompliantText(emptyResume())).not.toContain('SUMMARY');
    });
  });

  describe('sections', () => {
    it('formats skills as "name: keyword, keyword"', () => {
      const resume = { ...emptyResume(), skills: [skillEntry()] };

      const text = generateAtsCompliantText(resume);

      expect(text).toContain('SKILLS');
      expect(text).toContain('Languages: TypeScript, Go');
    });

    it('renders a current job with a "Present" end date', () => {
      const resume = { ...emptyResume(), work: [workEntry({ endDate: '' })] };

      const text = generateAtsCompliantText(resume);

      expect(text).toContain('WORK EXPERIENCE');
      expect(text).toContain('Acme | Engineer | Jan 2020 - Present');
      expect(text).toContain('Built things');
    });

    it('renders a date range for completed work', () => {
      const resume = { ...emptyResume(), work: [workEntry()] };

      expect(generateAtsCompliantText(resume)).toContain(
        'Acme | Engineer | Jan 2020 - Jun 2022'
      );
    });

    it('includes an education date range only when both dates are present', () => {
      const withDates = { ...emptyResume(), education: [educationEntry()] };
      expect(generateAtsCompliantText(withDates)).toContain(
        'State University | Computer Science | Sep 2014 - May 2018'
      );

      const withoutDates = {
        ...emptyResume(),
        education: [educationEntry({ startDate: '', endDate: '' })],
      };
      const text = generateAtsCompliantText(withoutDates);
      expect(text).toContain('State University | Computer Science');
      expect(text).not.toContain('State University | Computer Science |');
    });

    it('renders work highlights from { value } objects and project highlights from raw strings', () => {
      const resume = {
        ...emptyResume(),
        work: [workEntry({ highlights: [{ value: 'Work bullet' }] })],
        projects: [projectEntry({ highlights: ['Project bullet'] })],
      };

      const text = generateAtsCompliantText(resume);

      expect(text).toContain('• Work bullet');
      expect(text).toContain('• Project bullet');
    });
  });

  describe('visibility & ordering', () => {
    it('omits a section flagged hidden in sectionVisibility', () => {
      const resume = {
        ...emptyResume(),
        skills: [skillEntry()],
        sectionVisibility: { [SectionTypes.Skills]: true },
      };

      expect(generateAtsCompliantText(resume)).not.toContain('SKILLS');
    });

    it('omits empty sections entirely', () => {
      const text = generateAtsCompliantText(emptyResume());

      expect(text).not.toContain('SKILLS');
      expect(text).not.toContain('WORK EXPERIENCE');
      expect(text).not.toContain('EDUCATION');
      expect(text).not.toContain('PROJECTS');
    });

    it('honors a custom sectionOrder and appends the unlisted sections', () => {
      const resume = {
        ...emptyResume(),
        skills: [skillEntry()],
        work: [workEntry()],
        education: [educationEntry()],
        projects: [projectEntry()],
        sectionOrder: [SectionTypes.Projects, SectionTypes.Skills],
      };

      const text = generateAtsCompliantText(resume);

      expect(text.indexOf('PROJECTS')).toBeLessThan(text.indexOf('SKILLS'));
      expect(text.indexOf('SKILLS')).toBeLessThan(
        text.indexOf('WORK EXPERIENCE')
      );
      expect(text.indexOf('WORK EXPERIENCE')).toBeLessThan(
        text.indexOf('EDUCATION')
      );
    });
  });
});
