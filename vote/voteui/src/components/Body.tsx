// SPDX-License-Identifier: BUSL-1.1
import React from 'react';
import { Flex, Button, Text, Box, InputGroup, InputLeftAddon, Input, RadioGroup, Radio, VStack, useToast } from '@chakra-ui/react'
import { ethers } from 'ethers'
import { Noir, generateWitness } from '@noir-lang/noir_js'
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import circuit from '../artifacts/votezkproof.json'
import { read } from 'fs';
interface BodyProps {
    signer: ethers.Signer | null;
    address: string | null;
}

function Body({ signer, address } : BodyProps) {
    const [issue, setIssue] = React.useState<string>('To be or not to be?')
    const [voteFor, setVoteFor] = React.useState<number | null>(null)
    const [input, setInput] = React.useState<any>(null);
    const [proof, setProof] = React.useState(Uint8Array.from([]));
    const [noir, setNoir] = React.useState(new Noir(circuit, new BarretenbergBackend(circuit, 8)));
  
    const candidates = ['Not to be', 'To be'];

    const toast = useToast();

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
        console.log("public_key_x", JSON.stringify(Array.from(ethers.getBytes('0x' + pubKey.slice(4, 68)), byte => byte.toString())));
        console.log("public_key_y", JSON.stringify(Array.from(ethers.getBytes('0x' + pubKey.slice(68, 132)), byte => byte.toString())));
        console.log("signature", JSON.stringify(Array.from(ethers.getBytes(signature.slice(0, 130)), byte => byte.toString())));
        console.log("message_hash", JSON.stringify(Array.from(ethers.getBytes(messageHash), byte => byte.toString())));
        console.log("address", JSON.stringify(Array.from(ethers.getBytes(addressRecovered), byte => byte.toString())));

        setInput({
            public_key_x: Array.from(ethers.getBytes('0x' + pubKey.slice(4, 68)), byte => byte.toString()),
            public_key_y: Array.from(ethers.getBytes('0x' + pubKey.slice(68, 132)), byte => byte.toString()),
            signature: Array.from(ethers.getBytes(signature.slice(0, 130)), byte => byte.toString()),
            message_hash: Array.from(ethers.getBytes(messageHash), byte => byte.toString()),
            address: Array.from(ethers.getBytes(addressRecovered), byte => byte.toString()),
        });
    }

    // Calculates proof
    React.useEffect(() => {
        if (!input) return;
        (async () => {
            const calc = new Promise(async (resolve, reject) => {
                // const witness = await generateWitness(circuit, input);
                // const proof = await noir.generateProof(witness);
                const before = Date.now();
                const proof = await noir.generateFinalProof(input);
                console.log("Proof generated in", (Date.now() - before)/1000, "s");
                setProof(proof);
                resolve(proof);
            });
            toast.promise(calc, {
                loading: { title: 'Calculating proof...'},
                success: { title: 'Proof calculated!'},
                error: { title: 'Error calculating proof'},
            });           
        }) ();
    }, [input]);
  
    // Verifies proof
    React.useEffect(() => {
        if (proof.length > 0) {
            const verify = new Promise(async (resolve, reject) => {
                if (!proof) return;
                const before = Date.now();
                const verification = await noir.verifyFinalProof(proof);
                console.log("Proof verified in", (Date.now() - before)/1000, "s");
                resolve(verification);
            });
            toast.promise(verify, {
                loading: { title: 'Verifying proof...'},
                success: { title: 'Proof verified!'},
                error: { title: 'Error verifying proof'},
            });
        }
    }, [proof]);
  
    // Initializes Noir
    React.useEffect(() => {
        (async () => {
            const init = new Promise(async (resolve, reject) => {
                await noir.init();
                setNoir(noir);
                resolve(noir);
            });
            toast.promise(init, {
                loading: { title: 'Initializing Noir...'} ,
                success: { title: 'Noir initialized!'},
                error: { title: 'Error initializing Noir'},
            });
        }) ();

        // return () => {
        //     noir.destroy();
        // };
    }, [noir]);

    if (!signer) return(<><br/>Please connect!</>)
    return (<Flex height="100vh" width="100vw" alignItems="center" justifyContent="center">
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