import {
  Page,
  View,
  Text,
  Document,
  StyleSheet,
  Font,
  Link,
} from '@react-pdf/renderer';
import { ReactNode } from 'react';

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

const FONTS = 'https://raw.githubusercontent.com/google/fonts/main/ofl';

// Fira Sans — one humanist sans across the whole document. Its wide static
// weight range (ExtraLight → Bold) is what lets a single ink color carry the
// hierarchy: contrast comes from weight, size, tracking, and space alone.
Font.register({
  family: 'Fira Sans',
  fonts: [
    { src: `${FONTS}/firasans/FiraSans-ExtraLight.ttf`, fontWeight: 200 },
    { src: `${FONTS}/firasans/FiraSans-Light.ttf`, fontWeight: 300 },
    { src: `${FONTS}/firasans/FiraSans-Regular.ttf`, fontWeight: 400 },
    { src: `${FONTS}/firasans/FiraSans-Medium.ttf`, fontWeight: 500 },
    { src: `${FONTS}/firasans/FiraSans-SemiBold.ttf`, fontWeight: 600 },
    { src: `${FONTS}/firasans/FiraSans-Bold.ttf`, fontWeight: 700 },
  ],
});

// Wrap whole words rather than hyphenating mid-syllable (global @react-pdf
// setting; harmless to reassert here so Mono behaves the same in isolation).
Font.registerHyphenationCallback((word) => [word]);

// A single monochrome ramp — no hue anywhere. Mono deliberately ignores the
// accent palette (see below); the accent picker is disabled while it's active.
const colors = {
  paper: '#ffffff',
  ink: '#18181b', // name, entry titles, section labels
  body: '#3f3f46', // paragraphs, summaries, keywords
  muted: '#52525b', // roles and meta
  soft: '#71717a', // dates and contact line
  faint: '#a1a1aa', // separators and bullet marks
};

// No accent argument: the design is monochrome by definition, so styles are a
// plain module constant rather than a function of the accent.
const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 58,
    paddingTop: 58,
    paddingBottom: 58,
    backgroundColor: colors.paper,
    color: colors.body,
    fontSize: 10,
    fontFamily: 'Fira Sans',
    fontWeight: 400,
    lineHeight: 1.55,
  },

  // Masthead — no rule beneath it; the gap before the first section does the
  // separating.
  name: {
    fontFamily: 'Fira Sans',
    fontWeight: 300,
    fontSize: 29,
    lineHeight: 1.1,
    letterSpacing: -0.2,
    color: colors.ink,
  },
  label: {
    fontFamily: 'Fira Sans',
    fontWeight: 500,
    fontSize: 8.5,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: 9,
  },
  contact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 13,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontFamily: 'Fira Sans',
    fontWeight: 400,
    fontSize: 9,
    color: colors.soft,
  },
  contactLink: {
    fontFamily: 'Fira Sans',
    fontWeight: 500,
    fontSize: 9,
    color: colors.body,
    textDecoration: 'none',
  },
  dot: {
    fontSize: 9,
    color: colors.faint,
    marginHorizontal: 8,
  },
  summary: {
    marginTop: 14,
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.body,
  },

  // Section — a single tracked, uppercase label floating above its content.
  // Generous top margin (no divider line) sets each section apart.
  section: {
    marginTop: 26,
  },
  sectionTitle: {
    fontFamily: 'Fira Sans',
    fontWeight: 600,
    fontSize: 9.5,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: colors.ink,
    marginBottom: 12,
  },

  // Entries (work / education / projects / simple entries)
  entry: {
    marginBottom: 14,
  },
  entryLast: {
    marginBottom: 0,
  },
  entryHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  entryTitle: {
    fontFamily: 'Fira Sans',
    fontWeight: 600,
    fontSize: 11,
    color: colors.ink,
    flex: 1,
    paddingRight: 12,
  },
  entryDates: {
    fontFamily: 'Fira Sans',
    fontWeight: 400,
    fontSize: 9,
    letterSpacing: 0.2,
    color: colors.soft,
  },
  entryMeta: {
    fontFamily: 'Fira Sans',
    fontWeight: 500,
    fontSize: 9.5,
    color: colors.muted,
    marginTop: 2.5,
  },
  entrySummary: {
    fontSize: 9.5,
    lineHeight: 1.5,
    color: colors.body,
    marginTop: 5,
  },

  // Highlight bullets — a hairline en-dash marker, no glyphs or rules.
  bulletRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  bulletMark: {
    fontSize: 9.5,
    color: colors.faint,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.5,
    color: colors.body,
  },

  // Skills / interests — an editorial definition list: a tracked label rail on
  // the left, plain comma-separated keywords on the right. No tags, no fills.
  skillRow: {
    flexDirection: 'row',
    marginBottom: 9,
  },
  skillRowLast: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  skillName: {
    width: '24%',
    paddingRight: 14,
    paddingTop: 1.5,
    fontFamily: 'Fira Sans',
    fontWeight: 600,
    fontSize: 8.5,
    lineHeight: 1.4,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  skillKeywords: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.55,
    color: colors.body,
  },
});

