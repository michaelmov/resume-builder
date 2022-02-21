export const formatDate = (date: Date | string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: undefined,
  };
  let formattedDate = new Date(date).toLocaleDateString('en-US', options);

  if (formattedDate === 'Invalid Date') {
    return date;
  }

  return formattedDate;
};
