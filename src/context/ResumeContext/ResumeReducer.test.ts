import { describe, expect, it } from 'vitest';

import { emptyResume } from '../../mocks/empty-resume';
import { SectionTypes, Skill, Work } from '../../types/resume.model';

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

  it('updates a single section while leaving the others untouched', () => {
    const state = {
      ...emptyResume(),
      skills: [{ name: 'Lang', level: '', keywords: [] }],
    };
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

    const result = resumeReducer(state, {
      type: ACTIONS.updateSection,
      payload: { section: SectionTypes.Work, data: work },
    });

    expect(result.work).toBe(work);
    // Untouched sections keep their identity (no needless copies).
    expect(result.skills).toBe(state.skills);
  });

  it('updates the basics object via updateSection', () => {
    const state = emptyResume();
    const basics = { ...state.basics, name: 'Jane' };

    const result = resumeReducer(state, {
      type: ACTIONS.updateSection,
      payload: { section: SectionTypes.Basics, data: basics },
    });

    expect(result.basics.name).toBe('Jane');
  });

  it('does not mutate the previous state', () => {
    const state = emptyResume();
    const skills: Skill[] = [{ name: 'Lang', level: '', keywords: [] }];

    resumeReducer(state, {
      type: ACTIONS.updateSection,
      payload: { section: SectionTypes.Skills, data: skills },
    });

    expect(state.skills).toEqual([]);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: 'UNKNOWN_ACTION' as any,
        payload: emptyResume(),
      })
    ).toThrow('No action provided');
  });
});
