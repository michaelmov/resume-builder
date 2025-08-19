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
