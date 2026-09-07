import { Box, Input, Textarea, Field } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { useAutoCommitSection } from '../../hooks/useAutoCommitSection';
import { Basics, SECTION_TITLES, SectionTypes } from '../../types/resume.model';

import { EditorSection } from './EditorSection';
import { FieldGrid, FieldGridItem } from './FieldGrid';

interface BasicsSectionProps {
  value: Basics;
  onUpdate: (sectionType: SectionTypes, section: Basics) => void;
}
export const BasicsSection = ({ value, onUpdate }: BasicsSectionProps) => {
  const { register, reset, watch, getValues } = useForm<Basics>({
    defaultValues: value,
  });

  const { onBlur } = useAutoCommitSection({
    watch,
    reset,
    getValues,
    value,
    toFormValues: (basics) => basics,
    fromFormValues: (formValues) => formValues,
    commit: (basics) => onUpdate(SectionTypes.Basics, basics),
  });

  return (
    <EditorSection
      id={SectionTypes.Basics}
      title={SECTION_TITLES[SectionTypes.Basics]}
      alwaysOpen
      // The editor's "Profile" pane already names this section.
      hideTitle
      onBlur={onBlur}
    >
      <Box>
        <FieldGrid>
          <FieldGridItem>
            <Field.Root id="name">
              <Field.Label>Name</Field.Label>
              <Input type="text" {...register('name')} />
            </Field.Root>
          </FieldGridItem>
          <FieldGridItem>
            <Field.Root id="label">
              <Field.Label>Title</Field.Label>
              <Input type="text" {...register('label')} />
            </Field.Root>
          </FieldGridItem>
          <FieldGridItem>
            <Field.Root id="city">
              <Field.Label>Location</Field.Label>
              <Input type="text" {...register('location.city')} />
            </Field.Root>
          </FieldGridItem>
          <FieldGridItem>
            <Field.Root id="phone">
              <Field.Label>Phone</Field.Label>
              <Input type="text" {...register('phone')} />
            </Field.Root>
          </FieldGridItem>
          <FieldGridItem>
            <Field.Root id="email">
              <Field.Label>Email</Field.Label>
              <Input type="text" {...register('email')} />
            </Field.Root>
          </FieldGridItem>
          <FieldGridItem>
            <Field.Root id="url">
              <Field.Label>URL</Field.Label>
              <Input type="text" {...register('url')} />
            </Field.Root>
          </FieldGridItem>
          <FieldGridItem full>
            <Field.Root id="summary">
              <Field.Label>Summary</Field.Label>
              <Textarea {...register('summary')} />
            </Field.Root>
          </FieldGridItem>
        </FieldGrid>
      </Box>
    </EditorSection>
  );
};
