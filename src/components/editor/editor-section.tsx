import { Box, BoxProps, Button, Flex, Heading } from '@chakra-ui/react';
import { FC } from 'react';

interface EditorSectionProps {
  title: string;
  onSaveClick: () => void;
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
