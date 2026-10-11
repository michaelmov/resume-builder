// A bare grade point ("3.8", "3.8/4.0") means nothing on the page without a
// label. Anything else the user typed ("GPA: 3.8", "First Class Honours",
// "85%") already reads on its own and is left as written.
const BARE_GPA = /^\d+(\.\d+)?(\s*\/\s*\d+(\.\d+)?)?$/;

export const formatScore = (score: string | undefined): string => {
  const trimmed = score?.trim() ?? '';

  return BARE_GPA.test(trimmed) ? `GPA ${trimmed}` : trimmed;
};
