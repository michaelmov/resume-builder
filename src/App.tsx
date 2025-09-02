import { Box, ChakraProvider, Flex } from '@chakra-ui/react';
import { FC, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

import { Editor } from './components/editor/editor';
import { Navbar } from './components/navbar';
import { Preview } from './components/preview/preview';
import { ResumeProvider } from './context/resume.context';
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
              <Flex maxHeight="100vh">
                {/* Navbar */}
                <Box flexShrink={0} zIndex="banner">
                  <Navbar />
                </Box>

                {/* Editor Panel */}
                <Box
                  width={
                    isEditorCollapsed
                      ? '0'
                      : { base: '300px', xl: '450px', '2xl': '600px' }
                  }
                  maxWidth="600px"
                  bgColor="gray.100"
                  maxHeight="100vh"
                  overflow="auto"
                  transition="all 0.3s ease-in-out"
                  transform={
                    isEditorCollapsed ? 'translateX(-100%)' : 'translateX(0)'
                  }
                  flexShrink={0}
                >
                  <Editor />
                </Box>

                {/* Preview Panel */}
                <Box
                  flex={1}
                  overflow="hidden"
                  maxHeight="100vh"
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
