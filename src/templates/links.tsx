import { Link, Text } from '@react-pdf/renderer';
import { ComponentProps } from 'react';

import { displayUrl, ensureProtocol } from '../utils/url-utilities';

type Style = ComponentProps<typeof Link>['style'];

/**
 * The line under an entry's title: its role, type, or issuer, followed — when
 * the entry has a URL — by a divider and the URL as a visible link
 * ("Application · git-scm.com"). Renders nothing when there is neither.
 *
 * The link is an inline run of the line's own `Text`, so it inherits that
 * line's font and wraps with it; `linkStyle` only needs to undo what should not
 * carry over (uppercase, italics, tracking). It must also set a colour and
 * switch the underline off: react-pdf gives every `Link` a blue, underlined
 * default.
 */
export const EntryMeta = ({
  text,
  url,
  style,
  linkStyle,
}: {
  text?: string;
  url?: string;
  style: Style;
  linkStyle: Style;
}) => {
  if (!text && !url) return null;
  return (
    <Text style={style}>
      {text}
      {text && url ? ' · ' : null}
      {url ? (
        <Link src={ensureProtocol(url) ?? ''} style={linkStyle}>
          {displayUrl(url)}
        </Link>
      ) : null}
    </Text>
  );
};
