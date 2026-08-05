import {
  Page,
  View,
  Text,
  Document,
  StyleSheet,
  Font,
  Link,
} from '@react-pdf/renderer';
import { ReactNode, useMemo } from 'react';

import {
  Award,
  Certificate,
  Education,
  getSectionTitle,
  Interest,
  Language,
  Project,
  Publication,
  Reference,
  resolveSectionOrder,
  Resume,
  SectionTypes,
  Skill,
  Work,
} from '../types/resume.model';
import { formatDate } from '../utils/date-utilities';
import { ensureProtocol } from '../utils/url-utilities';

import { AccentPalette } from './accents';
import {
  KeepTogether,
  LeadingEntryProps,
  splitHighlights,
  withSectionHeading,
} from './pagination';

const FONTS = 'https://raw.githubusercontent.com/google/fonts/main/ofl';

// DM Serif Display — a high-contrast Didone used only at display sizes: the
// name, the department numerals, entry titles, and the run-in skill headings.
// It ships a single weight, so nothing here may ask it for bold; the contrast
// against the text serif is what carries the hierarchy instead.
Font.register({
  family: 'DM Serif Display',
  fonts: [{ src: `${FONTS}/dmserifdisplay/DMSerifDisplay-Regular.ttf` }],
});

// Crimson Text — the book serif everything readable is set in, including the
// letterspaced uppercase micro-labels and the italic standfirst and roles.
Font.register({
  family: 'Crimson Text',
  fonts: [
    { src: `${FONTS}/crimsontext/CrimsonText-Regular.ttf`, fontWeight: 400 },
    {
      src: `${FONTS}/crimsontext/CrimsonText-Italic.ttf`,
      fontWeight: 400,
      fontStyle: 'italic',
    },
    { src: `${FONTS}/crimsontext/CrimsonText-SemiBold.ttf`, fontWeight: 600 },
  ],
});

// Wrap whole words rather than hyphenating mid-syllable (global @react-pdf
// setting; harmless to reassert here so Folio behaves the same in isolation).
Font.registerHyphenationCallback((word) => [word]);

// A cool, near-neutral ink ramp. Warm paper tones soften a Didone; the stark
// grays keep its thin strokes crisp.
const colors = {
  paper: '#ffffff',
  ink: '#101014', // name, department titles, entry titles
  body: '#3d3d45', // paragraphs, bullets, keywords
  muted: '#6e6e78', // dates and contact line
  faint: '#a5a5b0', // separators
  rule: '#e2e2e6', // department hairlines
};

