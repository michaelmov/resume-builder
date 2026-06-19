import { describe, expect, it } from 'vitest';

import { emptyResume } from '../../mocks/empty-resume';
import {
  Education,
  Project,
  SectionTypes,
  Skill,
  Work,
} from '../../types/resume.model';

import { ACTIONS, resumeReducer } from './ResumeReducer';

describe('resumeReducer', () => {
  it('replaces the whole resume on updateResume', () => {
    const replacement = emptyResume();
    replacement.basics.name = 'Replaced';

    const result = resumeReducer(emptyResume(), {
      type: ACTIONS.updateResume,
      payload: replacement,
    });

    expect(result).toBe(replacement);
  });

  it('updates basics while leaving other sections untouched', () => {
    const state = {
      ...emptyResume(),
      skills: [{ name: 'Lang', level: '', keywords: [] }],
    };

    const result = resumeReducer(state, {
      type: ACTIONS.updateBasics,
      payload: { ...state.basics, name: 'Jane' },
    });

    expect(result.basics.name).toBe('Jane');
    // Untouched sections keep their identity (no needless copies).
    expect(result.skills).toBe(state.skills);
  });

  it('does not mutate the previous state', () => {
    const state = emptyResume();

    resumeReducer(state, {
      type: ACTIONS.updateBasics,
      payload: { ...state.basics, name: 'Jane' },
    });

    expect(state.basics.name).toBe('');
  });

  it('updates the skills array', () => {
    const skills: Skill[] = [
      { name: 'Lang', level: '', keywords: [{ value: 'TS' }] },
    ];

    const result = resumeReducer(emptyResume(), {
      type: ACTIONS.updateSkills,
      payload: skills,
    });

    expect(result.skills).toBe(skills);
  });

  it('updates the work array', () => {
    const work: Work[] = [
      {
        name: 'Acme',
        position: 'Engineer',
        url: '',
        startDate: '',
        endDate: '',
        isPresent: false,
        summary: '',
        highlights: [],
      },
    ];

    const result = resumeReducer(emptyResume(), {
      type: ACTIONS.updateWork,
      payload: work,
    });

    expect(result.work).toBe(work);
  });

  it('updates the education array', () => {
    const education: Education[] = [
      {
        institution: 'Uni',
        url: '',
        area: 'CS',
        studyType: 'BS',
        startDate: '',
        endDate: '',
        score: '',
        courses: [],
      },
    ];

    const result = resumeReducer(emptyResume(), {
      type: ACTIONS.updateEducation,
      payload: education,
    });

    expect(result.education).toBe(education);
  });

  it('updates the projects array', () => {
    const projects: Project[] = [
      {
        name: 'P',
        description: '',
        highlights: [],
        keywords: [],
        startDate: '',
        endDate: '',
        url: '',
        roles: [],
        entity: '',
        type: '',
      },
    ];

    const result = resumeReducer(emptyResume(), {
      type: ACTIONS.updateProjects,
      payload: projects,
    });

    expect(result.projects).toBe(projects);
  });

  it('updates section visibility', () => {
    const visibility = { [SectionTypes.Skills]: true };

    const result = resumeReducer(emptyResume(), {
      type: ACTIONS.updateSectionVisibility,
      payload: visibility,
    });

    expect(result.sectionVisibility).toBe(visibility);
  });

  it('updates section order', () => {
    const order = [SectionTypes.Work, SectionTypes.Skills];

    const result = resumeReducer(emptyResume(), {
      type: ACTIONS.updateSectionOrder,
      payload: order,
    });

    expect(result.sectionOrder).toBe(order);
  });

  it('throws on an unknown action type', () => {
    expect(() =>
      resumeReducer(emptyResume(), {
        type: 'UNKNOWN_ACTION' as ACTIONS,
        payload: emptyResume(),
      })
    ).toThrow('No action provided');
  });
});
