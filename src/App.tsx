import { ChakraProvider, Grid, GridItem } from '@chakra-ui/react';
import { FC } from 'react';
import { Route, Routes } from 'react-router-dom';

import { Editor } from './components/editor/editor';
import { Navbar } from './components/navbar';
import { Preview } from './components/preview/preview';
import { ResumeProvider } from './context/resume.context';
import { system } from './theme';

const App: FC = () => {
  return (
    <ResumeProvider>
      <ChakraProvider value={system}>
        <Routes>
          <Route
            path="/"
            element={
              <Grid gridTemplateColumns="auto auto 1.4fr" maxHeight="100vh">
                <GridItem>
                  <Navbar />
                </GridItem>
                <GridItem
                  width={{ base: '300px', xl: '450px', '2xl': '600px' }}
                  maxWidth="600px"
                  bgColor="gray.100"
                  maxHeight="100vh"
                  overflow="auto"
                >
                  <Editor />
                </GridItem>
                <GridItem
                  style={{ overflow: 'hidden' }}
                  maxHeight="100vh"
                  position="relative"
                >
                  <Preview />
                </GridItem>
              </Grid>
            }
          ></Route>
        </Routes>
      </ChakraProvider>
    </ResumeProvider>
  );
};

export default App;
