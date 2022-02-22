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
} from '@chakra-ui/react';
import { FC } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { HiOutlineTrash, HiPlus } from 'react-icons/hi';
import { SectionTypes, Work } from '../../models/resume.model';
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
              mb={6}
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
                  <HighlightInput
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

interface HighlightInputProps {
  workIndex: number;
  control: any;
  register: any;
}

const HighlightInput: FC<HighlightInputProps> = ({
  control,
  register,
  workIndex,
}) => {
  const { fields, remove, append } = useFieldArray({
    control,
    name: `work.[${workIndex}].highlights`,
  });
  return (
    <Box>
      <FormLabel>Highlights</FormLabel>
      {fields.map((highlight, index) => {
        return (
          <Flex alignItems="center">
            <Textarea
              id={highlight.id}
              my={1}
              mr={2}
              rows={2}
              {...register(`work.${workIndex}.highlights.${index}.value`)}
            />
            <IconButton
              onClick={() => remove(index)}
              aria-label="Delete highlight"
              size="xs"
              icon={<Icon as={HiOutlineTrash} />}
            />
          </Flex>
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
