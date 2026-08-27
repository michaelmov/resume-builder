import { Box } from '@chakra-ui/react';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Sheet, SheetRef } from 'react-modal-sheet';

import { Editor } from './Editor';

/**
 * Fractions of the sheet's height it can rest at, in the *ascending* order the
 * library requires (it asserts on anything else). 0 is fully closed, 1 is the
 * full viewport.
 *
 * The largest stop stays under 1 so the app bar and the preview's own header
 * remain reachable while editing. The smallest is a *peek*, deliberately above
 * zero: `react-modal-sheet` renders `{state !== 'closed' ? children : null}`,
 * so a sheet that actually closes unmounts the editor — and with auto-save on
 * a debounce, unmounting is how uncommitted edits get lost.
 */
const SNAP_POINTS = [0.16, 0.55, 0.88];

/**
 * Runtime snap indices, which are **not** indices into `SNAP_POINTS`.
 *
 * The library brackets the array with its own fully-closed and fully-open
 * stops, so what it actually snaps against is `[0, ...SNAP_POINTS, 1]` and
 * every index shifts by one. Passing an un-shifted index is silent — it just
 * lands on the neighbouring stop.
 *
 * Index 0 is a genuine closed state, and closing unmounts the editor. Two
 * separate things keep it out of reach, because `disableDismiss` only covers
 * one of them: it makes the library redirect any *drag* that would land closed
 * to the first stop with a non-zero height, and suppresses that path's
 * `onClose`. It does not guard `snapTo(0)`, which calls `onClose` outright —
 * so nothing here may ever pass index 0 to `snapTo`.
 */
const CLOSED_INDEX = 0;
const PEEK_INDEX = CLOSED_INDEX + 1;
const MID_INDEX = PEEK_INDEX + 1;

// The library's open animation is a 200ms tween. If it hasn't reported in well
// past that, it isn't going to (see `settleToMid`), so position the sheet
// regardless.
const OPEN_SETTLE_FALLBACK_MS = 700;

/** The peek height as a CSS length, for laying out around the fixed sheet. */
export const SHEET_PEEK_INSET = `${SNAP_POINTS[0] * 100}dvh`;

export const MobileEditorSheet: FC = () => {
  const sheetRef = useRef<SheetRef>(null);
  const [snapIndex, setSnapIndex] = useState(MID_INDEX);

  // A vertical drag is ambiguous while a section is being reordered — dnd-kit
  // and the sheet would both claim it. dnd-kit wins: the sheet stands down for
  // the duration rather than sliding away under the section being moved.
  const [isDraggingSection, setIsDraggingSection] = useState(false);

  /**
   * Take the opening position by hand rather than through `initialSnap`.
   *
   * `initialSnap` is resolved inside the library's `onOpen`, which fires on the
   * closed→open transition. This sheet mounts already open, so that runs before
   * the container has been measured: every snap offset is computed from a
   * height of 0 and collapses to "fully open", whatever index was passed.
   *
   * The position is written straight to the motion value instead of going
   * through `snapTo` alone, because `snapTo` animates and animation is driven
   * by rAF — which a tab that isn't on screen pauses indefinitely. Setting the
   * value lands the sheet correctly whether or not anything is animating; the
   * `snapTo` after it is what brings the library's own `currentSnap` into
   * agreement, and is a no-op movement since the sheet is already there.
   *
   * Returns whether it could act: before the container has been measured every
   * offset is still 0, and writing that would land the sheet fully open.
   */
  const settleToMid = useCallback(() => {
    const sheet = sheetRef.current;
    if (!sheet || sheet.height <= 0) return false;

    const target = sheet.snapPoints[MID_INDEX];
    if (!target) return false;

    sheet.y.set(target.snapValueY);
    void sheet.snapTo(MID_INDEX);
    return true;
  }, []);

  // `onOpenEnd` is the tidy trigger — it fires once the library's own open
  // animation has settled, so nothing overwrites the position afterwards. But
  // it is awaiting that same paused-in-a-background-tab animation, so it can
  // never arrive; this settles anyway once it clearly hasn't.
  useEffect(() => {
    const handle = setTimeout(settleToMid, OPEN_SETTLE_FALLBACK_MS);
    return () => clearTimeout(handle);
  }, [settleToMid]);

  const isPeeking = snapIndex <= PEEK_INDEX;

  // Only ever expands. Making the header a two-way toggle would fight the drag
  // gesture it shares a hit area with — a drag that ends where it started
  // still emits a click, and collapsing on that would feel like a glitch.
  const handleHeaderClick = useCallback(() => {
    if (isPeeking) sheetRef.current?.snapTo(MID_INDEX);
  }, [isPeeking]);

  return (
    <Sheet
      ref={sheetRef}
      isOpen
      // Required by the API, but unreachable: `disableDismiss` plus a non-zero
      // lowest snap point means there is no gesture that closes this sheet.
      onClose={() => {}}
      snapPoints={SNAP_POINTS}
      disableDismiss
      // The preview underneath is its own scroll container and the body never
      // scrolls, so the usual scroll lock would only freeze the preview.
      disableScrollLocking
      onSnap={setSnapIndex}
      onOpenEnd={settleToMid}
      style={{ zIndex: 1000 }}
    >
      <Sheet.Container
        style={{
          // Inline styles can't take Chakra tokens, but the emitted CSS
          // variables carry the same light/dark switching.
          background: 'var(--chakra-colors-bg-subtle)',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        <Sheet.Header disableDrag={isDraggingSection}>
          <Box
            onClick={handleHeaderClick}
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="28px"
            borderTopRadius="16px"
            // The grip is small; the whole strip is the target.
            cursor={isPeeking ? 'pointer' : 'grab'}
            aria-label={isPeeking ? 'Expand the editor' : undefined}
          >
            <Box
              width="36px"
              height="4px"
              borderRadius="full"
              bg="border.emphasized"
            />
          </Box>
        </Sheet.Header>
        <Sheet.Content disableDrag={isDraggingSection}>
          <Editor onSectionDraggingChange={setIsDraggingSection} />
        </Sheet.Content>
      </Sheet.Container>
    </Sheet>
  );
};
