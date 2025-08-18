import {
  Box,
  Button,
  Icon,
  Input,
  Tag,
  TagLabel,
  CloseButton,
  Field,
} from '@chakra-ui/react';
import { FC, KeyboardEvent } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { SectionTypes, Skill } from '../../types/resume.model';
import { EditorSection, EditorSubsection } from './editor-sections';
import { HiPlus } from 'react-icons/hi';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface SkillsSectionProps {
  value: Skill[];
  onUpdate: (sectionType: SectionTypes, section: Skill[]) => void;
}

interface FormProps {
  name: string;
  skills: Skill[];
}
export const SkillsSection: FC<SkillsSectionProps> = ({ value, onUpdate }) => {
  const { control, register, formState, handleSubmit, reset } =
    useForm<FormProps>({
      mode: 'onChange',
      defaultValues: {
        name: 'skills',
        skills: value,
      },
    });
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control,
      name: 'skills',
    }
  );

  const { isDirty } = formState;

  const onSubmit = (data: FormProps) => {
    onUpdate(SectionTypes.Skills, data.skills);
    reset(data);
  };

  const addSkill = () => {
    const newSkill = {
      name: '',
      level: '',
      keywords: [],
    } as Skill;

    append(newSkill);
  };

  return (
    <EditorSection
      title="Skills"
      onSaveClick={handleSubmit(onSubmit)}
      saveIsDisabled={!isDirty}
    >
      <Box>
        {fields.map((field: any, index: number) => {
          return (
            <EditorSubsection
              onDeleteClick={() => remove(index)}
              mb={6}
              key={field.id}
              onMoveUpClick={() => move(index, index - 1)}
              onMoveDownClick={() => move(index, index + 1)}
              moveUpDisabled={index === 0}
              moveDownDisabled={index >= fields.length - 1}
            >
              <Field.Root id={field.id} mb={4}>
                <Field.Label display="inline-block">
                  Skill name
                </Field.Label>
                <Input
                  type="text"
                  {...register(`skills.${index}.name`)}
                />
              </Field.Root>
              <KeywordInput skillIndex={index} control={control} />
            </EditorSubsection>
          );
        })}
        <Box display="flex" justifyContent="center">
          <Button
            leftIcon={<Icon as={HiPlus} />}
            onClick={addSkill}
            width="100%"
            size="sm"
          >
            Add Skill
          </Button>
        </Box>
      </Box>
    </EditorSection>
  );
};

interface KeywordItem {
  id: string;
  value: string;
}

interface SortableKeywordTagProps extends KeywordItem {
  idx: number;
  onRemove: (index: number) => void;
}

const SortableKeywordTag: FC<SortableKeywordTagProps> = ({ value, id, onRemove, idx }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Tag.Root 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      mr={2} 
      mb={2} 
      cursor="move"
    >
      <Tag.Label>{value}</Tag.Label>
      <Tag.EndElement>
        <Tag.CloseTrigger onClick={() => onRemove(idx)} />
      </Tag.EndElement>
    </Tag.Root>
    
    
  );
};

const SortableKeywordTagContainer: FC<{
  keywords: KeywordItem[];
  onRemove: (index: number) => void;
}> = ({ keywords, onRemove }) => {
  return (
    <SortableContext items={keywords.map(k => k.id)} strategy={verticalListSortingStrategy}>
      <Box>
        {keywords.map((keyword, index) => {
          return (
            <SortableKeywordTag
              key={keyword.id}
              value={keyword.value}
              id={keyword.id}
              onRemove={onRemove}
              idx={index}
            />
          );
        })}
      </Box>
    </SortableContext>
  );
};
interface KeywordInputProps {
  skillIndex: number;
  control: any;
}
const KeywordInput: FC<KeywordInputProps> = ({ skillIndex, control }) => {
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
