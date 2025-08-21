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
import { Tooltip } from './ui/tooltip';

export const Navbar: FC = () => {
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
      <Icon as={HiOutlineBriefcase} boxSize={8} />
      <Spacer />
      <Tooltip content="Import your resume">
        <IconButton
          color="white"
          variant="ghost"
          aria-label="Import Resume"
          colorPalette="bg"
          _hover={{
            backgroundColor: 'purple.600',
          }}
        >
          <HiOutlineUpload />
        </IconButton>
      </Tooltip>
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
