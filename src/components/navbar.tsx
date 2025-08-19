import { Box, Icon, IconButton, LinkBox, LinkOverlay, Spacer } from '@chakra-ui/react';
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
      <LinkBox>
        <IconButton
          variant="ghost"
          aria-label="Open Github repo"
          colorPalette="bg"
          _hover={{
            backgroundColor: 'purple.600',
          }}
        >
          <LinkOverlay href="https://github.com/michaelmov/resume-builder" target="_blank">
          <VscGithub color='white' />
          </LinkOverlay>
        </IconButton>
      </LinkBox>
    </Box>
  );
};
