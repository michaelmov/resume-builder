import {
  Box,
  IconButton,
  LinkBox,
  LinkOverlay,
  Spacer,
} from '@chakra-ui/react';
import { FC, useState } from 'react';
import {  HiOutlineUpload } from 'react-icons/hi';
import { VscGithub } from 'react-icons/vsc';

import { ImportDialog } from './ImportDialog';
import { Tooltip } from './ui/Tooltip';

export const Navbar: FC = () => {
  const [isImportOpen, setIsImportOpen] = useState(false);

  return (
    <Box
      as="nav"
      height="100dvh"
      width={50}
      background="brand.500"
      display="flex"
      flexDirection="column"
      alignItems="center"
      color="white"
      py={3}
    >
      <Tooltip content="Import your resume">
        <IconButton
          color="white"
          variant="ghost"
          aria-label="Import Resume"
          colorPalette="bg"
          _hover={{
            backgroundColor: 'brand.600',
          }}
          onClick={() => setIsImportOpen(true)}
        >
          <HiOutlineUpload />
        </IconButton>
      </Tooltip>
      <ImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
      <Spacer />
      <LinkBox>
        <IconButton
          variant="ghost"
          aria-label="Open Github repo"
          _hover={{
            backgroundColor: 'brand.600',
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
