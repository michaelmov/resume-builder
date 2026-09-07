import { Box, SegmentGroup, Stack } from '@chakra-ui/react';
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
import { ReactNode, useCallback, useMemo, useState } from 'react';
import { HiOutlineUser, HiOutlineViewList } from 'react-icons/hi';

import { SectionData } from '../../context/ResumeContext/ResumeReducer';
import { useResume } from '../../hooks/useResume';
import {
  getSectionTitle,
  normalizeSectionTitles,
  resolveSectionOrder,
  SECTION_TITLES,
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

/**
 * The sidebar's two panes. Basics heads every resume and is neither removable
 * nor reorderable, so it gets its own pane rather than sitting above a list it
 * doesn't belong to.
 */
const PROFILE_PANE = 'profile';
const SECTIONS_PANE = 'sections';

/**
 * Horizontal inset of the panes and the sticky switcher above them — they have
 * to agree or the control's edges stop lining up with the cards under it.
 *
 * Tighter below `md` because that is where the editor is the whole screen
 * rather than a 600px-plus sidebar: on a 390px phone this inset and the entry
 * card's are the only chrome between the screen edge and a field, and the
 * two-column field grids then split whatever is left. The breakpoint matches
 * `useIsMobile`, so it flips at the same width the bottom-sheet layout does.
 */
const PANE_PX = { base: 3, md: 6 };

interface EditorProps {
  /**
   * Fires while a section is being dragged to reorder. On mobile the editor
   * lives inside a draggable bottom sheet, and a vertical drag means one thing
   * to dnd-kit and another to the sheet — the sheet listens for this so it can
   * stand down for the duration.
   */
  onSectionDraggingChange?: (isDragging: boolean) => void;
}

export const Editor = ({ onSectionDraggingChange }: EditorProps) => {
  const { resume, updateSectionData, updateSectionOrder, updateSectionTitles } =
    useResume();

  // A segmented control is a radio group — it switches a value, it doesn't own
  // any panels — so which pane is showing is ours to track and ours to render.
  //
  // Open on Sections when the resume already has a name and on Profile when it
  // doesn't: a named resume is one you're coming back to, an unnamed one is
  // fresh and wants its header filled in first. This is a mount-time seed and
  // must stay one — recomputing it from `resume` on each render would yank the
  // pane away the moment someone typed the first letter of a name. It still
  // re-runs per resume, because `ResumeProvider` is keyed by id and opening a
  // different resume remounts this component.
  const [pane, setPane] = useState<string>(() =>
    resume.basics.name?.trim() ? SECTIONS_PANE : PROFILE_PANE
  );

  const onSectionUpdate = useCallback(
    (sectionType: SectionTypes, data: SectionData) => {
      updateSectionData(sectionType, data);
    },
    [updateSectionData]
  );

  const [isDraggingSection, setIsDraggingSection] = useState(false);

  const setDragging = useCallback(
    (isDragging: boolean) => {
      setIsDraggingSection(isDragging);
      onSectionDraggingChange?.(isDragging);
    },
    [onSectionDraggingChange]
  );

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
      setDragging(false);
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
    [order, updateSectionOrder, setDragging]
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
          <Box>
            {/* Sticky so the switcher stays reachable however far down a long
                section list the user has scrolled. `height` matches
                `PreviewNavBar`'s 60px so the two headers line up across the
                divider, and `px` matches the panes' so the control's edges
                line up with the cards under it. */}
            <Box
              position="sticky"
              top={0}
              zIndex="docked"
              display="flex"
              alignItems="center"
              height="60px"
              px={PANE_PX}
              bg="bg.subtle"
            >
              <SegmentGroup.Root
                value={pane}
                onValueChange={({ value }) => setPane(value ?? PROFILE_PANE)}
                colorPalette="brand"
                size="sm"
                width="100%"
              >
                <SegmentGroup.Indicator />
                {/* `flex="1"` splits the sidebar evenly between the two
                    segments; the recipe already centres each one's contents.
                    `_checked` sits on the item rather than the text so the
                    icon picks the accent up too — it inherits
                    `currentColor`. */}
                <SegmentGroup.Item
                  value={PROFILE_PANE}
                  flex="1"
                  cursor="pointer"
                  _checked={{ color: 'brand.fg', fontWeight: 'medium' }}
                >
                  <HiOutlineUser />
                  <SegmentGroup.ItemText>
                    {SECTION_TITLES[SectionTypes.Basics]}
                  </SegmentGroup.ItemText>
                  <SegmentGroup.ItemHiddenInput />
                </SegmentGroup.Item>
                <SegmentGroup.Item
                  value={SECTIONS_PANE}
                  flex="1"
                  cursor="pointer"
                  _checked={{ color: 'brand.fg', fontWeight: 'medium' }}
                >
                  <HiOutlineViewList />
                  <SegmentGroup.ItemText>Sections</SegmentGroup.ItemText>
                  <SegmentGroup.ItemHiddenInput />
                </SegmentGroup.Item>
              </SegmentGroup.Root>
            </Box>

            {/* The inactive pane is hidden, never unmounted. Edits auto-save on
                a debounce, so tearing a pane down on every switch would drop
                whatever hadn't been committed yet. */}
            <Box px={PANE_PX} py={6} hidden={pane !== PROFILE_PANE}>
              {sectionComponents[SectionTypes.Basics]}
            </Box>

            <Box px={PANE_PX} py={6} hidden={pane !== SECTIONS_PANE}>
              <Stack width="100%" position="relative" gap={8}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  measuring={{
                    droppable: { strategy: MeasuringStrategy.Always },
                  }}
                  onDragStart={() => setDragging(true)}
                  onDragEnd={handleDragEnd}
                  onDragCancel={() => setDragging(false)}
                >
                  <SortableContext
                    items={order}
                    strategy={verticalListSortingStrategy}
                  >
                    <Stack width="100%" gap={8}>
                      {order.map((sectionType) => (
                        <SortableSection key={sectionType} id={sectionType}>
                          {/* One accordion scope per section: only one of its
                              entries is expanded at a time, and each section
                              keeps track of its own. */}
                          <OpenSubsectionProvider>
                            {sectionComponents[sectionType]}
                          </OpenSubsectionProvider>
                        </SortableSection>
                      ))}
                    </Stack>
                  </SortableContext>
                </DndContext>
                <AddSectionMenu
                  activeSections={order}
                  onAdd={handleAddSection}
                />
              </Stack>
            </Box>
          </Box>
        </SectionActionsProvider>
      </OpenSectionProvider>
    </SectionDraggingProvider>
  );
};
