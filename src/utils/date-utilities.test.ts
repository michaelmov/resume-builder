import { describe, expect, it } from 'vitest';

import { formatDate } from './date-utilities';

describe('formatDate', () => {
  it('formats a valid Date as short month + year by default', () => {
    // Constructed from local components so the result is timezone-stable.
    expect(formatDate(new Date(2020, 0, 15))).toBe('Jan 2020');
  });

  it('honors custom Intl.DateTimeFormat options', () => {
    expect(
      formatDate(new Date(2020, 0, 15), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    ).toBe('January 15, 2020');
  });

  it('returns "Invalid Date" for an invalid Date object', () => {
    expect(formatDate(new Date('not-a-date'))).toBe('Invalid Date');
  });

  it('returns the original string for an unparseable date string', () => {
    expect(formatDate('Q1 2020')).toBe('Q1 2020');
  });

  it('returns an empty string for an empty string', () => {
    expect(formatDate('')).toBe('');
  });
});
