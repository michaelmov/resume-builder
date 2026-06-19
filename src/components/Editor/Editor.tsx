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
import { FC, ReactNode, useCallback, useEffect, useState } from 'react';

import {
  GlobalFormProvider,
  useGlobalForm,
} from '../../context/GlobalFormContext';
import { useResume } from '../../hooks/useResume';
import {
  Basics,
  Education,
  Project,
  resolveSectionOrder,
  SectionTypes,
  Skill,
  Work,
} from '../../types/resume.model';
import { GlobalActionBar } from '../GlobalActionBar';

import { BasicsSection } from './BasicsSection';
import { EducationSection } from './EducationSection';
import { OpenSectionProvider } from './OpenSectionContext';
import { ProjectsSection } from './ProjectsSection';
import { SkillsSection } from './SkillsSection/SkillsSection';
import {
  SectionDraggingProvider,
  SortableSection,
} from './SortableSection';
import { WorkSection } from './WorkSection';

// Registration id for the section-order "pending change" in the global form,
// so a reorder participates in "Save All Changes" like every editable section.
const SECTION_ORDER_FORM_ID = 'sectionOrder';

const ordersEqual = (a: SectionTypes[], b: SectionTypes[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const EditorContent: FC = () => {
  const {
    resume,
    updateBasics,
    updateSkills,
    updateWork,
    updateEducation,
    updateProjects,
    updateSectionOrder,
  } = useResume();
  const { registerSection, unregisterSection } = useGlobalForm();

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

  const [isDraggingSection, setIsDraggingSection] = useState(false);

  // The committed order lives in the resume; reorders are staged locally and
  // only written back on "Save All Changes", mirroring the section forms.
  const committedOrder = resolveSectionOrder(resume.sectionOrder);
  const [pendingOrder, setPendingOrder] = useState<SectionTypes[]>(
    () => committedOrder
  );

  // Re-sync the staged order whenever the committed order changes (on save, or
  // an external update such as a JSON import).
  useEffect(() => {
    setPendingOrder(resolveSectionOrder(resume.sectionOrder));
  }, [resume.sectionOrder]);

  const isOrderDirty = !ordersEqual(pendingOrder, committedOrder);

  // Register the staged order with the global form so it shows up in the
  // unsaved-changes bar and is committed by "Save All Changes".
  useEffect(() => {
    registerSection(SECTION_ORDER_FORM_ID, {
      isDirty: isOrderDirty,
      handleSubmit: () => updateSectionOrder(pendingOrder),
    });

    return () => unregisterSection(SECTION_ORDER_FORM_ID);
  }, [
    isOrderDirty,
    pendingOrder,
    registerSection,
    unregisterSection,
    updateSectionOrder,
  ]);

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
    [SectionTypes.Skills]: (
      <SkillsSection value={resume.skills} onUpdate={onSectionUpdate} />
    ),
    [SectionTypes.Work]: (
      <WorkSection value={resume.work} onUpdate={onSectionUpdate} />
    ),
    [SectionTypes.Education]: (
      <EducationSection value={resume.education} onUpdate={onSectionUpdate} />
    ),
    [SectionTypes.Projects]: (
      <ProjectsSection value={resume.projects} onUpdate={onSectionUpdate} />
    ),
  };

  return (
    <SectionDraggingProvider value={isDraggingSection}>
      <OpenSectionProvider>
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
          <GlobalActionBar />
        </Stack>
      </OpenSectionProvider>
    </SectionDraggingProvider>
  );
};

export const Editor: FC = () => (
  <GlobalFormProvider>
    <EditorContent />
  </GlobalFormProvider>
);
