import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: {
      sizes: {
        sm: { value: 'sm' },
      },
    },
    semanticTokens: {
      sizes: {
        inputDefault: { value: 'sm' },
        textareaDefault: { value: 'sm' },
        selectDefault: { value: 'sm' },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
