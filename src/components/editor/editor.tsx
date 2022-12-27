import { Box, Button, Heading, Link, Stack } from '@chakra-ui/react';
import { FC } from 'react';
import { useResume } from '../../hooks/useResume';
import {
  Basics,
  Education,
  SectionTypes,
  Skill,
  Work,
} from '../../models/resume.model';
import { BasicsSection } from './basics-section';
import { SkillsSection } from './skills-section';
import { WorkSection } from './work-section';

export const Editor: FC = () => {
  const { resume, updateBasics, updateSkills, updateWork } = useResume();

  const onSectionUpdate = (
    sectionType: SectionTypes,
    section: Basics | Skill[] | Education[] | Work[]
  ) => {
    switch (sectionType) {
      case SectionTypes.Basics:
        updateBasics(section as Basics);
        break;
      case SectionTypes.Skills:
        updateSkills(section as Skill[]);
        break;
      case SectionTypes.Work:
        updateWork(section as Work[]);
      default:
        break;
    }
  };

  return (
    <Stack width="100%" position="relative" p={6} gap={8}>
      <Heading as="h3" fontSize="medium" textAlign="center" fontWeight="normal">
        Made with 💜 by{' '}
        <Link
          href="https://michaelmovsesov.com/"
          isExternal
          textDecoration="underline"
        >
          Michael Movsesov
        </Link>
      </Heading>
      <BasicsSection value={resume.basics} onUpdate={onSectionUpdate} />
      <SkillsSection value={resume.skills} onUpdate={onSectionUpdate} />
      <WorkSection value={resume.work} onUpdate={onSectionUpdate} />
    </Stack>
  );
};
