import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Icon,
  IconButton,
  Input,
  Stack,
  Textarea,
  TextareaProps,
} from '@chakra-ui/react';
import { FC, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  HiChevronDown,
  HiChevronUp,
  HiOutlineTrash,
  HiPlus,
} from 'react-icons/hi';
import { SectionTypes, Work } from '../../types/resume.model';
import { formatDate } from '../../utils/date-utilities';
import { EditorSection, EditorSubsection } from './editor-sections';

interface WorkSectionProps {
  value: Work[];
  onUpdate: (sectionType: SectionTypes, section: Work[]) => void;
}

interface FormProps {
  name: string;
  work: Work[];
}
export const WorkSection: FC<WorkSectionProps> = ({ value, onUpdate }) => {
  const { control, register, formState, handleSubmit, reset } =
    useForm<FormProps>({
      mode: 'onChange',
      defaultValues: {
        name: 'work',
        work: value,
      },
    });
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control,
      name: 'work',
    }
  );

  const { isDirty } = formState;

  const onSubmit = (data: FormProps) => {
    onUpdate(SectionTypes.Work, data.work);
    reset(data);
  };

  const addWork = () => {
    const newWork = {
      name: '',
      position: '',
      startDate: formatDate(new Date('2005-02-03')),
      endDate: formatDate(new Date('2008-11-03')),
      summary: '',
      organization: '',
      url: '',
      highlights: [],
    } as Work;

    append(newWork);
  };
  return (
    <EditorSection
      title="Work Experience"
      onSaveClick={handleSubmit(onSubmit)}
      saveIsDisabled={!isDirty}
    >
      <FormControl>
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
                  <FormLabel htmlFor={field.id}>Company name</FormLabel>
                  <Input
                    id={field.id}
                    type="text"
                    {...register(`work.${index}.name`)}
                  />
                </GridItem>
                <GridItem colSpan={1}>
                  <FormLabel htmlFor={field.id}>Title</FormLabel>
                  <Input
                    id={field.id}
                    type="text"
                    {...register(`work.${index}.position`)}
                  />
                </GridItem>
                <GridItem colSpan={1}>
                  <FormLabel htmlFor={field.id}>Start date</FormLabel>
                  <Input
                    id={field.id}
                    type="text"
                    {...register(`work.${index}.startDate`)}
                  />
                </GridItem>
                <GridItem colSpan={1}>
                  <FormLabel htmlFor={field.id}>End date</FormLabel>
                  <Input
                    id={field.id}
                    type="text"
                    {...register(`work.${index}.endDate`)}
                  />
                </GridItem>
                <GridItem colSpan={2}>
                  <FormLabel htmlFor={field.id}>Summary</FormLabel>
                  <Textarea
                    id={field.id}
                    {...register(`work.${index}.summary`)}
                  />
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
            leftIcon={<Icon as={HiPlus} />}
            onClick={addWork}
            width="100%"
            size="sm"
          >
            Add Work
          </Button>
        </Box>
      </FormControl>
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
      <FormLabel>Highlights</FormLabel>
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
        leftIcon={<Icon as={HiPlus} />}
        onClick={() => append('')}
        width="100%"
        size="xs"
      >
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
        spacing={0.5}
      >
        <IconButton
          onClick={() => onMoveUp(index)}
          aria-label="Move up"
          size="xs"
          icon={<Icon as={HiChevronUp} />}
          disabled={moveUpDisabled}
        />
        <IconButton
          onClick={() => onDelete(index)}
          aria-label="Delete highlight"
          size="xs"
          icon={<Icon as={HiOutlineTrash} />}
        />
        <IconButton
          onClick={() => onMoveDown(index)}
          aria-label="Move down"
          size="xs"
          icon={<Icon as={HiChevronDown} />}
          disabled={moveDownDisabled}
        />
      </Stack>
    </Flex>
  );
};
