import {
  Box,
  IconButton,
  LinkBox,
  LinkOverlay,
  Spacer,
} from '@chakra-ui/react';
import { FC, ReactNode } from 'react';
import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';
import { VscGithub } from 'react-icons/vsc';

import { useColorMode } from '../hooks/useColorMode';

import { Tooltip } from './ui/Tooltip';

// The rail is dark chrome in both color modes, so its buttons keep the same
// light-on-dark treatment throughout rather than following `fg`/`bg` tokens.
export const railButtonProps = {
  variant: 'ghost',
  color: 'inherit',
  _hover: {
    color: 'white',
    backgroundColor: 'app.railHover',
  },
} as const;

/**
 * The app's rail. It is present on both pages so the theme toggle and repo
 * link never move and navigating doesn't reflow the window; only the leading
 * slot is contextual — the logo on the list, back and import in the editor.
 *
 * A vertical 50px rail costs 13% of a phone's width for two fixed buttons, so
 * on mobile it lays out as a horizontal bar across the top instead. Same
 * children, same order; only the axis changes.
 */
export const Navbar: FC<{
  children?: ReactNode;
  orientation?: 'vertical' | 'horizontal';
}> = ({ children, orientation = 'vertical' }) => {
  const { colorMode, toggleColorMode } = useColorMode();

  const colorModeLabel =
    colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  const isHorizontal = orientation === 'horizontal';

  return (
    <Box
      as="nav"
      height={isHorizontal ? '48px' : '100dvh'}
      width={isHorizontal ? '100%' : 50}
      flexShrink={0}
      background="app.rail"
      display="flex"
      flexDirection={isHorizontal ? 'row' : 'column'}
      alignItems="center"
      color="app.railFg"
      px={isHorizontal ? 2 : 0}
      py={isHorizontal ? 0 : 3}
      gap={1}
    >
      {children}
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
