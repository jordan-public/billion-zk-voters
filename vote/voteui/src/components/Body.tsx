// SPDX-License-Identifier: BUSL-1.1
import React from 'react';
import { Flex, Button, Text, Box, InputGroup, InputLeftAddon, Input, RadioGroup, Radio, VStack } from '@chakra-ui/react'
import { ethers } from 'ethers'
import { ec as EC } from 'elliptic'

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
        const recovered = ethers.verifyMessage(toSign, signature);
        console.log("Recovered signer", recovered);

        const messageBytes = ethers.toUtf8Bytes('\x19Ethereum Signed Message:\n' + toSign.length.toString() + toSign);
        const messageHash = ethers.keccak256(messageBytes);
        console.log("messageHash", messageHash.length, messageHash);

        // As suggested in https://github.com/ethers-io/ethers.js/issues/447
        // Then you must compute the prefixed-message hash
        const messageHash2 = ethers.hashMessage(toSign);
        console.log("messageHash2", messageHash2.length, messageHash2);
        console.log("messageHash2 === messageHash", messageHash2 === messageHash);
        // Then you must make this binary
        const messageHashBytes = ethers.getBytes(messageHash2);
        // Now you have the digest,
        const publicKey2 = ethers.SigningKey.recoverPublicKey(messageHashBytes, signature);
        console.log("publicKey2", publicKey2.length, publicKey2);
        const address2 = ethers.computeAddress(publicKey2);
        console.log("address2", address2);

        // Native way to recover public key
        const pubKeyRecoveredNative = ethers.SigningKey.recoverPublicKey(messageHash, signature);
        console.log("pubKeyRecoveredNative", pubKeyRecoveredNative.length, pubKeyRecoveredNative);
        const addressRecoveredNative = ethers.computeAddress(pubKeyRecoveredNative);
        console.log("addressRecoveredNative", addressRecoveredNative);

        const ec = new EC("secp256k1");
        // Use the elliptic library to recover the public key
        const pubKeyRecovered = ec.recoverPubKey(
            messageHashBytes,
            { r: signature.slice(2, 66), s: signature.slice(66,130) },
            parseInt(signature.slice(130, 132), 16) - 27  // the library expects 0 or 1, so subtract 27
        );

        console.log("pubKeyRecovered", pubKeyRecovered.encode("hex", false).length, pubKeyRecovered.encode("hex", false));
        const publicKey = "0x" + pubKeyRecovered.encode("hex", false).slice(2);

        // Compute the Ethereum address from the public key
        const address = ethers.computeAddress(publicKey);
        
        console.log("address", address);

        // Export as input paramters for Prover.toml
        console.log("Pubkey X", JSON.stringify(Array.from(ethers.getBytes('0x' + pubKeyRecoveredNative.slice(4, 68)), byte => byte.toString())));
        console.log("Pubkey Y", JSON.stringify(Array.from(ethers.getBytes('0x' + pubKeyRecoveredNative.slice(68, 132)), byte => byte.toString())));
        console.log("Signature:", JSON.stringify(Array.from(ethers.getBytes(signature.slice(0, 130)), byte => byte.toString())));
        console.log("Message hash:", JSON.stringify(Array.from(ethers.getBytes(messageHash2), byte => byte.toString())));
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