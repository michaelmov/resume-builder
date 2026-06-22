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
  Field,
} from '@chakra-ui/react';
import { FC, useCallback, useEffect, useState } from 'react';
import {
  Control,
  useFieldArray,
  useForm,
  UseFormRegister,
} from 'react-hook-form';
import {
  HiChevronDown,
  HiChevronUp,
  HiOutlineTrash,
  HiPlus,
} from 'react-icons/hi';

import { useGlobalForm } from '../../context/GlobalFormContext';
import { SECTION_TITLES, SectionTypes } from '../../types/resume.model';

import { EditorSection } from './EditorSection';
import { EditorSubsection } from './EditorSubsection';

/** A single flat input within an entry. */
export interface FieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'url' | 'date' | 'textarea';
  placeholder?: string;
  colSpan?: 1 | 2;
}

/** An optional repeatable bullet list (highlights / keywords) within an entry. */
export interface BulletConfig {
  name: string;
  label: string;
  addLabel: string;
  /** `value` stores `{ value: string }[]`; `string` stores a plain `string[]`. */
  itemShape: 'value' | 'string';
}

export interface GenericListSectionProps<T> {
  sectionType: SectionTypes;
  value: T[];
  onUpdate: (sectionType: SectionTypes, section: T[]) => void;
  /** Factory for a blank entry when "Add" is clicked. */
  emptyEntry: () => T;
  /** Flat inputs, laid out in a two-column grid. */
  fields: FieldConfig[];
  /** Entry field shown as the collapsible subsection title. */
  titleField: keyof T & string;
  /** Optional entry field shown as the subsection subtitle. */
  subtitleField?: keyof T & string;
  /** Label for the "Add entry" button (e.g. "Add Award"). */
  addLabel: string;
  /** Optional repeatable bullet list rendered below the flat fields. */
  bullet?: BulletConfig;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormShape = { entries: any[] };

export function GenericListSection<T>({
  sectionType,
  value,
  onUpdate,
  emptyEntry,
  fields: fieldConfigs,
  titleField,
  subtitleField,
  addLabel,
  bullet,
}: GenericListSectionProps<T>) {
  const { control, register, formState, handleSubmit, reset } =
    useForm<FormShape>({
      mode: 'onChange',
      defaultValues: { entries: value as FormShape['entries'] },
    });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'entries',
  });
  const { registerSection, unregisterSection } = useGlobalForm();
  const { isDirty } = formState;

  const onSubmit = useCallback(
    (data: FormShape) => {
      onUpdate(sectionType, data.entries as T[]);
      reset(data);
    },
    [onUpdate, reset, sectionType]
  );

  useEffect(() => {
    registerSection(sectionType, {
      isDirty,
      handleSubmit: handleSubmit(onSubmit),
      reset: () => reset(),
    });

    return () => unregisterSection(sectionType);
  }, [
    isDirty,
    registerSection,
    unregisterSection,
    handleSubmit,
    onSubmit,
    reset,
    sectionType,
  ]);

  return (
    <EditorSection
      id={sectionType}
      title={SECTION_TITLES[sectionType]}
    >
      <Box>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {fields.map((field: any, index: number) => (
          <EditorSubsection
            key={field.id}
            title={field[titleField] || ''}
            subtitle={subtitleField ? field[subtitleField] || '' : ''}
            onDeleteClick={() => remove(index)}
            onMoveUpClick={() => move(index, index - 1)}
            onMoveDownClick={() => move(index, index + 1)}
            moveUpDisabled={index === 0}
            moveDownDisabled={index >= fields.length - 1}
            mb={6}
          >
            <Grid templateColumns="repeat(2, 1fr)" rowGap={4} columnGap={2}>
              {fieldConfigs.map((config) => (
                <GridItem key={config.name} colSpan={config.colSpan ?? 1}>
                  <Field.Root id={`${field.id}-${config.name}`}>
                    <Field.Label>{config.label}</Field.Label>
                    {config.type === 'textarea' ? (
                      <Textarea
                        placeholder={config.placeholder}
                        {...register(`entries.${index}.${config.name}`)}
                      />
                    ) : (
                      <Input
                        type={config.type ?? 'text'}
                        placeholder={config.placeholder}
                        {...register(`entries.${index}.${config.name}`)}
                      />
                    )}
                  </Field.Root>
                </GridItem>
              ))}
              {bullet && (
                <GridItem colSpan={2}>
                  <BulletListField
                    entryIndex={index}
                    control={control}
                    register={register}
                    bullet={bullet}
                  />
                </GridItem>
              )}
            </Grid>
          </EditorSubsection>
        ))}
        <Box>
          <Button
            onClick={() => append(emptyEntry() as FormShape['entries'][number])}
            width="100%"
            size="sm"
            variant="subtle"
            colorPalette="gray"
          >
            <HiPlus />
            {addLabel}
          </Button>
        </Box>
      </Box>
    </EditorSection>
  );
}

interface BulletListFieldProps {
  entryIndex: number;
  control: Control<FormShape>;
  register: UseFormRegister<FormShape>;
  bullet: BulletConfig;
}

const BulletListField: FC<BulletListFieldProps> = ({
  entryIndex,
  control,
  register,
  bullet,
}) => {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `entries.${entryIndex}.${bullet.name}`,
  });

  return (
    <Box>
      <Field.Root>
        <Field.Label>{bullet.label}</Field.Label>
      </Field.Root>
      {fields.map((item, index) => (
        <BulletInput
          key={item.id}
          path={
            bullet.itemShape === 'value'
              ? `entries.${entryIndex}.${bullet.name}.${index}.value`
              : `entries.${entryIndex}.${bullet.name}.${index}`
          }
          register={register}
          onMoveUp={() => move(index, index - 1)}
          onMoveDown={() => move(index, index + 1)}
          onDelete={() => remove(index)}
          moveUpDisabled={index === 0}
          moveDownDisabled={index >= fields.length - 1}
        />
      ))}
      <Button
        mt={4}
        onClick={() =>
          append(bullet.itemShape === 'value' ? { value: '' } : '')
        }
        width="100%"
        size="xs"
        variant="subtle"
        colorPalette="gray"
      >
        <HiPlus />
        {bullet.addLabel}
      </Button>
    </Box>
  );
};

interface BulletInputProps {
  path: string;
  register: UseFormRegister<FormShape>;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  moveUpDisabled: boolean;
  moveDownDisabled: boolean;
}

const BulletInput: FC<BulletInputProps> = ({
  path,
  register,
  onDelete,
  onMoveUp,
  onMoveDown,
  moveUpDisabled,
  moveDownDisabled,
}) => {
  const [isActionButtonsVisible, setIsActionButtonsVisible] = useState(false);
  return (
    <Flex
      alignItems="center"
      onMouseOver={() => setIsActionButtonsVisible(true)}
      onMouseLeave={() => setIsActionButtonsVisible(false)}
    >
      <Textarea
        my={1}
        mr={2}
        rows={2}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...register(path as any)}
      />
      <Stack
        visibility={isActionButtonsVisible ? 'visible' : 'hidden'}
        gap={0.5}
      >
        <IconButton
          onClick={onMoveUp}
          aria-label="Move up"
          size="xs"
          disabled={moveUpDisabled}
          variant="subtle"
        >
          <HiChevronUp />
        </IconButton>
        <IconButton
          onClick={onDelete}
          aria-label="Delete item"
          size="xs"
          variant="subtle"
        >
          <HiOutlineTrash />
        </IconButton>
        <IconButton
          onClick={onMoveDown}
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
