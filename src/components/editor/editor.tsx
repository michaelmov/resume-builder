import { Box, Button, Heading } from '@chakra-ui/react';
import { FC } from 'react';
import { useResume } from '../../hooks/resume.hook';
import {
  Basics,
  Education,
  SectionTypes,
  Skill,
  Work,
} from '../../models/resume.model';
import { BasicsSection } from './basics-section';

export const Editor: FC = () => {
  const { resume, updateBasics } = useResume();

  const onSectionUpdate = (
    sectionType: SectionTypes,
    section: Basics | Skill | Education | Work
  ) => {
    switch (sectionType) {
      case SectionTypes.Basics:
        updateBasics(section as Basics);
        break;
      default:
        break;
    }
  };

  return (
    <Box width="100%" position="relative" display="flex" p={4}>
      <BasicsSection onUpdate={onSectionUpdate} value={resume.basics} />
    </Box>
  );
};
