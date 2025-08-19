import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  Input,
  Textarea,
  Field,
} from '@chakra-ui/react';
import { FC, useEffect, useState } from 'react';
import { Basics, SectionTypes } from '../../types/resume.model';
import { EditorSection } from './editor-sections';
import { useForm } from 'react-hook-form';

interface BasicsSectionProps {
  value: Basics;
  onUpdate: (sectionType: SectionTypes, section: Basics) => void;
}
export const BasicsSection: FC<BasicsSectionProps> = ({ value, onUpdate }) => {
  const { register, handleSubmit, formState, reset } = useForm({
    defaultValues: value,
  });

  const { isDirty } = formState;

  const onSubmit = (data: Basics) => {
    onUpdate(SectionTypes.Basics, data);
    reset(data);
  };

  return (
    <EditorSection
      title="Basics"
      onSaveClick={handleSubmit(onSubmit)}
      saveIsDisabled={!isDirty}
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
