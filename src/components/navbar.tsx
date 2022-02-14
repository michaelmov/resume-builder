import { Box, Icon } from '@chakra-ui/react';
import { FC } from 'react';
import { HiOutlineBriefcase } from 'react-icons/hi';

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
    </Box>
  );
};
