import { useContext } from 'react';

import { colorModeContext } from '../context/ColorModeContext/ColorModeContext';

export const useColorMode = () => {
  const context = useContext(colorModeContext);

  if (!context) {
    throw new Error('useColorMode must be used within a ColorModeProvider');
  }

  return context;
};
