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
import { KeyboardEvent } from 'react';
import {
  Control,
  FieldArrayPathByValue,
  FieldValues,
  useFieldArray,
} from 'react-hook-form';

import { SortableKeywordTagContainer } from './SortableKeywordTagContainer';

/**
 * The list this drives, as react-hook-form sees it. Every keyword list in the
 * app is a `{ value: string }[]` (see `Skill.keywords`), but the path to it
 * differs per caller, so the hook is typed against this stand-in and `name`
 * carries the real path at runtime.
 */
interface KeywordsFormView {
  [path: string]: { value: string }[];
}

interface KeywordInputProps<T extends FieldValues> {
  /** Field-array path to the keyword list, e.g. `skills.0.keywords`. */
  name: FieldArrayPathByValue<T, { value: string }[]>;
  control: Control<T>;
}

export function KeywordInput<T extends FieldValues>({
  name,
  control,
}: KeywordInputProps<T>) {
  const { fields, remove, append, move } = useFieldArray<
    KeywordsFormView,
    string,
    'id'
  >({
    control: control as unknown as Control<KeywordsFormView>,
    name,
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
        <SortableKeywordTagContainer keywords={fields} onRemove={remove} />
      </DndContext>
      <Input
        type="text"
        placeholder="Type keyword and press enter to add"
        onKeyDown={handleKeyDown}
      />
    </Box>
  );
}

export type { KeywordInputProps };
