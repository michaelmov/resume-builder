import { describe, expect, it } from 'vitest';

import { accents, DEFAULT_ACCENT_ID, getAccent } from './accents';

describe('getAccent', () => {
  it('returns the palette matching the given id', () => {
    const sage = getAccent('sage');
    expect(sage.id).toBe('sage');
    expect(sage.name).toBe('Sage');
  });

  it('falls back to the first accent for an unknown id', () => {
    expect(getAccent('does-not-exist')).toBe(accents[0]);
  });

  it('falls back to the first accent for null (the "Auto" selection)', () => {
    expect(getAccent(null)).toBe(accents[0]);
  });

  it('falls back to the first accent for undefined', () => {
    expect(getAccent(undefined)).toBe(accents[0]);
  });
});

describe('accents palette', () => {
  it('uses the first accent as the default id', () => {
    expect(DEFAULT_ACCENT_ID).toBe(accents[0].id);
  });

  it('has unique ids (templates reference accents by id)', () => {
    const ids = accents.map((accent) => accent.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
