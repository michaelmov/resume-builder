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

// Spectral — a high-contrast literary serif for the masthead and body copy.
Font.register({
  family: 'Spectral',
  fonts: [
    { src: `${FONTS}/spectral/Spectral-Regular.ttf`, fontWeight: 400 },
    { src: `${FONTS}/spectral/Spectral-Medium.ttf`, fontWeight: 500 },
    { src: `${FONTS}/spectral/Spectral-SemiBold.ttf`, fontWeight: 600 },
    { src: `${FONTS}/spectral/Spectral-Bold.ttf`, fontWeight: 700 },
  ],
});

// Barlow — a grotesque sans used only for small uppercase labels and roles.
Font.register({
  family: 'Barlow',
  fonts: [
    { src: `${FONTS}/barlow/Barlow-Regular.ttf`, fontWeight: 400 },
    { src: `${FONTS}/barlow/Barlow-Medium.ttf`, fontWeight: 500 },
    { src: `${FONTS}/barlow/Barlow-SemiBold.ttf`, fontWeight: 600 },
  ],
});

// Barlow Semi Condensed — the condensed "dateline" kicker voice.
Font.register({
  family: 'Barlow Semi Condensed',
  fonts: [
    {
      src: `${FONTS}/barlowsemicondensed/BarlowSemiCondensed-SemiBold.ttf`,
      fontWeight: 600,
    },
  ],
});

const colors = {
  paper: '#ffffff',
  ink: '#211c17',
  muted: '#6f655c',
  faint: '#a79d91',
  rule: '#e4ded3',
};

const makeStyles = (accent: AccentPalette) =>
  StyleSheet.create({
    page: {
      paddingHorizontal: 50,
      paddingTop: 46,
      paddingBottom: 46,
      backgroundColor: colors.paper,
      color: colors.ink,
      fontSize: 10,
      fontFamily: 'Spectral',
      lineHeight: 1.5,
    },

    // Masthead
    kicker: {
      fontFamily: 'Barlow Semi Condensed',
      fontWeight: 600,
      fontSize: 9,
      letterSpacing: 3,
      textTransform: 'uppercase',
      color: accent.strong,
    },
    name: {
      fontFamily: 'Spectral',
      fontWeight: 500,
      fontSize: 31,
      lineHeight: 1.05,
      letterSpacing: -0.5,
      marginTop: 5,
      color: colors.ink,
    },
    ruleThick: {
      marginTop: 14,
      borderBottomWidth: 1.6,
      borderBottomColor: accent.strong,
    },
    ruleThin: {
      marginTop: 1.6,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.ink,
    },
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
      fontFamily: 'Barlow',
      fontWeight: 400,
      fontSize: 9,
      color: colors.muted,
    },
    contactLink: {
      fontFamily: 'Barlow',
      fontWeight: 500,
      fontSize: 9,
      color: accent.strong,
      textDecoration: 'none',
    },
    dot: {
      fontFamily: 'Barlow',
      fontSize: 9,
      color: colors.faint,
      marginHorizontal: 7,
    },
    summary: {
      marginTop: 15,
      fontSize: 10.5,
      lineHeight: 1.55,
      color: colors.ink,
    },

    // Section scaffolding
    section: {
      marginTop: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 13,
    },
    sectionIndex: {
      fontFamily: 'Spectral',
      fontWeight: 500,
      fontSize: 10,
      color: accent.strong,
      marginRight: 8,
    },
    sectionTitle: {
      fontFamily: 'Barlow Semi Condensed',
      fontWeight: 600,
      fontSize: 11,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: colors.ink,
    },
    sectionRule: {
      flex: 1,
      marginLeft: 11,
      marginBottom: 3,
      borderBottomWidth: 0.75,
      borderBottomColor: colors.rule,
    },

    // Entries (work / education / projects)
    entry: {
      marginBottom: 13,
    },
    entryHead: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    entryTitle: {
      fontFamily: 'Spectral',
      fontWeight: 600,
      fontSize: 12,
      color: colors.ink,
      flex: 1,
      paddingRight: 12,
    },
    entryDates: {
      fontFamily: 'Barlow Semi Condensed',
      fontWeight: 600,
      fontSize: 8.5,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.faint,
    },
    entryRole: {
      fontFamily: 'Barlow',
      fontWeight: 500,
      fontSize: 8.5,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: accent.strong,
      marginTop: 3,
    },
    entrySummary: {
      fontSize: 9.5,
      lineHeight: 1.5,
      color: colors.muted,
      marginTop: 5,
    },

    // Highlight bullets
    bulletRow: {
      flexDirection: 'row',
      marginTop: 4,
    },
    bulletMark: {
      width: 8,
      height: 1.2,
      backgroundColor: accent.strong,
      marginTop: 6,
      marginRight: 8,
    },
    bulletText: {
      flex: 1,
      fontSize: 9.5,
      lineHeight: 1.5,
      color: colors.ink,
    },

    // Skills — an index-style definition list
    skillRow: {
      flexDirection: 'row',
      marginBottom: 9,
    },
    skillName: {
      width: '30%',
      paddingRight: 12,
      fontFamily: 'Barlow',
      fontWeight: 600,
      fontSize: 8.5,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.ink,
      marginTop: 1,
    },
    skillKeywords: {
      flex: 1,
      fontSize: 10,
      lineHeight: 1.45,
      color: colors.muted,
    },
  });

