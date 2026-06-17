import { Box, ChakraProvider, Flex } from '@chakra-ui/react';
import { FC, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

import { Editor } from './components/Editor/Editor';
import { Navbar } from './components/Navbar';
import { Preview } from './components/Preview/Preview';
import { ResumeProvider } from './context/ResumeContext/ResumeContext';
import { system } from './theme';

const App: FC = () => {
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);

  return (
    <ResumeProvider>
      <ChakraProvider value={system}>
        <Routes>
          <Route
            path="/"
            element={
              <Flex height="100dvh" maxHeight="100dvh" overflow="hidden">
                {/* Navbar — remains while the editor slides */}
                <Box flexShrink={0} zIndex="banner">
                  <Navbar />
                </Box>

                {/* Editor Panel — slides out (keeping its width) when collapsed */}
                <Box
                  width={{ base: '300px', xl: '450px', '2xl': '600px' }}
                  maxWidth="600px"
                  bgColor="gray.100"
                  height="100%"
                  maxHeight="100%"
                  overflow="auto"
                  transition="all 0.3s ease-in-out"
                  transform={
                    isEditorCollapsed ? 'translateX(-100%)' : 'translateX(0)'
                  }
                  marginRight={
                    isEditorCollapsed
                      ? { base: '-300px', xl: '-450px', '2xl': '-600px' }
                      : '0'
                  }
                  flexShrink={0}
                >
                  <Editor />
                </Box>

                {/* Preview Panel */}
                <Box
                  flex={1}
                  overflow="hidden"
                  height="100%"
                  maxHeight="100%"
                  position="relative"
                >
                  <Preview
                    onEditorCollapseChange={setIsEditorCollapsed}
                    isEditorCollapsed={isEditorCollapsed}
                  />
                </Box>
              </Flex>
            }
          ></Route>
        </Routes>
      </ChakraProvider>
    </ResumeProvider>
  );
};

export default App;
