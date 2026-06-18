import { Box } from '@chakra-ui/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  createContext,
  CSSProperties,
  FC,
  ReactNode,
  useContext,
} from 'react';

interface DragHandle {
  setActivatorNodeRef: ReturnType<typeof useSortable>['setActivatorNodeRef'];
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
  isDragging: boolean;
}

const DragHandleContext = createContext<DragHandle | null>(null);

/**
 * Drag handle for the surrounding SortableSection, or null when rendered
 * outside one (e.g. the pinned Basics section). EditorSection reads this to
 * decide whether to show a grip handle.
 */
export const useDragHandle = (): DragHandle | null =>
  useContext(DragHandleContext);

const SectionDraggingContext = createContext(false);

/**
 * True while any main section is being dragged. EditorSection reads this to
 * force every section collapsed during a drag, so the reorder targets stay
 * compact and easy to drop onto.
 */
export const useIsSectionDragging = (): boolean =>
  useContext(SectionDraggingContext);

export const SectionDraggingProvider = SectionDraggingContext.Provider;

interface SortableSectionProps {
  id: string;
  children: ReactNode;
}

export const SortableSection: FC<SortableSectionProps> = ({ id, children }) => {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <DragHandleContext.Provider
      value={{ setActivatorNodeRef, attributes, listeners, isDragging }}
    >
      <Box ref={setNodeRef} style={style} width="100%">
        {children}
      </Box>
    </DragHandleContext.Provider>
  );
};
