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
      <Box bg='darkgreen' w='100%' h='100%' p={4} color='white'>
        <Body provider={provider}/>
      </Box>
    </ChakraProvider>
  );
}

export default App;
