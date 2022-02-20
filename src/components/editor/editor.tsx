import { Box, Button, Heading, Stack } from '@chakra-ui/react';
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
import { SkillsSection } from './skills-section';

export const Editor: FC = () => {
  const { resume, updateBasics, updateSkills } = useResume();

  const onSectionUpdate = (
    sectionType: SectionTypes,
    section: Basics | Skill[] | Education | Work
  ) => {
    switch (sectionType) {
      case SectionTypes.Basics:
        updateBasics(section as Basics);
        break;
      case SectionTypes.Skills:
        updateSkills(section as Skill[]);
      default:
        break;
    }
  };

  return (
    <Stack width="100%" position="relative" p={6} gap={8}>
      <BasicsSection value={resume.basics} onUpdate={onSectionUpdate} />
      <SkillsSection
        value={resume.skills}
        onUpdate={onSectionUpdate}
      ></SkillsSection>
    </Stack>
  );
};
