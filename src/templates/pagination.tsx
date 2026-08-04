import { View } from '@react-pdf/renderer';
import { cloneElement, isValidElement, ReactElement, ReactNode } from 'react';

/**
 * Wraps children in a block react-pdf will never split across a page boundary.
 *
 * This exists because react-pdf has no "keep with next" rule, and the prop that
 * looks like one — `minPresenceAhead` — does not work for our layouts. Two
 * things in `@react-pdf/layout`'s `shouldBreak` defeat it:
 *
 *   1. It is only consulted for a node that *fits* in the space left on the
 *      page (`!shouldSplit`). A section that is taller than the remaining space
 *      takes the split path instead, which recurses into the section's children
 *      without ever reading the prop.
 *   2. Once recursed, a section heading is the first child at `top === 0`, and
 *      the `breakingImprovesPresence` guard (`box.top > box.marginTop`) is
 *      false there — so the heading never moves, even with a huge
 *      `minPresenceAhead`.
 *
 * The result is a heading stranded at the bottom of a page with its content on
 * the next one. The only mechanism that actually holds is making the heading
 * and the start of its first entry one unsplittable box, which is what this
 * component does. Verified empirically against react-pdf 4.3 — if you are
 * tempted to replace this with `minPresenceAhead`, render a two-page resume
 * and check where the last section's heading lands before you do.
 *
 * Keep the glued box small. Everything inside becomes unsplittable, so a block
 * taller than a page is clipped by react-pdf (it warns with
 * "can't wrap between pages and it's bigger than available page height").
 */
export const KeepTogether = ({ children }: { children?: ReactNode }) => (
  <View wrap={false}>{children}</View>
);

/** An entry that can host its section's heading inside its own glued box. */
export interface LeadingEntryProps {
  leading?: ReactNode;
}

/**
 * A zero-height first child for every section, invisible in the output.
 *
 * It exists to defeat an escape hatch in `@react-pdf/layout`'s `splitNodes`:
 * when a child's own children all move to the next page, the parent is pushed
 * too — *unless* `currentChildren.length === 0`, which the code comments read
 * as "the current page is empty, so we may as well keep the parent here". That
 * list is the enclosing container's children, not the page's. For a section's
 * first entry it is always empty, so when that entry's glued box doesn't fit in
 * the space left, the entry is kept on the page anyway and Yoga shrinks it into
 * whatever room remains (`flexShrink` defaults to 1) — every line drawn on top
 * of the next in a few points at the page foot. Later entries never hit this,
 * because by then the section has children on the page.
 *
 * Standing in as a prior sibling makes the section look started, so the entry
 * takes the branch below it and moves to the next page whole. The anchor has no
 * height or margin, so the first entry's `box.top` stays 0 and it keeps the
 * immunity from being pushed that the section wrapper exists to give it.
 */
const SectionAnchor = () => <View />;

/**
 * Hands a section's heading to its first entry, which renders it inside that
 * entry's `KeepTogether` — so the heading and the start of the entry are one
 * unsplittable box. Sections with no entries render the heading on its own.
 *
 * The heading is injected rather than rendered as a sibling because siblings
 * are exactly what react-pdf is free to break between; see `KeepTogether`.
 *
 * The returned list is led by a `SectionAnchor`, so a first entry that cannot
 * fit in the space left on the page moves to the next one instead of being
 * squashed into it.
 */
export const withSectionHeading = (
  entries: ReactNode[],
  heading: ReactNode
): ReactNode[] => {
  const anchor = <SectionAnchor key="anchor" />;
  const [first, ...rest] = entries;
  if (!isValidElement(first)) {
    return [anchor, <KeepTogether key="heading">{heading}</KeepTogether>];
  }
  const withHeading = cloneElement(first as ReactElement<LeadingEntryProps>, {
    leading: heading,
  });
  return [anchor, withHeading, ...rest];
};

/**
 * Decides how much of an entry's bullet list is glued to its heading.
 *
 * An entry leads with either a summary paragraph or its bullets. When bullets
 * come first we glue one of them down, so a heading always has a real line of
 * content beneath it. When a summary comes first we glue nothing extra — a long
 * summary inside a `KeepTogether` could not wrap, which is exactly the
 * page-hogging block we are trying to avoid. The summary itself is free to
 * split, so its first line lands under the heading anyway.
 */
export const splitHighlights = <T,>(
  highlights: T[] | undefined,
  hasSummary: boolean
): { glued: T[]; flowing: T[] } => {
  const all = highlights ?? [];
  if (hasSummary) return { glued: [], flowing: all };
  return { glued: all.slice(0, 1), flowing: all.slice(1) };
};
