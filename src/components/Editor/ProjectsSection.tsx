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
import { FC, useState, useEffect, useCallback } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  HiChevronDown,
  HiChevronUp,
  HiOutlineTrash,
  HiPlus,
} from 'react-icons/hi';

import { useGlobalForm } from '../../context/GlobalFormContext';
import { SectionTypes, Project } from '../../types/resume.model';

import { EditorSection, EditorSubsection } from './EditorSections';

interface ProjectsSectionProps {
  value: Project[];
  onUpdate: (sectionType: SectionTypes, section: Project[]) => void;
}

interface FormProps {
  name: string;
  projects: Project[];
}

export const ProjectsSection: FC<ProjectsSectionProps> = ({ value, onUpdate }) => {
  const { control, register, formState, handleSubmit, reset } =
    useForm<FormProps>({
      mode: 'onChange',
      defaultValues: {
        name: 'projects',
        projects: value,
      },
    });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'projects',
  });
  const { registerSection, unregisterSection } = useGlobalForm();

  const { isDirty } = formState;

  const onSubmit = useCallback(
    (data: FormProps) => {
      onUpdate(SectionTypes.Projects, data.projects);
      reset(data);
    },
    [onUpdate, reset]
  );

  useEffect(() => {
    registerSection(SectionTypes.Projects, {
      isDirty,
      handleSubmit: handleSubmit(onSubmit),
    });

    return () => unregisterSection(SectionTypes.Projects);
  }, [isDirty, registerSection, unregisterSection, handleSubmit, onSubmit]);

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
    <EditorSection title="Projects">
      <Box>
        {fields.map((field: any, index: number) => {
          return (
            <EditorSubsection
              key={field.id}
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
                    <Input type="text" {...register(`projects.${index}.name`)} />
                  </Field.Root>
                </GridItem>
                <GridItem colSpan={1}>
                  <Field.Root id={`project-type-${field.id}`}>
                    <Field.Label>Type</Field.Label>
                    <Input type="text" {...register(`projects.${index}.type`)} />
                  </Field.Root>
                </GridItem>
                <GridItem colSpan={1}>
                  <Field.Root id={`project-start-${field.id}`}>
                    <Field.Label>Start date</Field.Label>
                    <Input
                      type="date"
                      {...register(`projects.${index}.startDate`)}
                    />
                  </Field.Root>
                </GridItem>
                <GridItem colSpan={1}>
                  <Field.Root id={`project-end-${field.id}`}>
                    <Field.Label>End date</Field.Label>
                    <Input
                      type="date"
                      {...register(`projects.${index}.endDate`)}
                    />
                  </Field.Root>
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