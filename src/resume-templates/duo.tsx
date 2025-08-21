import { Resume } from '../types/resume.model';
import {
  Page,
  View,
  Text,
  Document,
  StyleSheet,
  Font,
  Link,
} from '@react-pdf/renderer';

Font.register({
  family: 'Roboto Mono',
  src: 'https://fonts.gstatic.com/s/robotomono/v30/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_7PqPQw.ttf',
});

Font.register({
  family: 'Poppins',
  src: 'https://fonts.gstatic.com/s/poppins/v23/pxiEyp8kv8JHgFVrFJA.ttf',
});

const colors = {
  primary: '#dbeafe',
  secondaryDark: '#3f3f46',
  secondaryLight: '#a1a1aa',
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    color: colors.secondaryDark,
    fontSize: 10,
    fontFamily: 'Poppins',
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
});

const SectionTitle = ({
  title,
  underlineWidth,
}: {
  title: string;
  underlineWidth: number;
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
        <SectionTitle title="Work Experience" underlineWidth={150} />
      </Page>
    </Document>
  );
};

export default DuoTemplate;
