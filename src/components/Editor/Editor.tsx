import { Heading, Link, Stack } from '@chakra-ui/react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FC, ReactNode, useCallback, useMemo, useState } from 'react';

import { SectionData } from '../../context/ResumeContext/ResumeReducer';
import { useResume } from '../../hooks/useResume';
import {
  getSectionTitle,
  normalizeSectionTitles,
  resolveSectionOrder,
  SectionTitles,
  SectionTypes,
} from '../../types/resume.model';

import { AddSectionMenu } from './AddSectionMenu';
import { BasicsSection } from './BasicsSection';
import { EducationSection } from './EducationSection';
import { InterestsSection } from './InterestsSection';
import {
  AwardsSection,
  CertificatesSection,
  LanguagesSection,
  PublicationsSection,
  ReferencesSection,
  VolunteerSection,
} from './NewSections';
import { OpenSectionProvider } from './OpenSectionContext';
import { OpenSubsectionProvider } from './OpenSubsectionContext';
import { ProjectsSection } from './ProjectsSection';
import { SectionActionsProvider } from './SectionActionsContext';
import { SkillsSection } from './SkillsSection/SkillsSection';
import { SectionDraggingProvider, SortableSection } from './SortableSection';
import { WorkSection } from './WorkSection';

export const Editor: FC = () => {
  const { resume, updateSectionData, updateSectionOrder, updateSectionTitles } =
    useResume();

  const onSectionUpdate = useCallback(
    (sectionType: SectionTypes, data: SectionData) => {
      updateSectionData(sectionType, data);
    },
    [updateSectionData]
  );

  const [isDraggingSection, setIsDraggingSection] = useState(false);

  // The active set + order lives in the resume; adds, removes, and reorders all
  // commit straight to the store (auto-save), so there is no staging buffer and
  // no "Save All / Discard" step.
  const order = useMemo(
    () => resolveSectionOrder(resume.sectionOrder),
    [resume.sectionOrder]
  );

  const committedTitles = resume.sectionTitles;

  const commitTitles = useCallback(
    (titles: SectionTitles) => {
      const normalized = normalizeSectionTitles(titles);
      updateSectionTitles(
        Object.keys(normalized).length > 0 ? normalized : undefined
      );
    },
    [updateSectionTitles]
  );

  const handleAddSection = useCallback(
    (section: SectionTypes) => {
      if (order.includes(section)) {
        return;
      }
      updateSectionOrder([...order, section]);
    },
    [order, updateSectionOrder]
  );

  const handleRemoveSection = useCallback(
    (section: SectionTypes) => {
      if (!order.includes(section)) {
        return;
      }
      updateSectionOrder(order.filter((type) => type !== section));
      // Remove is a permanent delete: wipe the section's data...
      updateSectionData(section, [] as SectionData);
      // ...and drop any custom title so a re-added section returns to default.
      if (committedTitles && section in committedTitles) {
        const next = { ...committedTitles };
        delete next[section];
        commitTitles(next);
      }
    },
    [
      order,
      committedTitles,
      updateSectionOrder,
      updateSectionData,
      commitTitles,
    ]
  );

  const handleRenameSection = useCallback(
    (section: SectionTypes, title: string) => {
      commitTitles({ ...(committedTitles ?? {}), [section]: title });
    },
    [committedTitles, commitTitles]
  );

  const getTitle = useCallback(
    (section: SectionTypes) => getSectionTitle(section, committedTitles),
    [committedTitles]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDraggingSection(false);
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = order.indexOf(active.id as SectionTypes);
        const newIndex = order.indexOf(over.id as SectionTypes);
        if (oldIndex === -1 || newIndex === -1) {
          return;
        }
        updateSectionOrder(arrayMove(order, oldIndex, newIndex));
      }
    },
    [order, updateSectionOrder]
  );

  const sectionComponents: Record<SectionTypes, ReactNode> = {
    [SectionTypes.Basics]: (
      <BasicsSection value={resume.basics} onUpdate={onSectionUpdate} />
    ),
    [SectionTypes.Work]: (
      <WorkSection value={resume.work} onUpdate={onSectionUpdate} />
    ),
    [SectionTypes.Volunteer]: (
      <VolunteerSection value={resume.volunteer} onUpdate={onSectionUpdate} />
    ),
    [SectionTypes.Education]: (
      <EducationSection value={resume.education} onUpdate={onSectionUpdate} />
    ),
    [SectionTypes.Awards]: (
      <AwardsSection value={resume.awards} onUpdate={onSectionUpdate} />
    ),
    [SectionTypes.Certificates]: (
      <CertificatesSection
        value={resume.certificates}
        onUpdate={onSectionUpdate}
      />
    ),
    [SectionTypes.Publications]: (
      <PublicationsSection
        value={resume.publications}
        onUpdate={onSectionUpdate}
      />
    ),
    [SectionTypes.Skills]: (
      <SkillsSection value={resume.skills} onUpdate={onSectionUpdate} />
    ),
    [SectionTypes.Languages]: (
      <LanguagesSection value={resume.languages} onUpdate={onSectionUpdate} />
    ),
    [SectionTypes.Interests]: (
      <InterestsSection value={resume.interests} onUpdate={onSectionUpdate} />
    ),
    [SectionTypes.References]: (
      <ReferencesSection value={resume.references} onUpdate={onSectionUpdate} />
    ),
    [SectionTypes.Projects]: (
      <ProjectsSection value={resume.projects} onUpdate={onSectionUpdate} />
    ),
  };

  return (
    <SectionDraggingProvider value={isDraggingSection}>
      <OpenSectionProvider>
        <SectionActionsProvider
          value={{
            removeSection: handleRemoveSection,
            getSectionTitle: getTitle,
            renameSection: handleRenameSection,
          }}
        >
          <Stack width="100%" position="relative" p={6} gap={8}>
            <Heading
              as="h3"
              fontSize="medium"
              textAlign="center"
              fontWeight="normal"
              color="fg.muted"
            >
              Made with ❤️ by{' '}
              <Link
                href="https://michaelmov.dev/"
                target="_blank"
                textDecoration="underline"
                color="brand.fg"
              >
                Michael
              </Link>
            </Heading>
            {sectionComponents[SectionTypes.Basics]}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
              onDragStart={() => setIsDraggingSection(true)}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setIsDraggingSection(false)}
            >
              <SortableContext
                items={order}
                strategy={verticalListSortingStrategy}
              >
                <Stack width="100%" gap={8}>
                  {order.map((sectionType) => (
                    <SortableSection key={sectionType} id={sectionType}>
                      {/* One accordion scope per section: only one of its
                          entries is expanded at a time, and each section keeps
                          track of its own. */}
                      <OpenSubsectionProvider>
                        {sectionComponents[sectionType]}
                      </OpenSubsectionProvider>
                    </SortableSection>
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>
            <AddSectionMenu activeSections={order} onAdd={handleAddSection} />
          </Stack>
        </SectionActionsProvider>
      </OpenSectionProvider>
    </SectionDraggingProvider>
  );
};
