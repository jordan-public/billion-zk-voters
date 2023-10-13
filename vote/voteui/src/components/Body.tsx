// SPDX-License-Identifier: BUSL-1.1
import React from 'react';
import { Flex, Button, Text, Box, InputGroup, InputLeftAddon, Input, RadioGroup, Radio, VStack } from '@chakra-ui/react'
import { ethers } from 'ethers'

interface BodyProps {
    signer: ethers.Signer | null;
    address: string | null;
}

function Body({ signer, address } : BodyProps) {
    const [issue, setIssue] = React.useState<string>('Test issue')
    const [voteFor, setVoteFor] = React.useState<number | null>(null)
    const candidates = ['First', 'Second', 'Third'];

    const castVote = async () => {
        if (voteFor === null) {
            window.alert('Please select a candidate');
            return;
        }
        if (!signer) {
            window.alert('Please connect!');
            return;
        }
        const toSign = issue + voteFor.toString();
        const signature = await signer.signMessage(toSign);
        console.log('Signature with length', signature.length, signature);
        console.log('r=', signature.slice(2, 66));
        console.log('s=', signature.slice(66, 130));
        // Verify signature
        const recoveredSigner = ethers.verifyMessage(toSign, signature);
        console.log("Recovered signer", recoveredSigner);

        const messageBytes = ethers.toUtf8Bytes('\x19Ethereum Signed Message:\n' + toSign.length.toString() + toSign);
        const messageHash = ethers.keccak256(messageBytes);
        console.log("messageHash", messageHash.length, messageHash);

        // Recover public key
        const pubKey = ethers.SigningKey.recoverPublicKey(messageHash, signature);
        console.log("pubKey", pubKey.length, pubKey);
        const addressRecovered = ethers.computeAddress(pubKey);
        console.log("addressRecovered", addressRecovered);
        console.log("addressRecovered === recoveredSigner", addressRecovered === recoveredSigner);

        // Export as input paramters for Prover.toml
        console.log("Pubkey X", JSON.stringify(Array.from(ethers.getBytes('0x' + pubKey.slice(4, 68)), byte => byte.toString())));
        console.log("Pubkey Y", JSON.stringify(Array.from(ethers.getBytes('0x' + pubKey.slice(68, 132)), byte => byte.toString())));
        console.log("Signature:", JSON.stringify(Array.from(ethers.getBytes(signature.slice(0, 130)), byte => byte.toString())));
        console.log("Message hash:", JSON.stringify(Array.from(ethers.getBytes(messageHash), byte => byte.toString())));
        console.log("Address:", JSON.stringify(Array.from(ethers.getBytes(addressRecovered), byte => byte.toString())));
    }

    if (!signer) return(<><br/>Please connect!</>)
    return (<Flex
            height="100vh"
            width="100vw"
            alignItems="center"
            justifyContent="center"
        >
            <Box>
                <InputGroup>
                    <InputLeftAddon color="black" children='Issue' />
                    <Input placeholder='type issue ID number here' value={issue} onChange={(e) => setIssue(e.target.value)}/>
                </InputGroup>
                <Box border={1} borderRadius={5} p={5} m={5}>
                <RadioGroup onChange={(s) => setVoteFor(parseInt(s))} value={voteFor?.toString()}>
                <VStack align='start' spacing={4}>
                    {candidates.map((candidate, index) => <Radio key={index} value={index.toString()}>{candidate}</Radio>)}
                </VStack>
                </RadioGroup>
                </Box>
                <Text>Selection: {voteFor !== null && voteFor.toString() + " " + candidates[voteFor]}</Text>
                <Button onClick={castVote}>Cast Vote</Button>
            </Box>
        </Flex>);
}

export default Body;