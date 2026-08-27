import { GridItemProps, GridProps } from '@chakra-ui/react';

/**
 * Column template for the field grid inside a section — two columns, collapsing
 * to one below `sm`.
 *
 * On a 390px phone two columns leave ~166px per field once the pane's inset and
 * the entry card's come off. That is enough for "Fellow" and not much else: a
 * date plus its calendar button, or a real email address, doesn't fit. One
 * column hands the whole ~340px to each field.
 *
 * The cost is height — a form roughly doubles inside a sheet that only opens to
 * 55–88% of the viewport — which is why this stops at `sm` (480px) rather than
 * following the `md` breakpoint the sheet layout itself switches on. Between
 * 480px and 768px two columns are still wide enough to be worth keeping.
 */
export const FIELD_GRID_COLUMNS: GridProps['templateColumns'] = {
  base: '1fr',
  sm: 'repeat(2, 1fr)',
};

/**
 * `colSpan` for a field that takes the whole row (summaries, bullet lists).
 *
 * It has to drop back to 1 wherever the grid is one column. A `span 2` in a
 * single-column grid doesn't clamp — CSS grid adds an implicit second track to
 * satisfy it, so the full-width fields would end up sharing the row with a
 * column nothing else uses, and every other field would shrink to make room.
 */
export const FIELD_GRID_FULL_SPAN: GridItemProps['colSpan'] = {
  base: 1,
  sm: 2,
};
