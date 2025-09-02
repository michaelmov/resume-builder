import {
  Box,
  Icon,
  IconButton,
  LinkBox,
  LinkOverlay,
  Spacer,
} from '@chakra-ui/react';
import { FC } from 'react';
import { HiOutlineBriefcase, HiOutlineUpload } from 'react-icons/hi';
import { VscGithub } from 'react-icons/vsc';

import { useJsonImport } from '../hooks/useJsonImport';

import { Tooltip } from './ui/Tooltip';

export const Navbar: FC = () => {
  const { fileInputRef, triggerFileInput, handleFileChange } = useJsonImport();

  return (
    <Box
      as="nav"
      height="100vh"
      width={50}
      background="purple.500"
      display="flex"
      flexDirection="column"
      alignItems="center"
      color="white"
      py={3}
    >
      <Icon as={HiOutlineBriefcase} boxSize={8} marginBottom={3} />
      <Tooltip content="Import your resume">
        <IconButton
          color="white"
          variant="ghost"
          aria-label="Import Resume"
          colorPalette="bg"
          _hover={{
            backgroundColor: 'purple.600',
          }}
          onClick={triggerFileInput}
        >
          <HiOutlineUpload />
        </IconButton>
      </Tooltip>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Spacer />
      <LinkBox>
        <IconButton
          variant="ghost"
          aria-label="Open Github repo"
          _hover={{
            backgroundColor: 'purple.600',
          }}
        >
          <LinkOverlay
            href="https://github.com/michaelmov/resume-builder"
            target="_blank"
          >
            <VscGithub color="white" />
          </LinkOverlay>
        </IconButton>
      </LinkBox>
    </Box>
  );
};
