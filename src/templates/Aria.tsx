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
  Education,
  Project,
  resolveSectionOrder,
  Resume,
  SECTION_TITLES,
  SectionTypes,
  Skill,
  Work,
} from '../types/resume.model';
import { formatDate } from '../utils/date-utilities';
import { ensureProtocol } from '../utils/url-utilities';

import { AccentPalette } from './accents';

const FONTS = 'https://raw.githubusercontent.com/google/fonts/main/ofl';

// Lato — a single humanist sans carries the whole design. Hierarchy comes from
// weight and space, not from extra typefaces or color.
Font.register({
  family: 'Lato',
  fonts: [
    { src: `${FONTS}/lato/Lato-Light.ttf`, fontWeight: 300 },
    { src: `${FONTS}/lato/Lato-Regular.ttf`, fontWeight: 400 },
    { src: `${FONTS}/lato/Lato-Medium.ttf`, fontWeight: 500 },
    { src: `${FONTS}/lato/Lato-SemiBold.ttf`, fontWeight: 600 },
    { src: `${FONTS}/lato/Lato-Bold.ttf`, fontWeight: 700 },
  ],
});

// Break lines only at spaces — never split a word into syllables. This is a
// global @react-pdf setting, so it keeps every template from hyphenating.
Font.registerHyphenationCallback((word) => [word]);

const colors = {
  paper: '#ffffff',
  ink: '#1a1a1a',
  body: '#3f3f46',
  muted: '#71717a',
  faint: '#a1a1aa',
  rule: '#ececee',
};

const makeStyles = (accent: AccentPalette) =>
  StyleSheet.create({
    page: {
      paddingHorizontal: 56,
      paddingTop: 54,
      paddingBottom: 54,
      backgroundColor: colors.paper,
      color: colors.body,
      fontSize: 10,
      fontFamily: 'Lato',
      fontWeight: 400,
      lineHeight: 1.5,
    },

    // Masthead
    name: {
      fontFamily: 'Lato',
      fontWeight: 300,
      fontSize: 31,
      lineHeight: 1.1,
      letterSpacing: -0.4,
      color: colors.ink,
    },
    label: {
      fontFamily: 'Lato',
      fontWeight: 600,
      fontSize: 8.5,
      letterSpacing: 2.6,
      textTransform: 'uppercase',
      color: accent.strong,
      marginTop: 7,
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
      fontFamily: 'Lato',
      fontWeight: 400,
      fontSize: 9.5,
      color: colors.muted,
    },
    contactLink: {
      fontFamily: 'Lato',
      fontWeight: 500,
      fontSize: 9.5,
      color: accent.strong,
      textDecoration: 'none',
    },
    dot: {
      fontSize: 9.5,
      color: colors.faint,
      marginHorizontal: 7,
    },
    summary: {
      marginTop: 14,
      fontSize: 10,
      lineHeight: 1.6,
      color: colors.body,
    },
    headerRule: {
      marginTop: 20,
      borderBottomWidth: 0.75,
      borderBottomColor: colors.rule,
    },

    // Section grid — a narrow label rail beside a wide content column.
    section: {
      flexDirection: 'row',
      marginTop: 22,
    },
    rail: {
      width: '20%',
      paddingRight: 14,
    },
    railTitleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    railMark: {
      width: 5,
      height: 5,
      marginTop: 4.5,
      marginRight: 8,
      backgroundColor: accent.strong,
    },
    railTitle: {
      flex: 1,
      fontFamily: 'Lato',
      fontWeight: 600,
      fontSize: 11,
      lineHeight: 1.3,
      color: colors.ink,
    },
    content: {
      flex: 1,
    },

    // Entries (work / education / projects)
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
      fontFamily: 'Lato',
      fontWeight: 600,
      fontSize: 11.5,
      color: colors.ink,
      flex: 1,
      paddingRight: 12,
    },
    entryDates: {
      fontFamily: 'Lato',
      fontWeight: 500,
      fontSize: 9,
      color: colors.muted,
    },
    entryMeta: {
      fontFamily: 'Lato',
      fontWeight: 500,
      fontSize: 9.5,
      color: colors.body,
      marginTop: 2,
    },
    entrySummary: {
      fontSize: 9.5,
      lineHeight: 1.55,
      color: colors.body,
      marginTop: 5,
    },

    // Highlight bullets
    bulletRow: {
      flexDirection: 'row',
      marginTop: 4,
    },
    bulletMark: {
      fontSize: 9.5,
      color: colors.faint,
      marginRight: 7,
    },
    bulletText: {
      flex: 1,
      fontSize: 9.5,
      lineHeight: 1.55,
      color: colors.body,
    },

    // Skills — group name stacked directly above its keywords.
    skillGroup: {
      marginBottom: 11,
    },
    skillGroupLast: {
      marginBottom: 0,
    },
    skillName: {
      fontFamily: 'Lato',
      fontWeight: 600,
      fontSize: 10,
      color: colors.ink,
      marginBottom: 3,
    },
    skillKeywords: {
      fontSize: 10,
      lineHeight: 1.5,
      color: colors.body,
    },
  });