const makeStyles = (accent: AccentPalette, marginScale: number) =>
  StyleSheet.create({
    page: {
      paddingHorizontal: 54 * marginScale,
      paddingTop: 50 * marginScale,
      paddingBottom: 50 * marginScale,
      backgroundColor: colors.paper,
      color: colors.body,
      fontSize: 10.5,
      fontFamily: 'Crimson Text',
      lineHeight: 1.45,
    },

    // Masthead — a running head over a rule, then the name at display size.
    // Aligned to the top rather than the baseline: a label long enough to wrap
    // takes its baseline from its *last* line, which would drop the place name
    // to sit beside the second line instead of the first.
    eyebrow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    eyebrowLead: {
      fontFamily: 'Crimson Text',
      fontWeight: 600,
      fontSize: 8.5,
      lineHeight: 1.2,
      letterSpacing: 2.8,
      textTransform: 'uppercase',
      color: accent.strong,
      flex: 1,
      paddingRight: 16,
    },
    eyebrowTrail: {
      fontFamily: 'Crimson Text',
      fontWeight: 600,
      fontSize: 8.5,
      lineHeight: 1.2,
      letterSpacing: 2.8,
      textTransform: 'uppercase',
      color: colors.faint,
    },
    mastheadRule: {
      marginTop: 7,
      borderBottomWidth: 1,
      borderBottomColor: colors.ink,
    },
    name: {
      fontFamily: 'DM Serif Display',
      fontSize: 35,
      lineHeight: 1.1,
      letterSpacing: -0.2,
      marginTop: 14,
      color: colors.ink,
    },

    // Byline — contact details separated by thin vertical rules.
    contact: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginTop: 9,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    contactText: {
      fontSize: 10,
      lineHeight: 1.3,
      color: colors.muted,
    },
    contactLink: {
      fontSize: 10,
      lineHeight: 1.3,
      color: accent.strong,
      textDecoration: 'none',
    },
    contactDivider: {
      width: 0.6,
      height: 9,
      backgroundColor: colors.faint,
      marginHorizontal: 9,
    },
    // The standfirst: the deck paragraph under a headline, set in italic a
    // size above the body copy.
    summary: {
      marginTop: 15,
      fontSize: 12,
      fontStyle: 'italic',
      lineHeight: 1.5,
      color: colors.ink,
    },

    // Departments — the rule sits above the heading rather than beside it, and
    // thickens into a short accent tick at the left before running out as a
    // hairline. Two segments of one line, so it can never break between them.
    section: {
      marginTop: 21,
    },
    sectionHeader: {
      marginBottom: 11,
    },
    sectionRule: {
      flexDirection: 'row',
      // Both segments hang from a shared bottom edge, so the tick reads as a
      // thickening of the hairline rather than a separate bar above it.
      alignItems: 'flex-end',
      marginBottom: 8,
    },
    sectionRuleTick: {
      width: 34,
      height: 1.6,
      backgroundColor: accent.strong,
    },
    sectionRuleHair: {
      flex: 1,
      height: 0.6,
      backgroundColor: colors.rule,
    },
    sectionTitle: {
      fontFamily: 'Crimson Text',
      fontWeight: 600,
      fontSize: 10.5,
      lineHeight: 1.2,
      letterSpacing: 2.4,
      textTransform: 'uppercase',
      color: colors.ink,
    },

    // Entries (work / education / projects)
    entry: {
      marginBottom: 12,
    },
    entryHead: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    entryTitle: {
      fontFamily: 'DM Serif Display',
      fontSize: 12.5,
      lineHeight: 1.25,
      color: colors.ink,
      flex: 1,
      paddingRight: 12,
    },
    entryDates: {
      fontFamily: 'Crimson Text',
      fontWeight: 600,
      fontSize: 8.5,
      lineHeight: 1.4,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    entryRole: {
      fontStyle: 'italic',
      fontSize: 10.5,
      lineHeight: 1.35,
      color: colors.ink,
      marginTop: 1,
    },
    entrySummary: {
      fontSize: 10.5,
      lineHeight: 1.45,
      color: colors.body,
      marginTop: 4,
    },

    // Highlight bullets — a small accent lozenge, squared and turned.
    bulletRow: {
      flexDirection: 'row',
      marginTop: 3,
    },
    bulletMark: {
      width: 3.2,
      height: 3.2,
      backgroundColor: accent.strong,
      transform: 'rotate(45deg)',
      marginTop: 6,
      marginLeft: 1.5,
      marginRight: 9,
    },
    bulletText: {
      flex: 1,
      fontSize: 10.5,
      lineHeight: 1.45,
      color: colors.body,
    },

    // Skills — run-in headings, as an editorial index sets them: the group
    // name leads the line and its keywords carry straight on from it.
    skillLine: {
      marginBottom: 6,
      fontSize: 10.5,
      lineHeight: 1.45,
      color: colors.body,
    },
    skillName: {
      fontFamily: 'DM Serif Display',
      fontWeight: 400,
      fontSize: 11.5,
      color: colors.ink,
    },
    skillDash: {
      color: colors.faint,
    },
  });

type Styles = ReturnType<typeof makeStyles>;

// A bullet list may break across pages, but never a single bullet — without
// this the row splits and leaves its mark stranded at the foot of the page.
const Highlight = ({ value, styles }: { value: string; styles: Styles }) => (
  <View style={styles.bulletRow} wrap={false}>
    <View style={styles.bulletMark} />
    <Text style={styles.bulletText}>{value}</Text>
  </View>
);

const SectionHeader = ({
  title,
  styles,
}: {
  title: string;
  styles: Styles;
}) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionRule}>
      <View style={styles.sectionRuleTick} />
      <View style={styles.sectionRuleHair} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// The run-in line shared by skills and interests: a display-serif name flowing
// straight into its comma-separated keywords, as one wrapping paragraph.
const RunInGroup = ({
  name,
  keywords,
  styles,
  leading,
}: {
  name?: string;
  keywords?: { value: string }[];
  styles: Styles;
} & LeadingEntryProps) => (
  // Skill and interest rows stay atomic — they are only a line or two, and
  // splitting one mid-keyword-list reads as a mistake.
  <KeepTogether>
    {leading}
    <Text style={styles.skillLine}>
      <Text style={styles.skillName}>{name}</Text>
      {keywords?.length ? (
        <>
          <Text style={styles.skillDash}> — </Text>
          {keywords.map((keyword) => keyword.value).join(', ')}
        </>
      ) : null}
    </Text>
  </KeepTogether>
);

