const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "Edited 2h ago" for the resume list. Recent edits read as elapsed time,
 * because that's what tells you which resume you were just working on; past a
 * week the exact date is more use than "9 days ago".
 */
export const formatRelativeTime = (
  timestamp: number,
  now: number = Date.now()
): string => {
  const elapsed = now - timestamp;

  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d ago`;

  return formatDate(new Date(timestamp), {
    month: 'short',
    day: 'numeric',
    // Drop the year for edits inside the current one — it's just noise.
    year:
      new Date(timestamp).getFullYear() === new Date(now).getFullYear()
        ? undefined
        : 'numeric',
  });
};

export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: undefined,
  }
): string => {
  let formattedDate = new Date(date).toLocaleDateString('en-US', options);

  if (formattedDate === 'Invalid Date') {
    // If date is a Date object and invalid, convert to string
    if (date instanceof Date) {
      return date.toString();
    }
    // If date is already a string, return it
    return String(date);
  }

  return formattedDate;
};