const Highlight = ({ value }: { value: string }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bulletMark}>&ndash;</Text>
    <Text style={styles.bulletText}>{value}</Text>
  </View>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const SkillsSection = ({
  skill,
  isLast,
}: {
  skill: Skill;
  isLast: boolean;
}) => (
  <View style={isLast ? styles.skillRowLast : styles.skillRow} wrap={false}>
    <Text style={styles.skillName}>{skill.name}</Text>
    <Text style={styles.skillKeywords}>
      {skill.keywords.map((keyword) => keyword.value).join(', ')}
    </Text>
  </View>
);

const WorkExperience = ({ work, isLast }: { work: Work; isLast: boolean }) => {
  const startDate = formatDate(work.startDate);
  const endDate = (work.isPresent ? 'Present' : formatDate(work.endDate)) || '';

  return (
    <View style={isLast ? styles.entryLast : styles.entry} wrap={false}>
      <View style={styles.entryHead}>
        <Text style={styles.entryTitle}>{work.name}</Text>
        <Text style={styles.entryDates}>
          {startDate} – {endDate}
        </Text>
      </View>
      {work.position && <Text style={styles.entryMeta}>{work.position}</Text>}
      {work.summary && <Text style={styles.entrySummary}>{work.summary}</Text>}
      {work?.highlights?.map((highlight, index) => (
        <Highlight key={index} value={highlight.value} />
      ))}
    </View>
  );
};

const EducationSection = ({
  education,
  isLast,
}: {
  education: Education;
  isLast: boolean;
}) => {
  const detail = [education.studyType, education.area]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={isLast ? styles.entryLast : styles.entry} wrap={false}>
      <View style={styles.entryHead}>
        <Text style={styles.entryTitle}>{education.institution}</Text>
        <Text style={styles.entryDates}>
          {formatDate(education.startDate)} – {formatDate(education.endDate)}
        </Text>
      </View>
      {detail ? <Text style={styles.entryMeta}>{detail}</Text> : null}
    </View>
  );
};

const ProjectSection = ({
  project,
  isLast,
}: {
  project: Project;
  isLast: boolean;
}) => {
  const startDate = formatDate(project.startDate);
  const endDate = formatDate(project.endDate) || 'Present';

  return (
    <View style={isLast ? styles.entryLast : styles.entry} wrap={false}>
      <View style={styles.entryHead}>
        <Text style={styles.entryTitle}>{project.name}</Text>
        <Text style={styles.entryDates}>
          {startDate} – {endDate}
        </Text>
      </View>
      {project.type && <Text style={styles.entryMeta}>{project.type}</Text>}
      {project.description && (
        <Text style={styles.entrySummary}>{project.description}</Text>
      )}
      {project?.highlights?.map((highlight, index) => (
        <Highlight key={index} value={highlight} />
      ))}
    </View>
  );
};

// A generic title/dates/meta/summary entry shared by awards, certificates,
// publications, languages, and references — they all reduce to the same shape.
const SimpleEntry = ({
  title,
  dates,
  meta,
  summary,
  isLast,
}: {
  title?: string;
  dates?: string;
  meta?: string;
  summary?: string;
  isLast: boolean;
}) => (
  <View style={isLast ? styles.entryLast : styles.entry} wrap={false}>
    <View style={styles.entryHead}>
      <Text style={styles.entryTitle}>{title}</Text>
      {dates ? <Text style={styles.entryDates}>{dates}</Text> : null}
    </View>
    {meta ? <Text style={styles.entryMeta}>{meta}</Text> : null}
    {summary ? <Text style={styles.entrySummary}>{summary}</Text> : null}
  </View>
);

