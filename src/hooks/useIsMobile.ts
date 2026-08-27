import { useEffect, useState } from 'react';

// Chakra's `md` breakpoint is 48em; anything below it gets the single-column
// phone layout. Expressed as a media query rather than read from the theme
// because this has to be answerable synchronously, before first paint.
const MOBILE_QUERY = '(max-width: 47.9975em)';

/**
 * True while the viewport is narrower than Chakra's `md` breakpoint.
 *
 * Deliberately not `useBreakpointValue`, which returns `undefined` on the first
 * render and resolves on the second. That flash is harmless for styling but not
 * here: the editor lives in a bottom sheet on mobile and as a flex sibling on
 * desktop, so a wrong first answer mounts every form in one tree and then
 * immediately remounts it in the other — which, with debounced auto-save, is
 * exactly how uncommitted edits get dropped. Reading `matchMedia` during the
 * initial state means the first mount is already in the right place.
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const handleChange = (event: MediaQueryListEvent) =>
      setIsMobile(event.matches);

    // Re-read on mount as well as on change: the viewport can have crossed the
    // breakpoint between the initial state and this effect running.
    setIsMobile(query.matches);
    query.addEventListener('change', handleChange);

    return () => query.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
};
