import { Box, Button, Input, Field } from '@chakra-ui/react';
import { FC, useEffect, useCallback } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { HiPlus } from 'react-icons/hi';

import { useGlobalForm } from '../../../context/GlobalFormContext';
import { useResume } from '../../../hooks/useResume';
import { SectionTypes, Skill } from '../../../types/resume.model';
import { EditorSection, EditorSubsection } from '../EditorSection';

import { KeywordInput } from './KeywordInput';

interface SkillsSectionProps {
  value: Skill[];
  onUpdate: (sectionType: SectionTypes, section: Skill[]) => void;
}

interface FormProps {
  name: string;
  skills: Skill[];
}

export const SkillsSection: FC<SkillsSectionProps> = ({ value, onUpdate }) => {
  const { resume, updateSectionVisibility } = useResume();
  const { control, register, formState, handleSubmit, reset } =
    useForm<FormProps>({
      mode: 'onChange',
      defaultValues: {
        name: 'skills',
        skills: value,
      },
    });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'skills',
  });
  const { registerSection, unregisterSection } = useGlobalForm();

  const { isDirty } = formState;

  const onSubmit = useCallback(
    (data: FormProps) => {
      onUpdate(SectionTypes.Skills, data.skills);
      reset(data);
    },
    [onUpdate, reset]
  );

  // Register this section with the global form context
  useEffect(() => {
    registerSection(SectionTypes.Skills, {
      isDirty,
      handleSubmit: handleSubmit(onSubmit),
    });

    return () => unregisterSection(SectionTypes.Skills);
  }, [isDirty, registerSection, unregisterSection, handleSubmit, onSubmit]);

  const addSkill = () => {
    const newSkill = {
      name: '',
      level: '',
      keywords: [],
    } as Skill;

    append(newSkill);
  };

  const handleHiddenChange = useCallback(
    (isHidden: boolean) => {
      const currentVisibility = resume.sectionVisibility || {};
      updateSectionVisibility({
        ...currentVisibility,
        [SectionTypes.Skills]: isHidden,
      });
    },
    [resume.sectionVisibility, updateSectionVisibility]
  );

  return (
    <EditorSection
      title="Skills"
      isHidden={resume.sectionVisibility?.[SectionTypes.Skills] || false}
      onHiddenChange={handleHiddenChange}
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
                <Field.Label display="inline-block">Skill name</Field.Label>
                <Input type="text" {...register(`skills.${index}.name`)} />
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
