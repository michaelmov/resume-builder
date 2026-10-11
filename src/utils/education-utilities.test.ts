import { describe, expect, it } from 'vitest';

import { formatScore } from './education-utilities';

describe('formatScore', () => {
  it('labels a bare grade point', () => {
    expect(formatScore('3.8')).toBe('GPA 3.8');
    expect(formatScore(' 3.8/4.0 ')).toBe('GPA 3.8/4.0');
    expect(formatScore('4')).toBe('GPA 4');
  });

  it('leaves a score that already reads on its own', () => {
    expect(formatScore('GPA: 3.8')).toBe('GPA: 3.8');
    expect(formatScore('First Class Honours')).toBe('First Class Honours');
    expect(formatScore('85%')).toBe('85%');
  });

  it('returns an empty string when there is no score', () => {
    expect(formatScore('')).toBe('');
    expect(formatScore('   ')).toBe('');
    expect(formatScore(undefined)).toBe('');
  });
});
