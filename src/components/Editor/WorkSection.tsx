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
  Checkbox,
} from '@chakra-ui/react';
import { FC, useState } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import {
  HiChevronDown,
  HiChevronUp,
  HiOutlineTrash,
  HiPlus,
} from 'react-icons/hi';

import { useAutoCommitSection } from '../../hooks/useAutoCommitSection';
import { SECTION_TITLES, SectionTypes, Work } from '../../types/resume.model';

import { DateField } from './DateField';
import { EditorSection } from './EditorSection';
import { EditorSubsection } from './EditorSubsection';

interface WorkSectionProps {
  value: Work[];
  onUpdate: (sectionType: SectionTypes, section: Work[]) => void;
}

interface FormProps {
  name: string;
  work: Work[];
}
export const WorkSection: FC<WorkSectionProps> = ({ value, onUpdate }) => {
  const { control, register, reset, watch, getValues } = useForm<FormProps>({
    defaultValues: {
      name: 'work',
      work: value,
    },
  });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'work',
  });

  const { onBlur } = useAutoCommitSection({
    watch,
    reset,
    getValues,
    value,
    toFormValues: (work) => ({ name: 'work', work }),
    fromFormValues: (formValues) => formValues.work,
    commit: (work) => onUpdate(SectionTypes.Work, work),
  });

  const addWork = () => {
    const newWork = {
      name: '',
      position: '',
      startDate: '2005-02-03',
      endDate: '2008-11-03',
      isPresent: false,
      summary: '',
      organization: '',
      url: '',
      highlights: [],
    } as Work;

    append(newWork);
  };

  return (
    <EditorSection
      id={SectionTypes.Work}
      title={SECTION_TITLES[SectionTypes.Work]}
      onBlur={onBlur}
    >
      <Box>
        {fields.map((field: any, index: number) => {
          return (
            <EditorSubsection
              title={field.name}
              subtitle={field.position}
              key={field.id}
              entryLabel="work entry"
              onDeleteClick={() => remove(index)}
              onMoveUpClick={() => move(index, index - 1)}
              onMoveDownClick={() => move(index, index + 1)}
              moveUpDisabled={index === 0}
              moveDownDisabled={index >= fields.length - 1}
              mb={10}
            >
              <Grid templateColumns="repeat(2, 1fr)" rowGap={4} columnGap={2}>
                <GridItem colSpan={1}>
                  <Field.Root id={`company-${field.id}`}>
                    <Field.Label>Company name</Field.Label>
                    <Input type="text" {...register(`work.${index}.name`)} />
                  </Field.Root>
                </GridItem>
                <GridItem colSpan={1}>
                  <Field.Root id={`title-${field.id}`}>
                    <Field.Label>Title</Field.Label>
                    <Input
                      type="text"
                      {...register(`work.${index}.position`)}
                    />
                  </Field.Root>
                </GridItem>
                <GridItem colSpan={1}>
                  <DateField
                    control={control}
                    name={`work.${index}.startDate`}
                    label="Start date"
                    id={`start-${field.id}`}
                  />
                </GridItem>
                <GridItem colSpan={1}>
                  <DateField
                    control={control}
                    name={`work.${index}.endDate`}
                    label="End date"
                    id={`end-${field.id}`}
                    disabled={!!watch(`work.${index}.isPresent`)}
                  />
                  <Flex justifyContent="flex-end" mt={2}>
                    <Controller
                      name={`work.${index}.isPresent`}
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <Checkbox.Root
                          variant="outline"
                          colorPalette="brand"
                          checked={value}
                          onCheckedChange={(details) =>
                            onChange(details.checked)
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control cursor="pointer" />
                          <Checkbox.Label fontWeight="normal" cursor="pointer">
                            I still work here
                          </Checkbox.Label>
                        </Checkbox.Root>
                      )}
                    />
                  </Flex>
                </GridItem>
                <GridItem colSpan={2}>
                  <Field.Root id={`summary-${field.id}`}>
                    <Field.Label>Summary</Field.Label>
                    <Textarea {...register(`work.${index}.summary`)} />
                  </Field.Root>
                </GridItem>
                <GridItem colSpan={2}>
                  <HighlightsList
                    workIndex={index}
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
            onClick={addWork}
            width="100%"
            size="sm"
            variant="subtle"
            colorPalette="gray"
          >
            <HiPlus />
            Add Work
          </Button>
        </Box>
      </Box>
    </EditorSection>
  );
};

interface HighlightsListProps {
  workIndex: number;
  control: any;
  register: any;
}

const HighlightsList: FC<HighlightsListProps> = ({
  control,
  register,
  workIndex,
}) => {
  const { fields, remove, append, move } = useFieldArray({
    control,
    name: `work.[${workIndex}].highlights`,
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
            workIndex={workIndex}
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
  workIndex: number;
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
  workIndex,
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
        {...register(`work.${workIndex}.highlights.${index}.value`)}
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
