import { Box, Grid, GridItem, Input, Textarea, Field } from '@chakra-ui/react';
import { FC, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';

import { useGlobalForm } from '../../context/GlobalFormContext';
import { useResume } from '../../hooks/useResume';
import { Basics, SectionTypes } from '../../types/resume.model';

import { EditorSection } from './EditorSection';

interface BasicsSectionProps {
  value: Basics;
  onUpdate: (sectionType: SectionTypes, section: Basics) => void;
}
export const BasicsSection: FC<BasicsSectionProps> = ({ value, onUpdate }) => {
  const { resume, updateSectionVisibility } = useResume();
  const { register, handleSubmit, formState, reset } = useForm({
    defaultValues: value,
  });
  const { registerSection, unregisterSection } = useGlobalForm();

  const { isDirty } = formState;

  const onSubmit = useCallback(
    (data: Basics) => {
      onUpdate(SectionTypes.Basics, data);
      reset(data);
    },
    [onUpdate, reset]
  );

  // Register this section with the global form context
  useEffect(() => {
    registerSection(SectionTypes.Basics, {
      isDirty,
      handleSubmit: handleSubmit(onSubmit),
    });

    return () => unregisterSection(SectionTypes.Basics);
  }, [isDirty, registerSection, unregisterSection, handleSubmit, onSubmit]);

  const handleHiddenChange = useCallback(
    (isHidden: boolean) => {
      const currentVisibility = resume.sectionVisibility || {};
      updateSectionVisibility({
        ...currentVisibility,
        [SectionTypes.Basics]: isHidden,
      });
    },
    [resume.sectionVisibility, updateSectionVisibility]
  );

  return (
    <EditorSection
      title="Basics"
      isHidden={resume.sectionVisibility?.[SectionTypes.Basics] || false}
      onHiddenChange={handleHiddenChange}
      enableShowHideToggle={false}
    >
      <Box>
        <Grid templateColumns="repeat(2, 1fr)" rowGap={4} columnGap={2}>
          <GridItem colSpan={1}>
            <Field.Root id="name">
              <Field.Label>Name</Field.Label>
              <Input type="text" {...register('name')} />
            </Field.Root>
          </GridItem>
          <GridItem colSpan={1}>
            <Field.Root id="label">
              <Field.Label>Title</Field.Label>
              <Input type="text" {...register('label')} />
            </Field.Root>
          </GridItem>
          <GridItem colSpan={1}>
            <Field.Root id="city">
              <Field.Label>Location</Field.Label>
              <Input type="text" {...register('location.city')} />
            </Field.Root>
          </GridItem>
          <GridItem colSpan={1}>
            <Field.Root id="phone">
              <Field.Label>Phone</Field.Label>
              <Input type="text" {...register('phone')} />
            </Field.Root>
          </GridItem>
          <GridItem colSpan={1}>
            <Field.Root id="email">
              <Field.Label>Email</Field.Label>
              <Input type="text" {...register('email')} />
            </Field.Root>
          </GridItem>
          <GridItem colSpan={1}>
            <Field.Root id="url">
              <Field.Label>URL</Field.Label>
              <Input type="text" {...register('url')} />
            </Field.Root>
          </GridItem>
          <GridItem colSpan={2}>
            <Field.Root id="summary">
              <Field.Label>Summary</Field.Label>
              <Textarea {...register('summary')} />
            </Field.Root>
          </GridItem>
        </Grid>
      </Box>
    </EditorSection>
  );
};
