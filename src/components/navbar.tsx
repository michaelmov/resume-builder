import { Box, Icon, IconButton, Link, Spacer } from '@chakra-ui/react';
import { FC } from 'react';
import { HiOutlineBriefcase } from 'react-icons/hi';
import { VscGithub } from 'react-icons/vsc';

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
      <Link href="https://github.com/michaelmov/resume-builder" isExternal>
        <IconButton
          colorPalette="purple"
          aria-label="Open Github repo"
          icon={<Icon as={VscGithub} boxSize={5} />}
        ></IconButton>
      </Link>
    </Box>
  );
};
