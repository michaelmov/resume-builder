import { Heading, Link, Stack } from '@chakra-ui/react';
import { FC, useCallback } from 'react';

import { GlobalFormProvider } from '../../context/GlobalFormContext';
import { useResume } from '../../hooks/useResume';
import {
  Basics,
  Education,
  Project,
  SectionTypes,
  Skill,
  Work,
} from '../../types/resume.model';
import { GlobalActionBar } from '../GlobalActionBar';

import { BasicsSection } from './BasicsSection';
import { EducationSection } from './EducationSection';
import { ProjectsSection } from './ProjectsSection';
import { SkillsSection } from './SkillsSection/SkillsSection';
import { WorkSection } from './WorkSection';

export const Editor: FC = () => {
  const { resume, updateBasics, updateSkills, updateWork, updateEducation, updateProjects } =
    useResume();

  const onSectionUpdate = useCallback(
    (
      sectionType: SectionTypes,
      section: Basics | Skill[] | Education[] | Work[] | Project[]
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
        case SectionTypes.Projects:
          updateProjects(section as Project[]);
          break;
        default:
          break;
      }
    },
[updateBasics, updateSkills, updateWork, updateEducation, updateProjects]
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
        <ProjectsSection value={resume.projects} onUpdate={onSectionUpdate} />
        <GlobalActionBar />
      </Stack>
    </GlobalFormProvider>
  );
};
