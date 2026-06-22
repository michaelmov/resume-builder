import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ACTIVE_SECTIONS,
  resolveSectionOrder,
  SectionTypes,
} from './resume.model';

describe('resolveSectionOrder', () => {
  it('falls back to the default active set when given no order', () => {
    expect(resolveSectionOrder()).toEqual(DEFAULT_ACTIVE_SECTIONS);
  });

  it('treats an explicit empty array as "no sections active"', () => {
    expect(resolveSectionOrder([])).toEqual([]);
  });

  it('takes an explicit order as the active set (no appending)', () => {
    const order = [SectionTypes.Projects, SectionTypes.Skills];
    expect(resolveSectionOrder(order)).toEqual(order);
  });

  it('drops Basics, which is never reorderable', () => {
    expect(
      resolveSectionOrder([SectionTypes.Basics, SectionTypes.Work])
    ).toEqual([SectionTypes.Work]);
  });

  it('drops unknown/stale section values from a legacy save', () => {
    expect(
      resolveSectionOrder(['bogus' as SectionTypes, SectionTypes.Education])
    ).toEqual([SectionTypes.Education]);
  });

  it('de-duplicates repeated sections', () => {
    expect(
      resolveSectionOrder([
        SectionTypes.Work,
        SectionTypes.Work,
        SectionTypes.Skills,
      ])
    ).toEqual([SectionTypes.Work, SectionTypes.Skills]);
  });

  it('accepts the newly added section types', () => {
    const order = [
      SectionTypes.Volunteer,
      SectionTypes.Awards,
      SectionTypes.Certificates,
      SectionTypes.Publications,
      SectionTypes.Languages,
      SectionTypes.Interests,
      SectionTypes.References,
    ];
    expect(resolveSectionOrder(order)).toEqual(order);
  });
});
