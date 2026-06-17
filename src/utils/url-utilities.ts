// Prepends "https://" when a URL has no scheme, so a bare value like
// "michaelmov.dev" becomes a working, clickable link. Values that already
// include a protocol (e.g. "https://...", "mailto:...") are left untouched.
export const ensureProtocol = (url?: string) =>
  url && !/^[a-z][\w+.-]*:\/\//i.test(url) ? `https://${url}` : url;
