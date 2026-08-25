import { Box, Link, Text } from '@chakra-ui/react';
import { FC } from 'react';

/**
 * The site credit. It lives at the foot of the list page only — the editor is a
 * working surface where every row of vertical space belongs to the resume.
 * Rendered as the last child of a column-flex scroll region with the content
 * above it flexing, so it sits at the bottom of the window when the list is
 * short and after the cards when the list scrolls.
 *
 * The source link is not decorative: AGPL-3.0 §13 requires that users who
 * interact with the app over a network be offered its Corresponding Source, and
 * this is where that offer is made. Keep it on any deployed surface.
 */
export const Footer: FC = () => (
  <Box as="footer" px={{ base: 4, md: 8 }} py={6}>
    <Text fontSize="sm" textAlign="center" color="fg.muted">
      Made with ❤️ by{' '}
      <Link
        href="https://michaelmov.dev/"
        target="_blank"
        textDecoration="underline"
        color="brand.fg"
      >
        Michael
      </Link>
      {' · '}
      <Link
        href="https://github.com/michaelmov/resume-builder"
        target="_blank"
        textDecoration="underline"
        color="brand.fg"
      >
        Source
      </Link>
    </Text>
  </Box>
);
