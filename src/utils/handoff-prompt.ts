/**
 * The prompt offered in the import dialog for resumes that aren't already JSON
 * Resume files.
 *
 * This app only imports JSON Resume, and converting a PDF or Word document into
 * that shape is a job for an LLM. Rather than parsing those formats here, the
 * dialog hands the user a prompt to run in whichever assistant they already
 * use, with their resume attached; the JSON that comes back imports through the
 * ordinary path.
 *
 * It's written to be read cold in a chat window, so it restates the schema
 * rather than assuming any context.
 */

/** The rule the whole thing rests on: transcribe, never fill in. */
const RULES = [
  'Use only information that appears in the resume. Never invent, infer, or fill in a value that is not written there.',
  'Omit any field or section the resume does not mention. Do not emit empty strings or placeholder values.',
  'Copy wording verbatim where practical. Do not rewrite, summarize, or embellish.',
  'Dates use YYYY-MM-DD, YYYY-MM, or YYYY — whichever precision the resume gives.',
  'For a role or study still in progress, omit endDate entirely.',
  // Asked for as a file because the result has to be dropped on a file
  // dropzone. Not every assistant can attach one, so the fallback keeps the
  // prompt working everywhere — the user can always save a raw reply by hand.
  'Return the result as a downloadable file named resume.json.',
  'If you cannot attach a file, reply with the raw JSON and nothing else — no commentary before or after, and no code fences.',
];

const SHAPE = `Top-level keys (all optional): basics, work, volunteer, education, awards, certificates, publications, skills, languages, interests, references, projects.
basics: name, label, email, phone, url, summary, location { address, postalCode, city, countryCode, region }, profiles [{ network, username, url }]
work / volunteer: name (or organization for volunteer), position, url, startDate, endDate, summary, highlights [string]
education: institution, url, area, studyType, startDate, endDate, score, courses [string]
skills: name, level, keywords [string]
projects: name, description, highlights [string], keywords [string], startDate, endDate, url, roles [string], entity, type
awards: title, date, awarder, summary
certificates: name, date, issuer, url
publications: name, publisher, releaseDate, url, summary
languages: language, fluency
interests: name, keywords [string]
references: name, reference`;

export const HANDOFF_PROMPT = [
  'Convert the attached resume into a JSON Resume document (the schema at https://jsonresume.org/schema).',
  '',
  RULES.map((rule, index) => `${index + 1}. ${rule}`).join('\n'),
  '',
  'SHAPE:',
  SHAPE,
  '',
  '(My resume is attached to this message.)',
].join('\n');
