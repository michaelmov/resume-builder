import { ChakraProvider } from '@chakra-ui/react';
import { FC } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ColorModeProvider } from './context/ColorModeContext/ColorModeContext';
import { ResumeLibraryProvider } from './context/ResumeLibraryContext/ResumeLibraryContext';
import { EditorScreen } from './screens/EditorScreen';
import { ResumeListScreen } from './screens/ResumeListScreen';
import { system } from './theme';

const App: FC = () => (
  <ColorModeProvider>
    <ChakraProvider value={system}>
      {/*
        The library sits above the router so both screens share one copy of the
        index — renaming a resume from the editor updates its card immediately,
        with no reload and no second read of storage.
      */}
      <ResumeLibraryProvider>
        <Routes>
          <Route path="/" element={<ResumeListScreen />} />
          <Route path="/editor/:id" element={<EditorScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ResumeLibraryProvider>
    </ChakraProvider>
  </ColorModeProvider>
);

export default App;
