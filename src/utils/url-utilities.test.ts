import { describe, expect, it } from 'vitest';

import { ensureProtocol } from './url-utilities';

describe('ensureProtocol', () => {
  it('prepends https:// to a bare host', () => {
    expect(ensureProtocol('michaelmov.dev')).toBe('https://michaelmov.dev');
  });

  it('prepends https:// to a host with a path', () => {
    expect(ensureProtocol('sub.example.co.uk/path')).toBe(
      'https://sub.example.co.uk/path'
    );
  });

  it('prepends https:// to host:port without a scheme', () => {
    expect(ensureProtocol('localhost:3000')).toBe('https://localhost:3000');
  });

  it('leaves an existing http(s) URL untouched', () => {
    expect(ensureProtocol('https://example.com')).toBe('https://example.com');
    expect(ensureProtocol('http://example.com')).toBe('http://example.com');
  });

  it('leaves any scheme:// URL untouched (e.g. ftp)', () => {
    expect(ensureProtocol('ftp://host')).toBe('ftp://host');
  });

  it('treats the scheme case-insensitively', () => {
    expect(ensureProtocol('HTTPS://EXAMPLE.COM')).toBe('HTTPS://EXAMPLE.COM');
  });

  it('returns undefined / empty values unchanged', () => {
    expect(ensureProtocol(undefined)).toBeUndefined();
    expect(ensureProtocol('')).toBe('');
  });

  // CHARACTERIZATION TEST — documents current (arguably buggy) behavior.
  // The doc comment on ensureProtocol claims "mailto:..." is left untouched,
  // but the guard regex requires "scheme://", which "mailto:" lacks. So a
  // mailto value is incorrectly prefixed. If the function is fixed to honor a
  // bare "scheme:" prefix, update this expectation to 'mailto:me@example.com'.
  it('(known issue) incorrectly prefixes a mailto: value', () => {
    expect(ensureProtocol('mailto:me@example.com')).toBe(
      'https://mailto:me@example.com'
    );
  });
});
