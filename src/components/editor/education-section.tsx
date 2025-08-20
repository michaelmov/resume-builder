import {
  Box,
  Button,
  Grid,
  GridItem,
  Input,
  Textarea,
  Field,
} from '@chakra-ui/react';
import { FC } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { SectionTypes, Education } from '../../types/resume.model';
import { EditorSection, EditorSubsection } from './editor-sections';
import { HiPlus } from 'react-icons/hi';

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
  const { control, register, formState, handleSubmit, reset } =
    useForm<FormProps>({
      mode: 'onChange',
      defaultValues: {
        name: 'education',
        education: value,
      },
    });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'education',
  });

  const { isDirty } = formState;

  const onSubmit = (data: FormProps) => {
    onUpdate(SectionTypes.Education, data.education);
    reset(data);
  };

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
      title="Education"
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
                  <Field.Root id={`${field.id}-startDate`}>
                    <Field.Label>Start Date</Field.Label>
                    <Input
                      type="date"
                      {...register(`education.${index}.startDate`)}
                    />
                  </Field.Root>
                </GridItem>
                <GridItem colSpan={1}>
                  <Field.Root id={`${field.id}-endDate`}>
                    <Field.Label>End Date</Field.Label>
                    <Input
                      type="date"
                      {...register(`education.${index}.endDate`)}
                    />
                  </Field.Root>
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
        })}
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
