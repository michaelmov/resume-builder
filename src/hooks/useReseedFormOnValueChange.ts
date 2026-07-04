import { useEffect, useRef } from 'react';
import { FieldValues, UseFormReset } from 'react-hook-form';

/**
 * Re-seed a section's react-hook-form whenever its committed `value` changes
 * externally — e.g. a JSON import replaces the whole resume. Section forms read
 * `defaultValues` only at mount, so without this the editor keeps showing stale
 * data until the component remounts (a full page refresh).
 *
 * `value` is a stable reference from the reducer state and only changes when
 * this section's committed data changes (a JSON import, or the section's own
 * "Save All"), so re-seeding here never clobbers in-progress edits — those stay
 * staged inside the form and don't touch the committed value.
 *
 * @param reset        the form's `reset` from `useForm`
 * @param value        the committed section value; the effect's only trigger
 * @param toFormValues maps `value` into the form's shape (e.g. `{ work }`)
 */
export function useReseedFormOnValueChange<TValue, TForm extends FieldValues>(
  reset: UseFormReset<TForm>,
  value: TValue,
  toFormValues: (value: TValue) => TForm
) {
  // Hold the latest mapper in a ref so it doesn't need to be an effect
  // dependency: the effect must fire on `value` changes only, never on every
  // render (the mapper is a fresh closure each render, and re-seeding on a
  // plain re-render would discard the user's staged edits).
  const toFormValuesRef = useRef(toFormValues);
  toFormValuesRef.current = toFormValues;

  useEffect(() => {
    reset(toFormValuesRef.current(value));
  }, [value, reset]);
}
