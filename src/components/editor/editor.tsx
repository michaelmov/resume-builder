import { Box, Heading, Link, Portal, Stack } from '@chakra-ui/react';
import { FC, useCallback } from 'react';
import { useResume } from '../../hooks/useResume';
import {
  Basics,
  Education,
  SectionTypes,
  Skill,
  Work,
} from '../../types/resume.model';
import { BasicsSection } from './basics-section';
import { EducationSection } from './education-section';
import { SkillsSection } from './skills-section/skills-section';
import { WorkSection } from './work-section';
import { GlobalFormProvider } from '../../context/global-form.context';
import { GlobalActionBar } from '../global-action-bar';

export const Editor: FC = () => {
  const { resume, updateBasics, updateSkills, updateWork, updateEducation } =
    useResume();

  const onSectionUpdate = useCallback(
    (
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
          break;
        case SectionTypes.Education:
          updateEducation(section as Education[]);
          break;
        default:
          break;
      }
    },
    [updateBasics, updateSkills, updateWork, updateEducation]
  );

  return (
    <GlobalFormProvider>
      <Stack width="100%" position="relative" p={6} gap={8}>
        <Heading
          as="h3"
          fontSize="medium"
          textAlign="center"
          fontWeight="normal"
        >
          Made with 💜 by{' '}
          <Link
            href="https://michaelmovsesov.com/"
            target="_blank"
            textDecoration="underline"
          >
            Michael Movsesov
          </Link>
        </Heading>
        <BasicsSection value={resume.basics} onUpdate={onSectionUpdate} />
        <SkillsSection value={resume.skills} onUpdate={onSectionUpdate} />
        <WorkSection value={resume.work} onUpdate={onSectionUpdate} />
        <EducationSection value={resume.education} onUpdate={onSectionUpdate} />
        <Portal>
          <GlobalActionBar />
        </Portal>
      </Stack>
    </GlobalFormProvider>
  );
};
