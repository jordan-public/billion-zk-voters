// SPDX-License-Identifier: BUSL-1.1
import React from 'react';
import { Text } from '@chakra-ui/react'
import { ethers } from 'ethers'

interface BodyProps {
    signer: ethers.Signer | null;
    address: string | null;
}

function Body({ signer, address } : BodyProps) {

    if (!signer) return(<><br/>Please connect!</>)
    return (
        <Text>Connected to {address}</Text>
    );
}

export default Body;