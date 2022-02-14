import { Box, Heading } from '@chakra-ui/react';
import { FC, useContext } from 'react';
import { resumeStoreContext } from '../../context/resume.context';
import { ACTIONS } from '../../context/resume.reducer';
import { Basics } from '../../models/resume.model';
import { BasicsSection } from './basics-section';

export const Editor: FC = () => {
  const { dispatch, state } = useContext(resumeStoreContext);

  const updateBasics = (updated: Basics) => {
    dispatch({ type: ACTIONS.updateBasics, payload: updated });
  };
  return (
    <Box bgColor="gray.50" minHeight="100%" width="100%" p={6}>
      <Heading>Basic Info</Heading>
      <BasicsSection basics={state.basics} onUpdate={updateBasics} />
    </Box>
  );
};
