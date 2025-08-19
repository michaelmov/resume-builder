import {
  Box,
  Button,
  Input,
  Field,
} from '@chakra-ui/react';
import { FC } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { SectionTypes, Skill } from '../../../types/resume.model';
import { EditorSection, EditorSubsection } from '../editor-sections';
import { HiPlus } from 'react-icons/hi';
import { KeywordInput } from './keyword-input';

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
  const { fields, append, remove, move } = useFieldArray(
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
            onClick={addSkill}
            width="100%"
            size="sm"
            variant="subtle"
            colorPalette="gray"
          >
            <HiPlus />
            Add Skill
          </Button>
        </Box>
      </Box>
    </EditorSection>
  );
};