type Styles = ReturnType<typeof makeStyles>;

const Highlight = ({ value, styles }: { value: string; styles: Styles }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bulletMark}>&ndash;</Text>
    <Text style={styles.bulletText}>{value}</Text>
  </View>
);

const Section = ({
  title,
  styles,
  children,
}: {
  title: string;
  styles: Styles;
  children: ReactNode;
}) => (
  <View style={styles.section}>
    <View style={styles.rail}>
      <View style={styles.railTitleRow}>
        <View style={styles.railMark} />
        <Text style={styles.railTitle}>{title}</Text>
      </View>
    </View>
    <View style={styles.content}>{children}</View>
  </View>
);

const SkillsSection = ({
  skill,
  isLast,
  styles,
}: {
  skill: Skill;
  isLast: boolean;
  styles: Styles;
}) => (
  <View style={isLast ? styles.skillGroupLast : styles.skillGroup}>
    <Text style={styles.skillName}>{skill.name}</Text>
    <Text style={styles.skillKeywords}>
      {skill.keywords.map((keyword) => keyword.value).join(', ')}
    </Text>
  </View>
);

const WorkExperience = ({
  work,
  isLast,
  styles,
}: {
  work: Work;
  isLast: boolean;
  styles: Styles;
}) => {
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
        <Highlight key={index} value={highlight.value} styles={styles} />
      ))}
    </View>
  );
};

const EducationSection = ({
  education,
  isLast,
  styles,
}: {
  education: Education;
  isLast: boolean;
  styles: Styles;
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
  styles,
}: {
  project: Project;
  isLast: boolean;
  styles: Styles;
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
        <Highlight key={index} value={highlight} styles={styles} />
      ))}
    </View>
  );
};

const AriaTemplate = ({
  resume,
  accent,
}: {
  resume: Resume;
  accent: AccentPalette;
}) => {
  const styles = useMemo(() => makeStyles(accent), [accent]);
  const { basics, skills, work, education, projects, sectionVisibility } =
    resume;

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

  // Section titles mirror their Editor names exactly. Each reorderable section
  // is keyed so the Editor's order can drive the layout here.
  const sectionContent: Partial<
    Record<SectionTypes, { title: string; body: ReactNode }>
  > = {};

  if (!sectionVisibility?.skills) {
    sectionContent[SectionTypes.Skills] = {
      title: SECTION_TITLES[SectionTypes.Skills],
      body: skills.map((skill, index) => (
        <SkillsSection
          key={`${skill.name}-${index}`}
          skill={skill}
          isLast={index === skills.length - 1}
          styles={styles}
        />
      )),
    };
  }

  if (!sectionVisibility?.work) {
    sectionContent[SectionTypes.Work] = {
      title: SECTION_TITLES[SectionTypes.Work],
      body: work.map((item, index) => (
        <WorkExperience
          key={`${item.name}-${index}`}
          work={item}
          isLast={index === work.length - 1}
          styles={styles}
        />
      )),
    };
  }

  if (!sectionVisibility?.education) {
    sectionContent[SectionTypes.Education] = {
      title: SECTION_TITLES[SectionTypes.Education],
      body: education.map((item, index) => (
        <EducationSection
          key={`${item.institution}-${index}`}
          education={item}
          isLast={index === education.length - 1}
          styles={styles}
        />
      )),
    };
  }

  if (!sectionVisibility?.projects) {
    sectionContent[SectionTypes.Projects] = {
      title: SECTION_TITLES[SectionTypes.Projects],
      body: projects.map((item, index) => (
        <ProjectSection
          key={`${item.name}-${index}`}
          project={item}
          isLast={index === projects.length - 1}
          styles={styles}
        />
      )),
    };
  }

  const sections = resolveSectionOrder(resume.sectionOrder)
    .map((type) => sectionContent[type])
    .filter((section): section is { title: string; body: ReactNode } =>
      Boolean(section)
    );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
          <View style={styles.headerRule} />
        </View>

        {sections.map((section) => (
          <Section key={section.title} title={section.title} styles={styles}>
            {section.body}
          </Section>
        ))}
      </Page>
    </Document>
  );
};

export default AriaTemplate;
