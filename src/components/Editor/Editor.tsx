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
import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import {
  GlobalFormProvider,
  useGlobalForm,
} from '../../context/GlobalFormContext';
import { SectionData } from '../../context/ResumeContext/ResumeReducer';
import { useResume } from '../../hooks/useResume';
import {
  resolveSectionOrder,
  SectionTypes,
} from '../../types/resume.model';
import { GlobalActionBar } from '../GlobalActionBar';

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
import { ProjectsSection } from './ProjectsSection';
import { SectionActionsProvider } from './SectionActionsContext';
import { SkillsSection } from './SkillsSection/SkillsSection';
import {
  SectionDraggingProvider,
  SortableSection,
} from './SortableSection';
import { WorkSection } from './WorkSection';

// Registration id for the staged section set + order in the global form, so
// adding, removing, and reordering all participate in "Save All Changes".
const SECTION_ORDER_FORM_ID = 'sectionOrder';

const ordersEqual = (a: SectionTypes[], b: SectionTypes[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const EditorContent: FC = () => {
  const { resume, updateSectionData, updateSectionOrder } = useResume();
  const { registerSection, unregisterSection } = useGlobalForm();

  const onSectionUpdate = useCallback(
    (sectionType: SectionTypes, data: SectionData) => {
      updateSectionData(sectionType, data);
    },
    [updateSectionData]
  );

  const [isDraggingSection, setIsDraggingSection] = useState(false);

  // The committed active set + order lives in the resume; adds, removes, and
  // reorders are staged locally and only written back on "Save All Changes",
  // mirroring how each section form stages its field edits.
  const committedOrder = useMemo(
    () => resolveSectionOrder(resume.sectionOrder),
    [resume.sectionOrder]
  );
  const [pendingOrder, setPendingOrder] = useState<SectionTypes[]>(
    () => committedOrder
  );

  // Re-sync the staged order whenever the committed order changes (on save, or
  // an external update such as a JSON import).
  useEffect(() => {
    setPendingOrder(committedOrder);
  }, [committedOrder]);

  const isOrderDirty = !ordersEqual(pendingOrder, committedOrder);

  const handleOrderSubmit = useCallback(() => {
    updateSectionOrder(pendingOrder);
    // "Remove" is a permanent delete: wipe the data of any section that was
    // active but is no longer in the staged set.
    committedOrder.forEach((type) => {
      if (!pendingOrder.includes(type)) {
        updateSectionData(type, [] as SectionData);
      }
    });
  }, [committedOrder, pendingOrder, updateSectionData, updateSectionOrder]);

  // Register the staged set/order with the global form so it shows in the
  // unsaved-changes bar and is committed/discarded alongside the section forms.
  useEffect(() => {
    registerSection(SECTION_ORDER_FORM_ID, {
      isDirty: isOrderDirty,
      handleSubmit: handleOrderSubmit,
      reset: () => setPendingOrder(committedOrder),
    });

    return () => unregisterSection(SECTION_ORDER_FORM_ID);
  }, [
    isOrderDirty,
    committedOrder,
    handleOrderSubmit,
    registerSection,
    unregisterSection,
  ]);

  const handleAddSection = useCallback((section: SectionTypes) => {
    setPendingOrder((prev) =>
      prev.includes(section) ? prev : [...prev, section]
    );
  }, []);

  const handleRemoveSection = useCallback((section: SectionTypes) => {
    setPendingOrder((prev) => prev.filter((type) => type !== section));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setIsDraggingSection(false);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPendingOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as SectionTypes);
        const newIndex = prev.indexOf(over.id as SectionTypes);
        if (oldIndex === -1 || newIndex === -1) {
          return prev;
        }
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

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
        <SectionActionsProvider value={{ removeSection: handleRemoveSection }}>
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
                items={pendingOrder}
                strategy={verticalListSortingStrategy}
              >
                <Stack width="100%" gap={8}>
                  {pendingOrder.map((sectionType) => (
                    <SortableSection key={sectionType} id={sectionType}>
                      {sectionComponents[sectionType]}
                    </SortableSection>
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>
            <AddSectionMenu
              activeSections={pendingOrder}
              onAdd={handleAddSection}
            />
            <GlobalActionBar />
          </Stack>
        </SectionActionsProvider>
      </OpenSectionProvider>
    </SectionDraggingProvider>
  );
};

export const Editor: FC = () => (
  <GlobalFormProvider>
    <EditorContent />
  </GlobalFormProvider>
);
