import {
  Box,
  IconButton,
  LinkBox,
  LinkOverlay,
  Spacer,
} from '@chakra-ui/react';
import { FC, useState } from 'react';
import { HiOutlineMoon, HiOutlineSun, HiOutlineUpload } from 'react-icons/hi';
import { VscGithub } from 'react-icons/vsc';

import { useColorMode } from '../hooks/useColorMode';

import { ImportDialog } from './ImportDialog';
import { Tooltip } from './ui/Tooltip';

// The rail is dark chrome in both color modes, so its buttons keep the same
// light-on-dark treatment throughout rather than following `fg`/`bg` tokens.
const railButtonProps = {
  variant: 'ghost',
  color: 'inherit',
  _hover: {
    color: 'white',
    backgroundColor: 'app.railHover',
  },
} as const;

export const Navbar: FC = () => {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();

  const colorModeLabel =
    colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

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
          {...railButtonProps}
          aria-label="Import Resume"
          onClick={() => setIsImportOpen(true)}
        >
          <HiOutlineUpload />
        </IconButton>
      </Tooltip>
      <ImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
      <Spacer />
      <Tooltip content={colorModeLabel}>
        <IconButton
          {...railButtonProps}
          aria-label={colorModeLabel}
          onClick={toggleColorMode}
        >
          {colorMode === 'dark' ? <HiOutlineSun /> : <HiOutlineMoon />}
        </IconButton>
      </Tooltip>
      <LinkBox>
        <IconButton {...railButtonProps} aria-label="Open Github repo">
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
