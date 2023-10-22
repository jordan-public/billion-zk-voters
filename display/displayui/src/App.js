import React from 'react';
import {
  ChakraProvider,
  Box,
  VStack,
  Grid,
  theme,
} from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import Body from './components/Body';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Box fontSize="xl">
        <Grid minH="100vh" p={3}>
          <ColorModeSwitcher justifySelf="flex-end" />
          <VStack spacing={8}>
            <Body provider={provider}/>
          </VStack>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App;
