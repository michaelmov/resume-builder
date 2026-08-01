import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Input,
  Stack,
  Textarea,
  TextareaProps,
  Field,
} from '@chakra-ui/react';
import { FC, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  HiChevronDown,
  HiChevronUp,
  HiOutlineTrash,
  HiPlus,
} from 'react-icons/hi';

import { useAutoCommitSection } from '../../hooks/useAutoCommitSection';
import { SECTION_TITLES, SectionTypes, Project } from '../../types/resume.model';

import { DateField } from './DateField';
import { EditorSection } from './EditorSection';
import { EditorSubsection } from './EditorSubsection';

interface ProjectsSectionProps {
  value: Project[];
  onUpdate: (sectionType: SectionTypes, section: Project[]) => void;
}

interface FormProps {
  name: string;
  projects: Project[];
}

export const ProjectsSection: FC<ProjectsSectionProps> = ({
  value,
  onUpdate,
}) => {
  const { control, register, reset, watch, getValues } = useForm<FormProps>({
    defaultValues: {
      name: 'projects',
      projects: value,
    },
  });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'projects',
  });

  const { onBlur } = useAutoCommitSection({
    watch,
    reset,
    getValues,
    value,
    toFormValues: (projects) => ({ name: 'projects', projects }),
    fromFormValues: (formValues) => formValues.projects,
    commit: (projects) => onUpdate(SectionTypes.Projects, projects),
  });

  const addProject = () => {
    const newProject = {
      name: '',
      description: '',
      highlights: [],
      keywords: [],
      startDate: '2023-01-01',
      endDate: '2024-01-01',
      url: '',
      roles: [],
      entity: '',
      type: 'application',
    } as Project;

    append(newProject);
  };

  return (
    <EditorSection
      id={SectionTypes.Projects}
      title={SECTION_TITLES[SectionTypes.Projects]}
      onBlur={onBlur}
    >
      <Box>
        {fields.map((field: any, index: number) => {
          return (
            <EditorSubsection
              title={field.name}
              subtitle={field.type}
              key={field.id}
              entryLabel="project"
              onDeleteClick={() => remove(index)}
              onMoveUpClick={() => move(index, index - 1)}
              onMoveDownClick={() => move(index, index + 1)}
              moveUpDisabled={index === 0}
              moveDownDisabled={index >= fields.length - 1}
              mb={10}
            >
              <Grid templateColumns="repeat(2, 1fr)" rowGap={4} columnGap={2}>
                <GridItem colSpan={1}>
                  <Field.Root id={`project-name-${field.id}`}>
                    <Field.Label>Project name</Field.Label>
                    <Input
                      type="text"
                      {...register(`projects.${index}.name`)}
                    />
                  </Field.Root>
                </GridItem>
                <GridItem colSpan={1}>
                  <Field.Root id={`project-type-${field.id}`}>
                    <Field.Label>Type</Field.Label>
                    <Input
                      type="text"
                      {...register(`projects.${index}.type`)}
                    />
                  </Field.Root>
                </GridItem>
                <GridItem colSpan={1}>
                  <DateField
                    control={control}
                    name={`projects.${index}.startDate`}
                    label="Start date"
                    id={`project-start-${field.id}`}
                  />
                </GridItem>
                <GridItem colSpan={1}>
                  <DateField
                    control={control}
                    name={`projects.${index}.endDate`}
                    label="End date"
                    id={`project-end-${field.id}`}
                  />
                </GridItem>
                <GridItem colSpan={2}>
                  <Field.Root id={`project-url-${field.id}`}>
                    <Field.Label>URL</Field.Label>
                    <Input type="url" {...register(`projects.${index}.url`)} />
                  </Field.Root>
                </GridItem>
                <GridItem colSpan={2}>
                  <Field.Root id={`project-description-${field.id}`}>
                    <Field.Label>Description</Field.Label>
                    <Textarea {...register(`projects.${index}.description`)} />
                  </Field.Root>
                </GridItem>
                <GridItem colSpan={2}>
                  <HighlightsList
                    projectIndex={index}
                    control={control}
                    register={register}
                  />
                </GridItem>
              </Grid>
            </EditorSubsection>
          );
        })}
        <Box>
          <Button
            onClick={addProject}
            width="100%"
            size="sm"
            variant="subtle"
            colorPalette="gray"
          >
            <HiPlus />
            Add Project
          </Button>
        </Box>
      </Box>
    </EditorSection>
  );
};

interface HighlightsListProps {
  projectIndex: number;
  control: any;
  register: any;
}

const HighlightsList: FC<HighlightsListProps> = ({
  control,
  register,
  projectIndex,
}) => {
  const { fields, remove, append, move } = useFieldArray({
    control,
    name: `projects.[${projectIndex}].highlights`,
  });
  return (
    <Box>
      <Field.Root>
        <Field.Label>Highlights</Field.Label>
      </Field.Root>
      {fields.map((highlight, index) => {
        return (
          <HighlightInput
            key={highlight.id}
            highlight={highlight as HighlightItem}
            index={index}
            projectIndex={projectIndex}
            register={register}
            onMoveUp={(idx) => move(idx, idx - 1)}
            onMoveDown={(idx) => move(idx, idx + 1)}
            onDelete={(idx) => remove(idx)}
            moveUpDisabled={index === 0}
            moveDownDisabled={index >= fields.length - 1}
          />
        );
      })}

      <Button
        mt={4}
        onClick={() => append('')}
        width="100%"
        size="xs"
        variant="subtle"
        colorPalette="gray"
      >
        <HiPlus />
        Add Highlight
      </Button>
    </Box>
  );
};

interface HighlightItem {
  id: string;
  value: string;
}

interface HighlightInputProps extends TextareaProps {
  highlight: HighlightItem;
  index: number;
  projectIndex: number;
  register: any;
  onDelete: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  moveUpDisabled?: boolean;
  moveDownDisabled?: boolean;
}

const HighlightInput: FC<HighlightInputProps> = ({
  highlight,
  index,
  projectIndex,
  register,
  onDelete,
  onMoveUp,
  onMoveDown,
  moveDownDisabled = false,
  moveUpDisabled = false,
}) => {
  const [isActionButtonsVisible, setIsActionButtonsVisible] = useState(false);
  return (
    <Flex
      alignItems="center"
      onMouseOver={() => setIsActionButtonsVisible(true)}
      onMouseLeave={() => setIsActionButtonsVisible(false)}
    >
      <Textarea
        id={highlight.id}
        my={1}
        mr={2}
        rows={3}
        {...register(`projects.${projectIndex}.highlights.${index}`)}
      />
      <Stack
        visibility={isActionButtonsVisible ? 'visible' : 'hidden'}
        gap={0.5}
      >
        <IconButton
          onClick={() => onMoveUp(index)}
          aria-label="Move up"
          size="xs"
          disabled={moveUpDisabled}
          variant="subtle"
        >
          <HiChevronUp />
        </IconButton>
        <IconButton
          onClick={() => onDelete(index)}
          aria-label="Delete highlight"
          size="xs"
          variant="subtle"
        >
          <HiOutlineTrash />
        </IconButton>
        <IconButton
          onClick={() => onMoveDown(index)}
          aria-label="Move down"
          size="xs"
          disabled={moveDownDisabled}
          variant="subtle"
        >
          <HiChevronDown />
        </IconButton>
      </Stack>
    </Flex>
  );
};
