import { useCallback, useEffect, useRef } from 'react';
import {
  FieldValues,
  UseFormGetValues,
  UseFormReset,
  UseFormWatch,
} from 'react-hook-form';

/** How long after the last keystroke a section's edits are committed. */
const AUTO_COMMIT_DEBOUNCE_MS = 400;

interface AutoCommitOptions<TForm extends FieldValues, TValue> {
  watch: UseFormWatch<TForm>;
  reset: UseFormReset<TForm>;
  getValues: UseFormGetValues<TForm>;
  /**
   * The section's committed value from the store. Its reference only changes on
   * an external update (JSON import, undo) or the echo of this section's own
   * commit — the reducer stores the exact reference we hand it.
   */
  value: TValue;
  /** Map the committed value into the form's shape (used when re-seeding). */
  toFormValues: (value: TValue) => TForm;
  /** Extract the value to persist back out of the live form values. */
  fromFormValues: (formValues: TForm) => TValue;
  /** Persist the value to the store (e.g. `onUpdate(SectionTypes.Work, value)`). */
  commit: (value: TValue) => void;
  debounceMs?: number;
}

/**
 * Auto-save a section's react-hook-form: edits are committed to the store a beat
 * after typing stops (or immediately on blur), so the PDF preview stays live
 * without a manual "Save" step.
 *
 * The tricky part is the round-trip: committing changes the store, which flows
 * back in as a new `value`, which would normally re-seed the form and clobber
 * whatever the user is currently typing. We avoid that by tracking the exact
 * value reference we last synced with the store (`syncedValueRef`). Because the
 * reducer stores the reference we pass it verbatim, the echo of our own commit
 * arrives as `value === syncedValueRef` and is ignored; only a genuinely
 * external change (a fresh reference from a JSON import or undo) re-seeds.
 *
 * Returns an `onBlur` handler to wire onto the section container so leaving a
 * field flushes any pending edit right away.
 */
export function useAutoCommitSection<TForm extends FieldValues, TValue>({
  watch,
  reset,
  getValues,
  value,
  toFormValues,
  fromFormValues,
  commit,
  debounceMs = AUTO_COMMIT_DEBOUNCE_MS,
}: AutoCommitOptions<TForm, TValue>): { onBlur: () => void } {
  // Hold the latest mappers/committer in refs so the watch subscription and the
  // re-seed effect never need to resubscribe and never capture stale closures.
  const toFormValuesRef = useRef(toFormValues);
  const fromFormValuesRef = useRef(fromFormValues);
  const commitRef = useRef(commit);
  toFormValuesRef.current = toFormValues;
  fromFormValuesRef.current = fromFormValues;
  commitRef.current = commit;

  const syncedValueRef = useRef<TValue>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitNow = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const next = fromFormValuesRef.current(getValues());
    syncedValueRef.current = next;
    commitRef.current(next);
  }, [getValues]);

  // Schedule a commit a beat after each change.
  useEffect(() => {
    const subscription = watch(() => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(commitNow, debounceMs);
    });
    return () => subscription.unsubscribe();
  }, [watch, commitNow, debounceMs]);

  // Flush a pending edit on unmount (e.g. the section is collapsed or removed)
  // so the last keystroke isn't dropped. `commitNow` is stable, so this only
  // runs on a real unmount.
  useEffect(
    () => () => {
      if (timerRef.current != null) {
        commitNow();
      }
    },
    [commitNow]
  );

  // Re-seed the form only when the committed value changes externally, never for
  // the echo of our own commit (which would clobber in-flight keystrokes).
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      syncedValueRef.current = value;
      return; // defaultValues already seeded the form at mount
    }
    if (value === syncedValueRef.current) {
      return;
    }
    syncedValueRef.current = value;
    reset(toFormValuesRef.current(value));
  }, [value, reset]);

  // Only commit on blur when there's a pending edit, so tabbing across
  // untouched fields doesn't trigger needless re-renders.
  const onBlur = useCallback(() => {
    if (timerRef.current != null) {
      commitNow();
    }
  }, [commitNow]);

  return { onBlur };
}