const WorkExperience = ({
  work,
  styles,
  leading,
}: { work: Work; styles: Styles } & LeadingEntryProps) => {
  const startDate = formatDate(work.startDate);
  const endDate = (work.isPresent ? 'Present' : formatDate(work.endDate)) || '';
  const { glued, flowing } = splitHighlights(
    work.highlights,
    Boolean(work.summary)
  );

  return (
    <View style={styles.entry}>
      <KeepTogether>
        {leading}
        <View style={styles.entryHead}>
          <Text style={styles.entryTitle}>{work.name}</Text>
          <Text style={styles.entryDates}>
            {startDate} — {endDate}
          </Text>
        </View>
        {work.position && <Text style={styles.entryRole}>{work.position}</Text>}
        {glued.map((highlight, index) => (
          <Highlight key={index} value={highlight.value} styles={styles} />
        ))}
      </KeepTogether>
      {work.summary && <Text style={styles.entrySummary}>{work.summary}</Text>}
      {flowing.map((highlight, index) => (
        <Highlight key={index} value={highlight.value} styles={styles} />
      ))}
    </View>
  );
};

const EducationSection = ({
  education,
  styles,
  leading,
}: { education: Education; styles: Styles } & LeadingEntryProps) => {
  const detail = [education.studyType, education.area]
    .filter(Boolean)
    .join(' · ');

  return (
    <KeepTogether>
      {leading}
      <View style={styles.entry}>
        <View style={styles.entryHead}>
          <Text style={styles.entryTitle}>{education.institution}</Text>
          <Text style={styles.entryDates}>
            {formatDate(education.startDate)} — {formatDate(education.endDate)}
          </Text>
        </View>
        {detail ? <Text style={styles.entryRole}>{detail}</Text> : null}
      </View>
    </KeepTogether>
  );
};

const ProjectSection = ({
  project,
  styles,
  leading,
}: { project: Project; styles: Styles } & LeadingEntryProps) => {
  const startDate = formatDate(project.startDate);
  const endDate = formatDate(project.endDate) || 'Present';
  const { glued, flowing } = splitHighlights(
    project.highlights,
    Boolean(project.description)
  );

  return (
    <View style={styles.entry}>
      <KeepTogether>
        {leading}
        <View style={styles.entryHead}>
          <Text style={styles.entryTitle}>{project.name}</Text>
          <Text style={styles.entryDates}>
            {startDate} — {endDate}
          </Text>
        </View>
        {project.type && <Text style={styles.entryRole}>{project.type}</Text>}
        {glued.map((highlight, index) => (
          <Highlight key={index} value={highlight} styles={styles} />
        ))}
      </KeepTogether>
      {project.description && (
        <Text style={styles.entrySummary}>{project.description}</Text>
      )}
      {flowing.map((highlight, index) => (
        <Highlight key={index} value={highlight} styles={styles} />
      ))}
    </View>
  );
};

// A generic title/dates/role/summary entry shared by awards, certificates,
// publications, references, and languages.
const SimpleEntry = ({
  title,
  dates,
  role,
  summary,
  styles,
  leading,
}: {
  title?: string;
  dates?: string;
  role?: string;
  summary?: string;
  styles: Styles;
} & LeadingEntryProps) => (
  <View style={styles.entry}>
    <KeepTogether>
      {leading}
      <View style={styles.entryHead}>
        <Text style={styles.entryTitle}>{title}</Text>
        {dates ? <Text style={styles.entryDates}>{dates}</Text> : null}
      </View>
      {role ? <Text style={styles.entryRole}>{role}</Text> : null}
    </KeepTogether>
    {summary ? <Text style={styles.entrySummary}>{summary}</Text> : null}
  </View>
);

