import { Box, Button, Heading } from '@chakra-ui/react';
import { FC, useContext, useState } from 'react';
import { resumeStoreContext } from '../../context/resume.context';
import { JsonEditor } from 'jsoneditor-react';
import { useResume } from '../../hooks/resume.hook';
import styled from '@emotion/styled';
import { Resume } from '../../models/resume.model';
import 'jsoneditor-react/es/editor.min.css';

const JsonEditorWrapper = styled(Box)`
  width: 100%;
  max-height: 80vh;
  overflow: auto;
  .jsoneditor {
    border: none;
    .jsoneditor-menu {
      background-color: var(--chakra-colors-purple-500);
      border: none;
    }
    .jsoneditor-contextmenu {
      .jsoneditor-menu {
        background-color: var(--chakra-colors-white);
      }
    }
  }
`;

export const Editor: FC = () => {
  const { resume, updateResume } = useResume();

  const [editedResume, setEditedResume] = useState(resume);

  const saveChanges = () => {
    updateResume(editedResume);
  };

  return (
    <Box
      bgColor="gray.50"
      minHeight="100%"
      width="100%"
      position="relative"
      display="flex"
    >
      <JsonEditorWrapper>
        <JsonEditor
          value={editedResume}
          navigationBar={false}
          search={false}
          onChange={(updated: Resume) => setEditedResume(updated)}
        />
      </JsonEditorWrapper>
      <Box
        height="70px"
        display="flex"
        justifyContent="end"
        alignItems="center"
        px={4}
        position="absolute"
        bottom={0}
        width="100%"
        boxShadow="md"
      >
        <Button colorScheme="purple" onClick={saveChanges}>
          Save
        </Button>
      </Box>
    </Box>
  );
};
