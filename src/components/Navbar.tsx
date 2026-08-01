import {
  Box,
  IconButton,
  LinkBox,
  LinkOverlay,
  Spacer,
} from '@chakra-ui/react';
import { FC, useState } from 'react';
import { HiOutlineUpload } from 'react-icons/hi';
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
      background="app.rail"
      display="flex"
      flexDirection="column"
      alignItems="center"
      color="gray.400"
      py={3}
    >
      <Tooltip content="Import your resume">
        <IconButton
          variant="ghost"
          aria-label="Import Resume"
          color="inherit"
          _hover={{
            color: 'white',
            backgroundColor: 'app.railHover',
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
          color="inherit"
          _hover={{
            color: 'white',
            backgroundColor: 'app.railHover',
          }}
        >
          <LinkOverlay
            href="https://github.com/michaelmov/resume-builder"
            target="_blank"
            color="inherit"
          >
            <VscGithub />
          </LinkOverlay>
        </IconButton>
      </LinkBox>
    </Box>
  );
};
