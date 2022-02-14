import { Box, Button, FormControl, FormLabel, Input } from '@chakra-ui/react';
import { FC, useState } from 'react';
import { Basics } from '../../models/resume.model';

interface BasicsSectionProps {
  basics: Basics;
  onUpdate: (updatedBasics: Basics) => void;
}
export const BasicsSection: FC<BasicsSectionProps> = ({ basics, onUpdate }) => {
  const [updatedBasics, setUpdatedBasics] = useState({ ...basics });

  const handleInputChange = (key: string, value: string) => {
    setUpdatedBasics((oldVal) => {
      return {
        ...oldVal,
        [key]: value,
      };
    });
  };
  return (
    <Box as="section">
      <FormControl>
        <FormLabel htmlFor="name">Name</FormLabel>
        <Input
          id="name"
          type="text"
          value={updatedBasics?.name}
          onChange={(e) => handleInputChange(e.target.id, e.target.value)}
        />
        <Button
          colorScheme="purple"
          mt={4}
          onClick={(e) => onUpdate(updatedBasics)}
        >
          Save
        </Button>
      </FormControl>
    </Box>
  );
};
