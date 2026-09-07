import { ChakraProvider } from '@chakra-ui/react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ColorModeProvider } from './context/ColorModeContext/ColorModeContext';
import { ResumeLibraryProvider } from './context/ResumeLibraryContext/ResumeLibraryContext';
import { EditorPage } from './pages/EditorPage';
import { ResumeListPage } from './pages/ResumeListPage';
import { system } from './theme';

const App = () => (
  <ColorModeProvider>
    <ChakraProvider value={system}>
      {/*
        The library sits above the router so both pages share one copy of the
        index — renaming a resume from the editor updates its card immediately,
        with no reload and no second read of storage.
      */}
      <ResumeLibraryProvider>
        <Routes>
          <Route path="/" element={<ResumeListPage />} />
          <Route path="/editor/:id" element={<EditorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ResumeLibraryProvider>
    </ChakraProvider>
  </ColorModeProvider>
);

export default App;
