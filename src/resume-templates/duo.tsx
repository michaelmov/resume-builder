import { FC } from 'react';
import { Resume } from '../types/resume.model';
import { Page, View, Text, Document } from '@react-pdf/renderer';

interface DuoTemplateProps {
  resume: Resume;
}

const DuoTemplate: FC<DuoTemplateProps> = ({ resume }) => {
  return (
    <Document>
      <Page size="A4">
        <View>
          <Text>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
            quos.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default DuoTemplate;
