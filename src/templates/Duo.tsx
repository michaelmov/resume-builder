import {
  Page,
  View,
  Text,
  Document,
  StyleSheet,
  Font,
  Link,
  Svg,
  Path,
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

Font.register({
  family: 'Roboto Mono',
  src: 'https://fonts.gstatic.com/s/robotomono/v30/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_7PqPQw.ttf',
});

Font.register({
  family: 'Poppins',
  src: 'https://fonts.gstatic.com/s/poppins/v23/pxiEyp8kv8JHgFVrFJA.ttf',
});

Font.register({
  family: 'Poppins Bold',
  src: 'https://fonts.gstatic.com/s/poppins/v23/pxiByp8kv8JHgFVrLGT9V1s.ttf',
});

const colors = {
  secondaryDark: '#3f3f46',
  secondaryLight: '#a1a1aa',
};

const makeStyles = (accent: AccentPalette, marginScale: number) =>
  StyleSheet.create({
    page: {
      padding: 40 * marginScale,
      color: colors.secondaryDark,
      fontSize: 10,
      fontFamily: 'Poppins',
    },
    textLight: {
      color: colors.secondaryLight,
    },
    name: {
      fontFamily: 'Roboto Mono',
      fontSize: 24,
    },
    headingWrap: {
      position: 'relative',
    },
    headingUnderline: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: 15,
      backgroundColor: accent.soft,
    },
    headingLabel: {
      fontFamily: 'Poppins',
      fontSize: 12,
      color: colors.secondaryLight,
      marginTop: 2,
    },
    contactInfo: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 8,
      color: colors.secondaryLight,
    },
    summary: {
      marginTop: 18,
    },
    sectionTitleWrap: {
      display: 'flex',
      position: 'relative',
      width: 'auto',
      marginBottom: 12,
    },
    sectionTitle: {
      fontFamily: 'Roboto Mono',
      fontSize: 16,
      marginTop: 18,
    },
    sectionTitleUnderline: {
      backgroundColor: accent.soft,
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: 8,
    },
    workExperienceHeading: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    workExperienceName: {
      fontFamily: 'Poppins Bold',
    },
    workExperienceSummary: {
      marginTop: 6,
    },
    workExperienceHighlight: {
      display: 'flex',
      flexDirection: 'row',
      marginBottom: 6,
    },
    skillTitle: {
      fontFamily: 'Poppins Bold',
      marginBottom: 4,
    },
    skillKeywords: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    skillKeyword: {
      fontSize: 8,
      borderWidth: 1,
      borderColor: accent.muted,
      borderRadius: 4,
      paddingLeft: 4,
      paddingRight: 4,
    },
    educationWrap: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    projectHeading: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    projectName: {
      fontFamily: 'Poppins Bold',
    },
    projectDescription: {
      marginTop: 6,
    },
    projectHighlight: {
      display: 'flex',
      flexDirection: 'row',
      marginBottom: 6,
    },
  });

type Styles = ReturnType<typeof makeStyles>;

