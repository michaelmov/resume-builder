import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
  components: {
    Input: {
      defaultProps: {
        size: 'sm',
      },
    },
    Textarea: {
      defaultProps: {
        size: 'sm',
      },
    },
    Select: {
      defaultProps: {
        size: 'sm',
      },
    },
    FormLabel: {
      baseStyle: {
        fontSize: 'sm',
        mb: 1,
      },
    },
  },
});
