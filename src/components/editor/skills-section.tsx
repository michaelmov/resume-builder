import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Tag,
  TagLabel,
  TagCloseButton,
} from '@chakra-ui/react';
import { FC, KeyboardEvent } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { SectionTypes, Skill } from '../../models/resume.model';
import { EditorSection, EditorSubsection } from './editor-sections';
import { HiPlus } from 'react-icons/hi';

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
            <EditorSubsection
              onDeleteClick={() => remove(index)}
              mb={6}
              key={field.id}
            >
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

interface KeywordInputProps {
  skillIndex: number;
  control: any;
}
const KeywordInput: FC<KeywordInputProps> = ({ skillIndex, control }) => {
  const { fields, remove, append } = useFieldArray({
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

  return (
    <Box>
      <FormLabel>Keywords</FormLabel>
      {fields.map((keyword, index) => {
        return (
          <Tag mr={2} mb={2} key={keyword.id}>
            {/* @ts-ignore */}
            <TagLabel>{keyword.value}</TagLabel>
            <TagCloseButton borderRadius={4} onClick={() => remove(index)} />
          </Tag>
        );
      })}
      <Input
        type="text"
        placeholder="Type keyword and press enter to add"
        onKeyDown={handleKeyDown}
      />
    </Box>
  );
};