type Styles = ReturnType<typeof makeStyles>;

const Highlight = ({ value, styles }: { value: string; styles: Styles }) => (
  <View style={styles.bulletRow}>
    <View style={styles.bulletMark} />
    <Text style={styles.bulletText}>{value}</Text>
  </View>
);

const SectionHeader = ({
  index,
  title,
  styles,
}: {
  index: number;
  title: string;
  styles: Styles;
}) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionIndex}>{String(index).padStart(2, '0')}</Text>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionRule} />
  </View>
);

const SkillsSection = ({ skill, styles }: { skill: Skill; styles: Styles }) => (
  <View style={styles.skillRow}>
    <Text style={styles.skillName}>{skill.name}</Text>
    <Text style={styles.skillKeywords}>
      {skill.keywords.map((keyword) => keyword.value).join('   ·   ')}
    </Text>
  </View>
);

const WorkExperience = ({ work, styles }: { work: Work; styles: Styles }) => {
  const startDate = formatDate(work.startDate);
  const endDate = (work.isPresent ? 'Present' : formatDate(work.endDate)) || '';

  return (
    <View style={styles.entry} wrap={false}>
      <View style={styles.entryHead}>
        <Text style={styles.entryTitle}>{work.name}</Text>
        <Text style={styles.entryDates}>
          {startDate} — {endDate}
        </Text>
      </View>
      {work.position && <Text style={styles.entryRole}>{work.position}</Text>}
      {work.summary && <Text style={styles.entrySummary}>{work.summary}</Text>}
      {work?.highlights?.map((highlight, index) => (
        <Highlight key={index} value={highlight.value} styles={styles} />
      ))}
    </View>
  );
};

const EducationSection = ({
  education,
  styles,
}: {
  education: Education;
  styles: Styles;
}) => {
  const detail = [education.studyType, education.area]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.entry} wrap={false}>
      <View style={styles.entryHead}>
        <Text style={styles.entryTitle}>{education.institution}</Text>
        <Text style={styles.entryDates}>
          {formatDate(education.startDate)} — {formatDate(education.endDate)}
        </Text>
      </View>
      {detail ? <Text style={styles.entryRole}>{detail}</Text> : null}
    </View>
  );
};

const ProjectSection = ({
  project,
  styles,
}: {
  project: Project;
  styles: Styles;
}) => {
  const startDate = formatDate(project.startDate);
  const endDate = formatDate(project.endDate) || 'Present';

  return (
    <View style={styles.entry} wrap={false}>
      <View style={styles.entryHead}>
        <Text style={styles.entryTitle}>{project.name}</Text>
        <Text style={styles.entryDates}>
          {startDate} — {endDate}
        </Text>
      </View>
      {project.type && <Text style={styles.entryRole}>{project.type}</Text>}
      {project.description && (
        <Text style={styles.entrySummary}>{project.description}</Text>
      )}
      {project?.highlights?.map((highlight, index) => (
        <Highlight key={index} value={highlight} styles={styles} />
      ))}
    </View>
  );
};

const LineaTemplate = ({
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

  const sections: { title: string; body: ReactNode }[] = [];

  if (!sectionVisibility?.skills) {
    sections.push({
      title: SECTION_TITLES[SectionTypes.Skills],
      body: skills.map((skill, index) => (
        <SkillsSection
          key={`${skill.name}-${index}`}
          skill={skill}
          styles={styles}
        />
      )),
    });
  }

  if (!sectionVisibility?.work) {
    sections.push({
      title: SECTION_TITLES[SectionTypes.Work],
      body: work.map((item, index) => (
        <WorkExperience
          key={`${item.name}-${index}`}
          work={item}
          styles={styles}
        />
      )),
    });
  }

  if (!sectionVisibility?.education) {
    sections.push({
      title: SECTION_TITLES[SectionTypes.Education],
      body: education.map((item, index) => (
        <EducationSection
          key={`${item.institution}-${index}`}
          education={item}
          styles={styles}
        />
      )),
    });
  }

  if (!sectionVisibility?.projects) {
    sections.push({
      title: SECTION_TITLES[SectionTypes.Projects],
      body: projects.map((item, index) => (
        <ProjectSection
          key={`${item.name}-${index}`}
          project={item}
          styles={styles}
        />
      )),
    });
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          {basics?.label && (
            <Text style={styles.kicker}>{basics.label.toUpperCase()}</Text>
          )}
          <Text style={styles.name}>{basics?.name}</Text>
          <View style={styles.ruleThick} />
          <View style={styles.ruleThin} />
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

        {sections.map((section, index) => (
          <View key={section.title} style={styles.section}>
            <SectionHeader
              index={index + 1}
              title={section.title}
              styles={styles}
            />
            {section.body}
          </View>
        ))}
      </Page>
    </Document>
  );
};

export default LineaTemplate;
