import { DatePicker, Field, Portal } from '@chakra-ui/react';
import { parseDate } from '@internationalized/date';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { HiOutlineCalendar } from 'react-icons/hi';

interface DateFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Extract the `YYYY-MM-DD` portion of a stored date (string or legacy `Date`)
 * and, when valid, wrap it as the `DateValue[]` the DatePicker expects. Empty or
 * unparseable values yield `[]` (no selection).
 */
const toDateValue = (raw: unknown) => {
  let iso = '';
  if (raw instanceof Date) {
    iso = Number.isNaN(raw.getTime()) ? '' : raw.toISOString().slice(0, 10);
  } else if (typeof raw === 'string') {
    iso = raw.trim().slice(0, 10);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return [];

  try {
    return [parseDate(iso)];
  } catch {
    return [];
  }
};

/**
 * A Chakra DatePicker wired to react-hook-form via `Controller`. The form value
 * stays a `YYYY-MM-DD` string (matching the JSON Resume schema and the rest of
 * the app), so this is a drop-in replacement for the old `<Input type="date">`
 * fields — templates, export, and import are unaffected. Clearing stores `''`.
 */
export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  id,
  disabled,
}: DateFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field.Root id={id} disabled={disabled}>
          <Field.Label>{label}</Field.Label>
          <DatePicker.Root
            width="full"
            colorPalette="brand"
            disabled={disabled}
            value={toDateValue(field.value)}
            onValueChange={(details) =>
              // `value[0]` is a CalendarDate whose `toString()` is always ISO
              // `YYYY-MM-DD`; `valueAsString` is locale-formatted (e.g.
              // MM/DD/YYYY) and would not round-trip through `toDateValue`.
              field.onChange(details.value[0]?.toString() ?? '')
            }
          >
            <DatePicker.Control>
              <DatePicker.Input onBlur={field.onBlur} />
              <DatePicker.IndicatorGroup>
                <DatePicker.Trigger>
                  <HiOutlineCalendar />
                </DatePicker.Trigger>
              </DatePicker.IndicatorGroup>
            </DatePicker.Control>
            <Portal>
              {/*
                The calendar is portaled to `document.body`, i.e. outside the
                `DatePicker.Root` node where `colorPalette="brand"` sets its CSS
                vars — so the palette must be reapplied here or the selected day
                falls back to the default gray (renders near-black).
              */}
              <DatePicker.Positioner colorPalette="brand">
                <DatePicker.Content>
                  <DatePicker.View view="day">
                    <DatePicker.Header />
                    <DatePicker.DayTable />
                  </DatePicker.View>
                  <DatePicker.View view="month">
                    <DatePicker.Header />
                    <DatePicker.MonthTable />
                  </DatePicker.View>
                  <DatePicker.View view="year">
                    <DatePicker.Header />
                    <DatePicker.YearTable />
                  </DatePicker.View>
                </DatePicker.Content>
              </DatePicker.Positioner>
            </Portal>
          </DatePicker.Root>
        </Field.Root>
      )}
    />
  );
}
