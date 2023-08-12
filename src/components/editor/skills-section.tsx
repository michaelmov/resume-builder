import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Icon,
  Input,
  Tag,
  TagLabel,
  TagCloseButton,
} from '@chakra-ui/react';
import { FC, KeyboardEvent } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { SectionTypes, Skill } from '../../types/resume.model';
import { EditorSection, EditorSubsection } from './editor-sections';
import { HiPlus } from 'react-icons/hi';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';

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
      <FormControl>
        {fields.map((field: any, index: number) => {
          return (
            <EditorSubsection mb={6} key={field.id}>
              <Box mb={4}>
                <FormLabel htmlFor={field.id} display="inline-block">
                  Skill name
                </FormLabel>
                <Input
                  id={field.id}
                  type="text"
                  {...register(`skills.${index}.name`)}
                />
              </Box>
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
      </FormControl>
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

const SortableKeywordTag = SortableElement(
  ({ value, id, onRemove, idx }: SortableKeywordTagProps) => {
    return (
      <Tag mr={2} mb={2} key={id} cursor="move">
        <TagLabel>{value}</TagLabel>
        <TagCloseButton borderRadius={4} onClick={() => onRemove(idx)} />
      </Tag>
    );
  }
);

const SortableKeywordTagContainer = SortableContainer(
  ({
    keywords,
    onRemove,
  }: {
    keywords: KeywordItem[];
    onRemove: (index: number) => void;
  }) => {
    return (
      <Box>
        {keywords.map((keyword, index) => {
          return (
            <SortableKeywordTag
              key={keyword.id}
              value={keyword.value}
              id={keyword.id}
              onRemove={onRemove}
              idx={index}
              index={index}
            />
          );
        })}
      </Box>
    );
  }
);
interface KeywordInputProps {
  skillIndex: number;
  control: any;
}
const KeywordInput: FC<KeywordInputProps> = ({ skillIndex, control }) => {
  const { fields, remove, append, move } = useFieldArray({
    control,
    name: `skills[${skillIndex}].keywords`,
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value.trim();
    if (value && e.key === 'Enter') {
      append({ value });
      e.currentTarget.value = '';
    }
  };

  const onSortEnd = ({
    oldIndex,
    newIndex,
  }: {
    oldIndex: number;
    newIndex: number;
  }) => {
    move(oldIndex, newIndex);
  };

  return (
    <Box>
      <FormLabel>Keywords</FormLabel>

      <SortableKeywordTagContainer
        keywords={fields as KeywordItem[]}
        axis="xy"
        onRemove={remove}
        distance={1}
        onSortEnd={onSortEnd}
      />
      <Input
        type="text"
        placeholder="Type keyword and press enter to add"
        onKeyDown={handleKeyDown}
      />
    </Box>
  );
};
