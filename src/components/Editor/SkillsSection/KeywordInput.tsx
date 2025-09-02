import { Box, Input, Field } from '@chakra-ui/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { FC, KeyboardEvent } from 'react';
import { useFieldArray } from 'react-hook-form';

import { KeywordItem } from './SortableKeywordTag';
import { SortableKeywordTagContainer } from './SortableKeywordTagContainer';

interface KeywordInputProps {
  skillIndex: number;
  control: any;
}

export const KeywordInput: FC<KeywordInputProps> = ({
  skillIndex,
  control,
}) => {
  const { fields, remove, append, move } = useFieldArray({
    control,
    name: `skills[${skillIndex}].keywords`,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value.trim();
    if (value && e.key === 'Enter') {
      append({ value });
      e.currentTarget.value = '';
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over?.id);
      move(oldIndex, newIndex);
    }
  };

  return (
    <Box>
      <Field.Root>
        <Field.Label>Keywords</Field.Label>
      </Field.Root>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableKeywordTagContainer
          keywords={fields as KeywordItem[]}
          onRemove={remove}
        />
      </DndContext>
      <Input
        type="text"
        placeholder="Type keyword and press enter to add"
        onKeyDown={handleKeyDown}
      />
    </Box>
  );
};

export type { KeywordInputProps };