const InterestGroup = ({
  interest,
  isLast,
}: {
  interest: Interest;
  isLast: boolean;
}) => (
  <View style={isLast ? styles.skillRowLast : styles.skillRow} wrap={false}>
    <Text style={styles.skillName}>{interest.name}</Text>
    {interest.keywords?.length ? (
      <Text style={styles.skillKeywords}>
        {interest.keywords.map((keyword) => keyword.value).join(', ')}
      </Text>
    ) : null}
  </View>
);

// Mono is monochrome by design and intentionally ignores `accent` — the accent
// picker is disabled (see templates/index.ts `supportsAccent`) while it's active.
const MonoTemplate = ({
  resume,
}: {
  resume: Resume;
  accent: AccentPalette;
}) => {
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

  const contactNodes = [
    basics?.location?.city && (
      <Text style={styles.contactText}>{basics.location.city}</Text>
    ),
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
  const last = (i: number, len: number) => i === len - 1;
  const sectionContent: Partial<Record<SectionTypes, ReactNode>> = {
    [SectionTypes.Skills]: skills.map((skill, index) => (
      <SkillsSection
        key={`${skill.name}-${index}`}
        skill={skill}
        isLast={last(index, skills.length)}
      />
    )),
    [SectionTypes.Work]: work.map((item, index) => (
      <WorkExperience
        key={`${item.name}-${index}`}
        work={item}
        isLast={last(index, work.length)}
      />
    )),
    [SectionTypes.Volunteer]: volunteer.map((item, index) => (
      <WorkExperience
        key={`${item.organization}-${index}`}
        work={{ ...item, name: item.organization || item.name } as Work}
        isLast={last(index, volunteer.length)}
      />
    )),
    [SectionTypes.Education]: education.map((item, index) => (
      <EducationSection
        key={`${item.institution}-${index}`}
        education={item}
        isLast={last(index, education.length)}
      />
    )),
    [SectionTypes.Awards]: awards.map((item: Award, index) => (
      <SimpleEntry
        key={`${item.title}-${index}`}
        title={item.title}
        dates={formatDate(item.date)}
        meta={item.awarder}
        summary={item.summary}
        isLast={last(index, awards.length)}
      />
    )),
    [SectionTypes.Certificates]: certificates.map(
      (item: Certificate, index) => (
        <SimpleEntry
          key={`${item.name}-${index}`}
          title={item.name}
          dates={formatDate(item.date)}
          meta={item.issuer}
          isLast={last(index, certificates.length)}
        />
      )
    ),
    [SectionTypes.Publications]: publications.map(
      (item: Publication, index) => (
        <SimpleEntry
          key={`${item.name}-${index}`}
          title={item.name}
          dates={formatDate(item.releaseDate)}
          meta={item.publisher}
          summary={item.summary}
          isLast={last(index, publications.length)}
        />
      )
    ),
    [SectionTypes.Languages]: languages.map((item: Language, index) => (
      <SimpleEntry
        key={`${item.language}-${index}`}
        title={item.language}
        meta={item.fluency}
        isLast={last(index, languages.length)}
      />
    )),
    [SectionTypes.Interests]: interests.map((item: Interest, index) => (
      <InterestGroup
        key={`${item.name}-${index}`}
        interest={item}
        isLast={last(index, interests.length)}
      />
    )),
    [SectionTypes.References]: references.map((item: Reference, index) => (
      <SimpleEntry
        key={`${item.name}-${index}`}
        title={item.name}
        summary={item.reference}
        isLast={last(index, references.length)}
      />
    )),
    [SectionTypes.Projects]: projects.map((item, index) => (
      <ProjectSection
        key={`${item.name}-${index}`}
        project={item}
        isLast={last(index, projects.length)}
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
          <Text style={styles.name}>{basics?.name}</Text>
          {basics?.label && (
            <Text style={styles.label}>{basics.label.toUpperCase()}</Text>
          )}
          <View style={styles.contact}>
            {contactNodes.map((node, index) => (
              <View key={index} style={styles.contactItem}>
                {index > 0 && <Text style={styles.dot}>·</Text>}
                {node}
              </View>
            ))}
          </View>
          {basics?.summary && (
            <Text style={styles.summary}>{basics.summary}</Text>
          )}
        </View>

        {sections.map((section) => (
          <Section key={section.title} title={section.title}>
            {section.body}
          </Section>
        ))}
      </Page>
    </Document>
  );
};

export default MonoTemplate;
