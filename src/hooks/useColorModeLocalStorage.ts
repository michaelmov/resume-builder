/** The mode the UI actually renders in. */
export type ColorMode = 'light' | 'dark';

/**
 * What the user asked for. `system` is the default — it follows the OS setting
 * and keeps following it, so the app flips with the machine at sunset. Once the
 * navbar toggle is used the choice becomes explicit and pinned.
 */
export type ColorModePreference = ColorMode | 'system';

/**
 * NOTE: kept in sync with the inline bootstrap script in `index.html`, which
 * reads the same key to set the `dark`/`light` class before first paint (React
 * mounts too late to prevent a flash of the wrong theme).
 */
const COLOR_MODE_KEY = 'color-mode';

const isPreference = (value: string | null): value is ColorModePreference =>
  value === 'light' || value === 'dark' || value === 'system';

export const useColorModeLocalStorage = () => {
  const getColorModePreference = (): ColorModePreference | undefined => {
    const stored = window.localStorage.getItem(COLOR_MODE_KEY);
    return isPreference(stored) ? stored : undefined;
  };

  const saveColorModePreference = (preference: ColorModePreference): void => {
    window.localStorage.setItem(COLOR_MODE_KEY, preference);
  };

  return {
    getColorModePreference,
    saveColorModePreference,
  };
};
