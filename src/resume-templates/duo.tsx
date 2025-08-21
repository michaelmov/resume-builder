import { FC } from 'react';
import { Resume } from '../types/resume.model';
import { Page, View, Text, Document, StyleSheet } from '@react-pdf/renderer';

interface DuoTemplateProps {
  resume: Resume;
}

const styles = StyleSheet.create({
  page: {
    padding: 50,
  },
});

const DuoTemplate = ({ resume }: DuoTemplateProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text>{resume.basics.name}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default DuoTemplate;
