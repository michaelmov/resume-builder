import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS, resolveSettings } from './resume-settings';

describe('resolveSettings', () => {
  it('keeps ids that still exist', () => {
    expect(
      resolveSettings({
        templateId: 'folio',
        accentId: 'blush',
        marginId: 'wide',
      })
    ).toEqual({ templateId: 'folio', accentId: 'blush', marginId: 'wide' });
  });

  it('falls back when a template or margin has been retired', () => {
    expect(
      resolveSettings({
        templateId: 'gone',
        accentId: 'gone',
        marginId: 'gone',
      })
    ).toEqual(DEFAULT_SETTINGS);
  });

  it('treats a missing accent as Auto rather than a default color', () => {
    expect(resolveSettings({ templateId: 'duo' }).accentId).toBeNull();
    expect(resolveSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it('survives junk where a settings object was expected', () => {
    expect(resolveSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(resolveSettings('not settings')).toEqual(DEFAULT_SETTINGS);
  });
});
