import { Box, Button, Grid, GridItem, Input, Field } from '@chakra-ui/react';
import { FC } from 'react';
import { FieldArrayWithId, useFieldArray, useForm } from 'react-hook-form';
import { HiPlus } from 'react-icons/hi';

import { useAutoCommitSection } from '../../hooks/useAutoCommitSection';
import { SECTION_TITLES, SectionTypes, Education } from '../../types/resume.model';

import { DateField } from './DateField';
import { EditorSection } from './EditorSection';
import { EditorSubsection } from './EditorSubsection';

interface EducationSectionProps {
  value: Education[];
  onUpdate: (sectionType: SectionTypes, section: Education[]) => void;
}

interface FormProps {
  name: string;
  education: Education[];
}

export const EducationSection: FC<EducationSectionProps> = ({
  value,
  onUpdate,
}) => {
  const { control, register, reset, watch, getValues } = useForm<FormProps>({
    defaultValues: {
      name: 'education',
      education: value,
    },
  });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'education',
  });

  const { onBlur } = useAutoCommitSection({
    watch,
    reset,
    getValues,
    value,
    toFormValues: (education) => ({ name: 'education', education }),
    fromFormValues: (formValues) => formValues.education,
    commit: (education) => onUpdate(SectionTypes.Education, education),
  });

  const addEducation = () => {
    const newEducation = {
      institution: '',
      url: '',
      area: '',
      studyType: '',
      startDate: '',
      endDate: '',
      score: '',
      courses: [],
    } as Education;

    append(newEducation);
  };

  return (
    <EditorSection
      id={SectionTypes.Education}
      title={SECTION_TITLES[SectionTypes.Education]}
      onBlur={onBlur}
    >
      <Box>
        {fields.map(
          (field: FieldArrayWithId<FormProps, 'education'>, index: number) => {
            return (
              <EditorSubsection
                title={field.institution}
                subtitle={field.area}
                entryLabel="education entry"
                onDeleteClick={() => remove(index)}
                mb={6}
                key={field.id}
                onMoveUpClick={() => move(index, index - 1)}
                onMoveDownClick={() => move(index, index + 1)}
                moveUpDisabled={index === 0}
                moveDownDisabled={index >= fields.length - 1}
              >
                <Grid templateColumns="repeat(2, 1fr)" rowGap={4} columnGap={2}>
                  <GridItem colSpan={1}>
                    <Field.Root id={`${field.id}-institution`}>
                      <Field.Label>Institution</Field.Label>
                      <Input
                        type="text"
                        {...register(`education.${index}.institution`)}
                      />
                    </Field.Root>
                  </GridItem>
                  <GridItem colSpan={1}>
                    <Field.Root id={`${field.id}-area`}>
                      <Field.Label>Area of Study</Field.Label>
                      <Input
                        type="text"
                        {...register(`education.${index}.area`)}
                      />
                    </Field.Root>
                  </GridItem>
                  <GridItem colSpan={1}>
                    <Field.Root id={`${field.id}-studyType`}>
                      <Field.Label>Study Type</Field.Label>
                      <Input
                        type="text"
                        placeholder="e.g. Bachelor's, Master's, PhD"
                        {...register(`education.${index}.studyType`)}
                      />
                    </Field.Root>
                  </GridItem>
                  <GridItem colSpan={1}>
                    <Field.Root id={`${field.id}-score`}>
                      <Field.Label>GPA/Score</Field.Label>
                      <Input
                        type="text"
                        placeholder="e.g. 3.8/4.0, 85%"
                        {...register(`education.${index}.score`)}
                      />
                    </Field.Root>
                  </GridItem>
                  <GridItem colSpan={1}>
                    <DateField
                      control={control}
                      name={`education.${index}.startDate`}
                      label="Start Date"
                      id={`${field.id}-startDate`}
                    />
                  </GridItem>
                  <GridItem colSpan={1}>
                    <DateField
                      control={control}
                      name={`education.${index}.endDate`}
                      label="End Date"
                      id={`${field.id}-endDate`}
                    />
                  </GridItem>
                  <GridItem colSpan={2}>
                    <Field.Root id={`${field.id}-url`}>
                      <Field.Label>Institution URL</Field.Label>
                      <Input
                        type="url"
                        placeholder="https://example.edu"
                        {...register(`education.${index}.url`)}
                      />
                    </Field.Root>
                  </GridItem>
                </Grid>
              </EditorSubsection>
            );
          }
        )}
        <Box display="flex" justifyContent="center">
          <Button
            onClick={addEducation}
            width="100%"
            size="sm"
            variant="subtle"
            colorPalette="gray"
          >
            <HiPlus />
            Add Education
          </Button>
        </Box>
      </Box>
    </EditorSection>
  );
};
