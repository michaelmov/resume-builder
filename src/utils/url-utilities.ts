// Prepends "https://" when a URL has no scheme, so a bare value like
// "michaelmov.dev" becomes a working, clickable link. Values that already
// include a protocol (e.g. "https://...", "mailto:...") are left untouched.
export const ensureProtocol = (url?: string) =>
  url && !/^[a-z][\w+.-]*:\/\//i.test(url) ? `https://${url}` : url;

// The form of a URL worth printing: no scheme and no trailing slash, so
// "https://git-scm.com/" reads as "git-scm.com". Pair it with `ensureProtocol`
// for the link target — this is for display only.
export const displayUrl = (url: string) =>
  url
    .trim()
    .replace(/^[a-z][\w+.-]*:\/\//i, '')
    .replace(/\/+$/, '');
