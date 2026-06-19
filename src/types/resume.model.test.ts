import { describe, expect, it } from 'vitest';

import {
  REORDERABLE_SECTIONS,
  resolveSectionOrder,
  SectionTypes,
} from './resume.model';

describe('resolveSectionOrder', () => {
  it('returns the default order when given no saved order', () => {
    expect(resolveSectionOrder()).toEqual(REORDERABLE_SECTIONS);
  });

  it('returns the default order when given an empty array', () => {
    expect(resolveSectionOrder([])).toEqual(REORDERABLE_SECTIONS);
  });

  it('preserves a complete saved order', () => {
    const order = [
      SectionTypes.Projects,
      SectionTypes.Education,
      SectionTypes.Work,
      SectionTypes.Skills,
    ];
    expect(resolveSectionOrder(order)).toEqual(order);
  });

  it('appends missing sections in their default order after the saved ones', () => {
    expect(resolveSectionOrder([SectionTypes.Work])).toEqual([
      SectionTypes.Work,
      SectionTypes.Skills,
      SectionTypes.Education,
      SectionTypes.Projects,
    ]);
  });

  it('drops sections that are not reorderable (e.g. Basics)', () => {
    expect(
      resolveSectionOrder([SectionTypes.Basics, SectionTypes.Work])
    ).toEqual([
      SectionTypes.Work,
      SectionTypes.Skills,
      SectionTypes.Education,
      SectionTypes.Projects,
    ]);
  });

  it('drops unknown/stale section values from a legacy save', () => {
    expect(
      resolveSectionOrder(['bogus' as SectionTypes, SectionTypes.Education])
    ).toEqual([
      SectionTypes.Education,
      SectionTypes.Skills,
      SectionTypes.Work,
      SectionTypes.Projects,
    ]);
  });

  it('de-duplicates repeated sections', () => {
    expect(
      resolveSectionOrder([
        SectionTypes.Work,
        SectionTypes.Work,
        SectionTypes.Skills,
      ])
    ).toEqual([
      SectionTypes.Work,
      SectionTypes.Skills,
      SectionTypes.Education,
      SectionTypes.Projects,
    ]);
  });

  it('always returns every reorderable section exactly once', () => {
    const resolved = resolveSectionOrder([SectionTypes.Projects]);
    expect([...resolved].sort()).toEqual([...REORDERABLE_SECTIONS].sort());
    expect(resolved).toHaveLength(REORDERABLE_SECTIONS.length);
  });
});
