import {
  Box,
  BoxProps,
  Button,
  Flex,
  Heading,
  Icon,
  IconButton,
} from '@chakra-ui/react';
import { FC, useState } from 'react';
import { HiOutlineTrash } from 'react-icons/hi';

interface EditorSectionProps {
  title: string;
  onSaveClick?: () => void;
  saveIsDisabled?: boolean;
}
export const EditorSection: FC<EditorSectionProps> = ({
  title,
  children,
  onSaveClick,
  saveIsDisabled = false,
}) => {
  return (
    <Box width="100%">
      <Heading
        as="h3"
        fontSize="xl"
        mb={2}
        color="blackAlpha.600"
        fontWeight="normal"
      >
        {title}
      </Heading>
      <Box as="section" bgColor="white" borderRadius={8} p={4} boxShadow="sm">
        {children}
        <Flex justifyContent="end" mt={6}>
          <Button
            colorScheme="purple"
            mt={4}
            onClick={onSaveClick}
            size="sm"
            disabled={saveIsDisabled}
          >
            Save
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

interface EditorSubsectionProps extends BoxProps {
  onDeleteClick: () => void;
}

export const EditorSubsection: FC<EditorSubsectionProps> = ({
  children,
  onDeleteClick,
  ...rest
}) => {
  const [isActionButtonsVisible, setIsActionButtonsVisible] = useState(false);
  return (
    <Box
      borderWidth={1}
      borderColor="gray.200"
      p={4}
      borderRadius={6}
      position="relative"
      onMouseOver={() => setIsActionButtonsVisible(true)}
      onMouseLeave={() => setIsActionButtonsVisible(false)}
      {...rest}
    >
      {isActionButtonsVisible && (
        <Box position="absolute" top={-0.5} right={0} my={0}>
          <IconButton
            onClick={onDeleteClick}
            aria-label="Delete skill"
            icon={<Icon as={HiOutlineTrash} />}
            size="xs"
            borderBottomRightRadius={0}
            borderTopLeftRadius={0}
            borderRadius={5}
          />
        </Box>
      )}
      {children}
    </Box>
  );
};
