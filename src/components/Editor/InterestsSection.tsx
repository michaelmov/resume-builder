import { Box, Button, Input, Field } from '@chakra-ui/react';
import { FC, useEffect, useCallback } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { HiPlus } from 'react-icons/hi';

import { useGlobalForm } from '../../context/GlobalFormContext';
import { Interest, SECTION_TITLES, SectionTypes } from '../../types/resume.model';

import { EditorSection } from './EditorSection';
import { EditorSubsection } from './EditorSubsection';
import { KeywordInput } from './SkillsSection/KeywordInput';

interface InterestsSectionProps {
  value: Interest[];
  onUpdate: (sectionType: SectionTypes, section: Interest[]) => void;
}

interface FormProps {
  interests: Interest[];
}

export const InterestsSection: FC<InterestsSectionProps> = ({
  value,
  onUpdate,
}) => {
  const { control, register, formState, handleSubmit, reset } =
    useForm<FormProps>({
      mode: 'onChange',
      defaultValues: { interests: value },
    });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'interests',
  });
  const { registerSection, unregisterSection } = useGlobalForm();

  const { isDirty } = formState;

  const onSubmit = useCallback(
    (data: FormProps) => {
      onUpdate(SectionTypes.Interests, data.interests);
      reset(data);
    },
    [onUpdate, reset]
  );

  useEffect(() => {
    registerSection(SectionTypes.Interests, {
      isDirty,
      handleSubmit: handleSubmit(onSubmit),
      reset: () => reset(),
    });

    return () => unregisterSection(SectionTypes.Interests);
  }, [
    isDirty,
    registerSection,
    unregisterSection,
    handleSubmit,
    onSubmit,
    reset,
  ]);

  const addInterest = () => {
    append({ name: '', keywords: [] } as Interest);
  };

  return (
    <EditorSection
      id={SectionTypes.Interests}
      title={SECTION_TITLES[SectionTypes.Interests]}
    >
      <Box>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {fields.map((field: any, index: number) => (
          <EditorSubsection
            title={field.name}
            onDeleteClick={() => remove(index)}
            mb={6}
            key={field.id}
            onMoveUpClick={() => move(index, index - 1)}
            onMoveDownClick={() => move(index, index + 1)}
            moveUpDisabled={index === 0}
            moveDownDisabled={index >= fields.length - 1}
          >
            <Field.Root id={field.id} mb={4}>
              <Field.Label display="inline-block">Interest name</Field.Label>
              <Input type="text" {...register(`interests.${index}.name`)} />
            </Field.Root>
            <KeywordInput name={`interests.${index}.keywords`} control={control} />
          </EditorSubsection>
        ))}
        <Box display="flex" justifyContent="center">
          <Button
            onClick={addInterest}
            width="100%"
            size="sm"
            variant="subtle"
            colorPalette="gray"
          >
            <HiPlus />
            Add Interest
          </Button>
        </Box>
      </Box>
    </EditorSection>
  );
};
