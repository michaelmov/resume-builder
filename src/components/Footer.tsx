import { Box, Link, Text } from '@chakra-ui/react';
import { FC } from 'react';

/**
 * The site credit. It lives at the foot of the list page only — the editor is a
 * working surface where every row of vertical space belongs to the resume.
 * Rendered as the last child of a column-flex scroll region with the content
 * above it flexing, so it sits at the bottom of the window when the list is
 * short and after the cards when the list scrolls.
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
    </Text>
  </Box>
);
