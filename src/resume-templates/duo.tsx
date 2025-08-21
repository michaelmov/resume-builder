import { Resume } from '../types/resume.model';
import {
  Page,
  View,
  Text,
  Document,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

Font.register({
  family: 'Roboto Mono',
  src: 'https://fonts.gstatic.com/s/robotomono/v30/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_7PqPQw.ttf',
});

Font.register({
  family: 'Poppins',
  src: 'https://fonts.gstatic.com/s/poppins/v23/pxiEyp8kv8JHgFVrFJA.ttf',
});

const styles = StyleSheet.create({
  page: {
    padding: 50,
    color: '#3f3f46',
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
    backgroundColor: '#dbeafe',
  },
});

const DuoTemplate = ({ resume }: { resume: Resume }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headingWrap}>
          <View style={styles.headingUnderline} />
          <Text style={styles.name}>{resume.basics.name}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default DuoTemplate;
