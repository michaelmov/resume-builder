import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Textarea,
} from '@chakra-ui/react';
import { FC, useEffect, useState } from 'react';
import { Basics, SectionTypes } from '../../models/resume.model';
import { EditorSection } from './editor-section';
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
      <FormControl>
        <Grid templateColumns="repeat(2, 1fr)" rowGap={4} columnGap={2}>
          <GridItem colSpan={1}>
            <FormLabel htmlFor="name">Name</FormLabel>
            <Input id="name" type="text" {...register('name')} />
          </GridItem>
          <GridItem colSpan={1}>
            <FormLabel htmlFor="label">Title</FormLabel>
            <Input id="label" type="text" {...register('label')} />
          </GridItem>
          <GridItem colSpan={1}>
            <FormLabel htmlFor="city">Location</FormLabel>
            <Input id="city" type="text" {...register('location.city')} />
          </GridItem>
          <GridItem colSpan={1}>
            <FormLabel htmlFor="phone">Phone</FormLabel>
            <Input id="phone" type="text" {...register('phone')} />
          </GridItem>
          <GridItem colSpan={1}>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input id="email" type="text" {...register('email')} />
          </GridItem>
          <GridItem colSpan={1}>
            <FormLabel htmlFor="url">URL</FormLabel>
            <Input id="url" type="text" {...register('url')} />
          </GridItem>
          <GridItem colSpan={2}>
            <FormLabel htmlFor="summary">Summary</FormLabel>
            <Textarea id="summary" {...register('summary')} />
          </GridItem>
        </Grid>
      </FormControl>
    </EditorSection>
  );
};
