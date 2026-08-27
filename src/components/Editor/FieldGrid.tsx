import { Grid, GridItem, GridItemProps, GridProps } from '@chakra-ui/react';
import { FC } from 'react';

/**
 * The grid a section's form fields are laid out on — two columns, collapsing to
 * one below `sm`.
 *
 * On a 390px phone two columns leave ~166px per field once the editor pane's
 * inset and the entry card's come off. That is enough for "Fellow" and not much
 * else: a date plus its calendar button, or a real email address, doesn't fit.
 * One column hands the whole ~340px to each field.
 *
 * The cost is height — a form roughly doubles inside a sheet that only opens to
 * 55–88% of the viewport — which is why this stops at `sm` (480px) rather than
 * following the `md` breakpoint the sheet layout itself switches on. Between
 * 480px and 768px two columns are still wide enough to be worth keeping.
 */
export const FieldGrid: FC<GridProps> = ({ children, ...rest }) => (
  <Grid
    templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }}
    rowGap={4}
    columnGap={2}
    {...rest}
  >
    {children}
  </Grid>
);

/**
 * `colSpan` is deliberately not forwardable. A full-row field has to go back to
 * spanning one column wherever the grid is one column, and `span 2` does not
 * clamp to the available tracks: CSS grid adds an implicit second track to
 * satisfy it, so the wide fields would end up on a column nothing else uses and
 * every other field would shrink to share the row. Passing `full` picks the
 * responsive pair; there is no way to pass a raw span that would break it.
 */
interface FieldGridItemProps extends Omit<GridItemProps, 'colSpan'> {
  /** Take the whole row (summaries, bullet lists) rather than one column. */
  full?: boolean;
}

export const FieldGridItem: FC<FieldGridItemProps> = ({
  full = false,
  children,
  ...rest
}) => (
  <GridItem colSpan={full ? { base: 1, sm: 2 } : 1} {...rest}>
    {children}
  </GridItem>
);
