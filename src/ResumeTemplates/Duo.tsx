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

import { Education, Project, Resume, Skill, Work } from '../types/resume.model';
import { formatDate } from '../utils/date-utilities';

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
  primary: '#dbeafe',
  primaryDark: '#bfdbfe',
  secondaryDark: '#3f3f46',
  secondaryLight: '#a1a1aa',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
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
    backgroundColor: colors.primary,
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
    backgroundColor: colors.primary,
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
  workExperienceHighlights: {
    marginTop: 8,
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
    borderColor: colors.primaryDark,
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
  projectHighlights: {
    marginTop: 8,
  },
  projectHighlight: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 6,
  },
});

const ArrowSmRight = ({
  width = 16,
  height = 16,
  color = colors.primaryDark,
}: {
  width?: number;
  height?: number;
  color?: string;
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
}: {
  title: string;
  underlineWidth?: number | string;
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

const SkillsSection = ({ skill }: { skill: Skill }) => {
  return (
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
  );
};

const WorkExperience = ({ work }: { work: Work }) => {
  const startDate = formatDate(work.startDate);
  const endDate = formatDate(work.endDate) || 'Present';

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={styles.workExperienceHeading}>
        <Text style={styles.workExperienceName}>{work.name}</Text>
        <Text style={styles.textLight}>{work.position}</Text>
        <Text style={styles.textLight}>
          {startDate} - {endDate}
        </Text>
      </View>
      {work.summary && (
        <View style={styles.workExperienceSummary}>
          <Text>{work.summary}</Text>
        </View>
      )}
      <View style={styles.workExperienceHighlights}>
        {work?.highlights?.map((highlight, index) => (
          <View key={index} style={styles.workExperienceHighlight}>
            <ArrowSmRight color={colors.primaryDark} />
            <Text style={{ marginLeft: 2 }}>{highlight.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const EducationSection = ({ education }: { education: Education }) => {
  return (
    <View style={{ ...styles.educationWrap, marginBottom: 14 }}>
      <Text style={styles.workExperienceName}>{education.institution}</Text>
      <Text style={styles.textLight}>{education.area}</Text>
      <Text style={styles.textLight}>
        {formatDate(education.startDate)} - {formatDate(education.endDate)}
      </Text>
    </View>
  );
};

const ProjectSection = ({ project }: { project: Project }) => {
  const startDate = formatDate(project.startDate);
  const endDate = formatDate(project.endDate) || 'Present';

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={styles.projectHeading}>
        <Text style={styles.projectName}>{project.name}</Text>
        <Text style={styles.textLight}>{project.type}</Text>
        <Text style={styles.textLight}>
          {startDate} - {endDate}
        </Text>
      </View>
      {project.description && (
        <View style={styles.projectDescription}>
          <Text>{project.description}</Text>
        </View>
      )}
      <View style={styles.projectHighlights}>
        {project?.highlights?.map((highlight, index) => (
          <View key={index} style={styles.projectHighlight}>
            <ArrowSmRight color={colors.primaryDark} />
            <Text style={{ marginLeft: 2 }}>{highlight}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const DuoTemplate = ({ resume }: { resume: Resume }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
            src={resume.basics?.url}
            style={{ color: colors.secondaryLight, textDecoration: 'none' }}
          >
            {resume.basics?.url}
          </Link>
        </View>
        <View style={styles.summary}>
          <Text>{resume.basics?.summary}</Text>
        </View>
        <SectionTitle title="Skills" />
        {resume.skills.map((skill, index) => {
          return <SkillsSection key={`${skill.name}-${index}`} skill={skill} />;
        })}
        <SectionTitle title="Work Experience" />
        {resume.work.map((work, index) => (
          <WorkExperience key={`${work.name}-${index}`} work={work} />
        ))}
        <SectionTitle title="Education" />
        {resume.education.map((education, index) => (
          <EducationSection
            key={`${education.institution}-${index}`}
            education={education}
          />
        ))}
        <SectionTitle title="Projects" />
        {resume.projects.map((project, index) => (
          <ProjectSection key={`${project.name}-${index}`} project={project} />
        ))}
      </Page>
    </Document>
  );
};

export default DuoTemplate;
