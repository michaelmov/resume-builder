import { Tag } from '@chakra-ui/react';
import { FC } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KeywordItem {
  id: string;
  value: string;
}

interface SortableKeywordTagProps extends KeywordItem {
  idx: number;
  onRemove: (index: number) => void;
}

export const SortableKeywordTag: FC<SortableKeywordTagProps> = ({ value, id, onRemove, idx }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(idx);
  };

  return (
    <Tag.Root 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
    >
      <Tag.Label 
        {...listeners}
        cursor="move"
        flex="1"
      >
        {value}
      </Tag.Label>
      <Tag.EndElement>
        <Tag.CloseTrigger 
          onClick={handleCloseClick}
          zIndex={2}
          position="relative"
          cursor="pointer"
          _hover={{
            backgroundColor: 'gray.200',
          }}
        />
      </Tag.EndElement>
    </Tag.Root>
  );
};

export type { SortableKeywordTagProps, KeywordItem };
