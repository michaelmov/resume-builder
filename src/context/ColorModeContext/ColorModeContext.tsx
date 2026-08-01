import React, {
  createContext,
  FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ColorMode,
  ColorModePreference,
  useColorModeLocalStorage,
} from '../../hooks/useColorModeLocalStorage';

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

interface ColorModeContextValue {
  /** The rendered mode — `preference` with `system` already resolved. */
  colorMode: ColorMode;
  preference: ColorModePreference;
  setPreference: (preference: ColorModePreference) => void;
  /** Pin the opposite of whatever is on screen (what the navbar toggle does). */
  toggleColorMode: () => void;
}

const getSystemColorMode = (): ColorMode =>
  window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light';

const colorModeContext = createContext<ColorModeContextValue | undefined>(
  undefined
);

/**
 * Owns the light/dark choice and mirrors it onto `<html>` as the `dark`/`light`
 * class that Chakra's `_dark`/`_light` conditions key off of (`.dark &`), plus
 * the native `color-scheme` so scrollbars and form controls follow.
 *
 * Only the app chrome changes — the resume templates are `@react-pdf/renderer`
 * documents whose colors are baked into the PDF, so they are unaffected.
 */
const ColorModeProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getColorModePreference, saveColorModePreference } =
    useColorModeLocalStorage();

  const [preference, setPreferenceState] = useState<ColorModePreference>(
    () => getColorModePreference() ?? 'system'
  );
  const [systemColorMode, setSystemColorMode] =
    useState<ColorMode>(getSystemColorMode);

  // Track the OS setting even while an explicit preference is pinned, so
  // switching back to `system` (or loading with no saved choice) is instant.
  useEffect(() => {
    const query = window.matchMedia(DARK_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) =>
      setSystemColorMode(event.matches ? 'dark' : 'light');

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const colorMode = preference === 'system' ? systemColorMode : preference;

  // Idempotent: `index.html` already applied the same class before first paint.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', colorMode === 'dark');
    root.classList.toggle('light', colorMode === 'light');
    root.style.colorScheme = colorMode;
  }, [colorMode]);

  const setPreference = useCallback(
    (next: ColorModePreference) => {
      setPreferenceState(next);
      saveColorModePreference(next);
    },
    // `saveColorModePreference` is re-created every render by the storage hook;
    // it closes over nothing, so pinning the identity here keeps this callback
    // (and every consumer memoized on it) stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const toggleColorMode = useCallback(
    () => setPreference(colorMode === 'dark' ? 'light' : 'dark'),
    [colorMode, setPreference]
  );

  const value = useMemo(
    () => ({ colorMode, preference, setPreference, toggleColorMode }),
    [colorMode, preference, setPreference, toggleColorMode]
  );

  return (
    <colorModeContext.Provider value={value}>
      {children}
    </colorModeContext.Provider>
  );
};

export { colorModeContext, ColorModeProvider };
