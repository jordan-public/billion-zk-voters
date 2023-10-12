import * as React from "react"
import {
  ChakraProvider,
  Box,
  Heading,
  theme,
} from "@chakra-ui/react"
import { ethers } from 'ethers'

import TitleBar from './components/TitleBar'
import Body from './components/Body'

export const App = () => {
  const [signer, setSigner] = React.useState<ethers.Signer | null>(null);
  const [address, setAddress] = React.useState<string | null>(null);

  return(
  <ChakraProvider theme={theme}>
    <Heading>
      <title>Vote</title>
      <meta name="description" content="Vote Anonymously" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
    </Heading>
    <Box bg='black' w='100%' h='100%' p={4} color='white'>
      <TitleBar setSigner={setSigner} address={address} setAddress={setAddress} />
      <Body signer={signer} address={address} />
    </Box>
  </ChakraProvider>)
}