const FolioTemplate = ({
  resume,
  accent,
  marginScale,
}: {
  resume: Resume;
  accent: AccentPalette;
  marginScale: number;
}) => {
  const styles = useMemo(
    () => makeStyles(accent, marginScale),
    [accent, marginScale]
  );
  const {
    basics,
    skills,
    work,
    volunteer,
    education,
    awards,
    certificates,
    publications,
    languages,
    interests,
    references,
    projects,
  } = resume;

  // The place sits in the running head, so the byline carries only the ways to
  // reach the person. City only, like every other template: `location.region`
  // exists on the model and in the seed resume, but the editor has no input for
  // it, so rendering it would put uneditable text on the page.
  const place = basics?.location?.city;

  const contactNodes = [
    basics?.phone && <Text style={styles.contactText}>{basics.phone}</Text>,
    basics?.email && <Text style={styles.contactText}>{basics.email}</Text>,
    basics?.url && (
      <Link src={ensureProtocol(basics.url)} style={styles.contactLink}>
        {basics.url}
      </Link>
    ),
  ].filter(Boolean);

  // Build the body for every section type; the active set + order chosen in the
  // Editor decides which appear (an active-but-empty section still shows its
  // heading).
  // Entries only — the section header is handed to the first entry at render
  // time (see `withSectionHeading`) so the two cannot be split across a page.
  const sectionContent: Partial<Record<SectionTypes, ReactNode[]>> = {
    [SectionTypes.Skills]: skills.map((skill: Skill, index) => (
      <RunInGroup
        key={`${skill.name}-${index}`}
        name={skill.name}
        keywords={skill.keywords}
        styles={styles}
      />
    )),
    [SectionTypes.Work]: work.map((item, index) => (
      <WorkExperience
        key={`${item.name}-${index}`}
        work={item}
        styles={styles}
      />
    )),
    [SectionTypes.Volunteer]: volunteer.map((item, index) => (
      <WorkExperience
        key={`${item.organization}-${index}`}
        work={{ ...item, name: item.organization || item.name } as Work}
        styles={styles}
      />
    )),
    [SectionTypes.Education]: education.map((item, index) => (
      <EducationSection
        key={`${item.institution}-${index}`}
        education={item}
        styles={styles}
      />
    )),
    [SectionTypes.Awards]: awards.map((item: Award, index) => (
      <SimpleEntry
        key={`${item.title}-${index}`}
        title={item.title}
        dates={formatDate(item.date)}
        role={item.awarder}
        summary={item.summary}
        styles={styles}
      />
    )),
    [SectionTypes.Certificates]: certificates.map(
      (item: Certificate, index) => (
        <SimpleEntry
          key={`${item.name}-${index}`}
          title={item.name}
          dates={formatDate(item.date)}
          role={item.issuer}
          styles={styles}
        />
      )
    ),
    [SectionTypes.Publications]: publications.map(
      (item: Publication, index) => (
        <SimpleEntry
          key={`${item.name}-${index}`}
          title={item.name}
          dates={formatDate(item.releaseDate)}
          role={item.publisher}
          summary={item.summary}
          styles={styles}
        />
      )
    ),
    [SectionTypes.Languages]: languages.map((item: Language, index) => (
      <SimpleEntry
        key={`${item.language}-${index}`}
        title={item.language}
        role={item.fluency}
        styles={styles}
      />
    )),
    [SectionTypes.Interests]: interests.map((item: Interest, index) => (
      <RunInGroup
        key={`${item.name}-${index}`}
        name={item.name}
        keywords={item.keywords}
        styles={styles}
      />
    )),
    [SectionTypes.References]: references.map((item: Reference, index) => (
      <SimpleEntry
        key={`${item.name}-${index}`}
        title={item.name}
        summary={item.reference}
        styles={styles}
      />
    )),
    [SectionTypes.Projects]: projects.map((item, index) => (
      <ProjectSection
        key={`${item.name}-${index}`}
        project={item}
        styles={styles}
      />
    )),
  };

  const sectionOrder = resolveSectionOrder(resume.sectionOrder);
  const sections = sectionOrder.map((type) => ({
    title: getSectionTitle(type, resume.sectionTitles),
    body: sectionContent[type],
  }));

  return (
    <Document>
      {/* Key the page by the section order so react-pdf fully re-lays-out the
          page when sections are reordered (otherwise it reuses cached layout
          for the unchanged section blocks and the order appears stale). */}
      <Page size="A4" style={styles.page} key={sectionOrder.join('-')}>
        <View>
          {(basics?.label || place) && (
            <View style={styles.eyebrow}>
              <Text style={styles.eyebrowLead}>{basics?.label}</Text>
              <Text style={styles.eyebrowTrail}>{place}</Text>
            </View>
          )}
          <View style={styles.mastheadRule} />
          <Text style={styles.name}>{basics?.name}</Text>
          <View style={styles.contact}>
            {contactNodes.map((node, index) => (
              <View key={index} style={styles.contactItem}>
                {index > 0 && <View style={styles.contactDivider} />}
                {node}
              </View>
            ))}
          </View>
          {basics?.summary && (
            <Text style={styles.summary}>{basics.summary}</Text>
          )}
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            {withSectionHeading(
              section.body ?? [],
              <SectionHeader title={section.title} styles={styles} />
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
};

export default FolioTemplate;