const ArrowSmRight = ({
  width = 16,
  height = 16,
  color,
}: {
  width?: number;
  height?: number;
  color: string;
}) => (
  <Svg viewBox="0 0 24 24" width={width} height={height}>
    <Path
      d="M13 7l5 5m0 0l-5 5m5-5H6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

const SectionTitle = ({
  title,
  underlineWidth = '100%',
  styles,
}: {
  title: string;
  underlineWidth?: number | string;
  styles: Styles;
}) => {
  return (
    <View style={styles.sectionTitleWrap}>
      <View
        style={{ ...styles.sectionTitleUnderline, width: underlineWidth }}
      />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
};

// One bullet row. Work and projects style their rows identically, so the row
// style is passed in rather than picked here.
const HighlightRow = ({
  value,
  style,
  accent,
  first,
}: {
  value: string;
  style: Styles[keyof Styles];
  accent: AccentPalette;
  /** Opens the gap between the entry body and the start of its bullet list. */
  first?: boolean;
}) => (
  // A bullet list may break across pages, but never a single bullet — without
  // this the row splits and leaves its arrow stranded at the foot of the page.
  <View style={first ? { ...style, marginTop: 8 } : style} wrap={false}>
    <ArrowSmRight color={accent.muted} />
    <Text style={{ marginLeft: 2 }}>{value}</Text>
  </View>
);

const SkillsSection = ({
  skill,
  styles,
  leading,
}: {
  skill: Skill;
  styles: Styles;
} & LeadingEntryProps) => {
  return (
    <KeepTogether>
      {leading}
      <View style={{ marginBottom: 14 }}>
        <Text style={styles.skillTitle}>{skill.name}</Text>
        <View style={styles.skillKeywords}>
          {skill.keywords.map((keyword, index) => (
            <View style={styles.skillKeyword} key={`${skill.name}-${index}`}>
              <Text>{keyword.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </KeepTogether>
  );
};

const WorkExperience = ({
  work,
  styles,
  accent,
  leading,
}: {
  work: Work;
  styles: Styles;
  accent: AccentPalette;
} & LeadingEntryProps) => {
  const startDate = formatDate(work.startDate);
  const endDate = (work.isPresent ? 'Present' : formatDate(work.endDate)) || '';
  const { glued, flowing } = splitHighlights(
    work.highlights,
    Boolean(work.summary)
  );

  return (
    <View style={{ marginBottom: 14 }}>
      <KeepTogether>
        {leading}
        <View style={styles.workExperienceHeading}>
          <Text style={styles.workExperienceName}>{work.name}</Text>
          <Text style={styles.textLight}>{work.position}</Text>
          <Text style={styles.textLight}>
            {startDate} - {endDate}
          </Text>
        </View>
        {glued.map((highlight, index) => (
          <HighlightRow
            key={index}
            value={highlight.value}
            style={styles.workExperienceHighlight}
            accent={accent}
            first={index === 0}
          />
        ))}
      </KeepTogether>
      {work.summary && (
        <Text style={styles.workExperienceSummary}>{work.summary}</Text>
      )}
      {flowing.map((highlight, index) => (
        <HighlightRow
          key={index}
          value={highlight.value}
          style={styles.workExperienceHighlight}
          accent={accent}
          first={glued.length === 0 && index === 0}
        />
      ))}
    </View>
  );
};

const EducationSection = ({
  education,
  styles,
  leading,
}: {
  education: Education;
  styles: Styles;
} & LeadingEntryProps) => {
  return (
    <KeepTogether>
      {leading}
      <View style={{ ...styles.educationWrap, marginBottom: 14 }}>
        <Text style={styles.workExperienceName}>{education.institution}</Text>
        <Text style={styles.textLight}>{education.area}</Text>
        <Text style={styles.textLight}>
          {formatDate(education.startDate)} - {formatDate(education.endDate)}
        </Text>
      </View>
    </KeepTogether>
  );
};

const ProjectSection = ({
  project,
  styles,
  accent,
  leading,
}: {
  project: Project;
  styles: Styles;
  accent: AccentPalette;
} & LeadingEntryProps) => {
  const startDate = formatDate(project.startDate);
  const endDate = formatDate(project.endDate) || 'Present';
  const { glued, flowing } = splitHighlights(
    project.highlights,
    Boolean(project.description)
  );

  return (
    <View style={{ marginBottom: 14 }}>
      <KeepTogether>
        {leading}
        <View style={styles.projectHeading}>
          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.textLight}>{project.type}</Text>
          <Text style={styles.textLight}>
            {startDate} - {endDate}
          </Text>
        </View>
        {glued.map((highlight, index) => (
          <HighlightRow
            key={index}
            value={highlight}
            style={styles.projectHighlight}
            accent={accent}
            first={index === 0}
          />
        ))}
      </KeepTogether>
      {project.description && (
        <Text style={styles.projectDescription}>{project.description}</Text>
      )}
      {flowing.map((highlight, index) => (
        <HighlightRow
          key={index}
          value={highlight}
          style={styles.projectHighlight}
          accent={accent}
          first={glued.length === 0 && index === 0}
        />
      ))}
    </View>
  );
};

const SimpleEntry = ({
  title,
  meta,
  dates,
  summary,
  styles,
  leading,
}: {
  title?: string;
  meta?: string;
  dates?: string;
  summary?: string;
  styles: Styles;
} & LeadingEntryProps) => (
  <View style={{ marginBottom: 14 }}>
    <KeepTogether>
      {leading}
      <View style={styles.workExperienceHeading}>
        <Text style={styles.workExperienceName}>{title}</Text>
        {meta ? <Text style={styles.textLight}>{meta}</Text> : null}
        {dates ? <Text style={styles.textLight}>{dates}</Text> : null}
      </View>
    </KeepTogether>
    {summary ? (
      <Text style={styles.workExperienceSummary}>{summary}</Text>
    ) : null}
  </View>
);

const InterestGroup = ({
  interest,
  styles,
  leading,
}: {
  interest: Interest;
  styles: Styles;
} & LeadingEntryProps) => (
  <KeepTogether>
    {leading}
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.skillTitle}>{interest.name}</Text>
      <View style={styles.skillKeywords}>
        {interest.keywords?.map((keyword, index) => (
          <View style={styles.skillKeyword} key={`${keyword.value}-${index}`}>
            <Text>{keyword.value}</Text>
          </View>
        ))}
      </View>
    </View>
  </KeepTogether>
);

const DuoTemplate = ({
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

  // Entries only — the section's title is handed to the first entry at render
  // time (see `withSectionHeading`) so the two cannot be split across a page.
  const sectionContent: Partial<Record<SectionTypes, ReactNode[]>> = {
    [SectionTypes.Skills]: resume.skills.map((skill, index) => (
      <SkillsSection
        key={`${skill.name}-${index}`}
        skill={skill}
        styles={styles}
      />
    )),
    [SectionTypes.Work]: resume.work.map((work, index) => (
      <WorkExperience
        key={`${work.name}-${index}`}
        work={work}
        styles={styles}
        accent={accent}
      />
    )),
    [SectionTypes.Volunteer]: resume.volunteer.map((item, index) => (
      <WorkExperience
        key={`${item.organization}-${index}`}
        work={{ ...item, name: item.organization || item.name } as Work}
        styles={styles}
        accent={accent}
      />
    )),
    [SectionTypes.Education]: resume.education.map((education, index) => (
      <EducationSection
        key={`${education.institution}-${index}`}
        education={education}
        styles={styles}
      />
    )),
    [SectionTypes.Awards]: resume.awards.map((item: Award, index) => (
      <SimpleEntry
        key={`${item.title}-${index}`}
        title={item.title}
        meta={item.awarder}
        dates={formatDate(item.date)}
        summary={item.summary}
        styles={styles}
      />
    )),
    [SectionTypes.Certificates]: resume.certificates.map(
      (item: Certificate, index) => (
        <SimpleEntry
          key={`${item.name}-${index}`}
          title={item.name}
          meta={item.issuer}
          dates={formatDate(item.date)}
          styles={styles}
        />
      )
    ),
    [SectionTypes.Publications]: resume.publications.map(
      (item: Publication, index) => (
        <SimpleEntry
          key={`${item.name}-${index}`}
          title={item.name}
          meta={item.publisher}
          dates={formatDate(item.releaseDate)}
          summary={item.summary}
          styles={styles}
        />
      )
    ),
    [SectionTypes.Languages]: resume.languages.map((item: Language, index) => (
      <SimpleEntry
        key={`${item.language}-${index}`}
        title={item.language}
        meta={item.fluency}
        styles={styles}
      />
    )),
    [SectionTypes.Interests]: resume.interests.map((item: Interest, index) => (
      <InterestGroup
        key={`${item.name}-${index}`}
        interest={item}
        styles={styles}
      />
    )),
    [SectionTypes.References]: resume.references.map(
      (item: Reference, index) => (
        <SimpleEntry
          key={`${item.name}-${index}`}
          title={item.name}
          summary={item.reference}
          styles={styles}
        />
      )
    ),
    [SectionTypes.Projects]: resume.projects.map((project, index) => (
      <ProjectSection
        key={`${project.name}-${index}`}
        project={project}
        styles={styles}
        accent={accent}
      />
    )),
  };

  const orderedSections = resolveSectionOrder(resume.sectionOrder);

  return (
    <Document>
      {/* Key the page by the section order so react-pdf fully re-lays-out the
          page when sections are reordered (otherwise it reuses cached layout
          for the unchanged section blocks and the order appears stale). */}
      <Page size="A4" style={styles.page} key={orderedSections.join('-')}>
        <View style={styles.headingWrap}>
          <View style={styles.headingUnderline} />
          <Text style={styles.name}>{resume.basics?.name}</Text>
        </View>
        <Text style={styles.headingLabel}>
          {resume.basics?.label?.toUpperCase()}
        </Text>
        <View style={styles.contactInfo}>
          <Text>{resume.basics?.location?.city}</Text>
          <Text>{resume.basics?.phone}</Text>
          <Text>{resume.basics?.email}</Text>
          <Link
            src={ensureProtocol(resume.basics?.url)}
            style={{ color: colors.secondaryLight, textDecoration: 'none' }}
          >
            {resume.basics?.url}
          </Link>
        </View>
        <View style={styles.summary}>
          <Text>{resume.basics?.summary}</Text>
        </View>
        {orderedSections.map((sectionType) => (
          <View key={sectionType}>
            {withSectionHeading(
              sectionContent[sectionType] ?? [],
              <SectionTitle
                title={getSectionTitle(sectionType, resume.sectionTitles)}
                styles={styles}
              />
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
};

export default DuoTemplate;
