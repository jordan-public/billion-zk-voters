// SPDX-License-Identifier: BUSL-1.1
import React from 'react';
import { Flex, Button, Text, Box, InputGroup, InputLeftAddon, Input, RadioGroup, Radio, VStack, useToast } from '@chakra-ui/react'
import { ethers } from 'ethers'
import { Noir, generateWitness } from '@noir-lang/noir_js'
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import circuit from '../circuits/votezkproof.json'
import * as IPFS from 'ipfs-http-client';

interface BodyProps {
    signer: ethers.Signer | null;
    address: string | null;
}

function createNoirWithBackend() { // Workaround because the backend is privte in Noir
    const barretenbergBackend = new BarretenbergBackend(circuit, 8);
    return {backend: barretenbergBackend, noir: new Noir(circuit, barretenbergBackend)};
}

function Body({ signer, address } : BodyProps) {
    const [issue, setIssue] = React.useState<string>('To be or not to be?|Not to be.|To be.')
    const [voteFor, setVoteFor] = React.useState<number | null>(null)
    const [input, setInput] = React.useState<any>(null);
    const [lastInput, setLastInput] = React.useState<any>(null); // For debugging
    const [proof, setProof] = React.useState(Uint8Array.from([]));
    const [noirWithBackend, setNoirWithBackend] = React.useState(createNoirWithBackend());
    const [issueTitle, setIssueTitle] = React.useState<string>('');
    const [candidates, setCandidates] = React.useState<string[]>([]);
    const [ipfs, setIpfs] = React.useState<any>(null);

    React.useEffect(() => {
        (async () => {
            setIpfs(await IPFS.create({
                host: '127.0.0.1',   // IPFS daemon address
                port: 5001,       // API port
                protocol: 'http'    // HTTP or HTTPS
            }));
        }) ();
    }, []);

    React.useEffect(() => {
        if (!issue) return;
        const split = issue.split('|');
        setIssueTitle(split[0]);
        setCandidates(split.slice(1));
    }, [issue]);
  
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
        console.log("toSign", toSign);
        const signature = await signer.signMessage(toSign);
        console.log('Signature with length', signature.length, signature);
        console.log('r=', signature.slice(2, 66));
        console.log('s=', signature.slice(66, 130));
        // Verify signature
        const recoveredSigner = ethers.verifyMessage(toSign, signature);
        console.log("Recovered signer", recoveredSigner);

        const signatureBytes = ethers.getBytes(signature.slice(0, 130));
        const nullifier = ethers.keccak256(signatureBytes);
        
        console.log("message to be hashed", '\x19Ethereum Signed Message:\n' + toSign.length.toString() + toSign);
        const messageBytes = ethers.toUtf8Bytes('\x19Ethereum Signed Message:\n' + toSign.length.toString() + toSign);
        const messageHash = ethers.keccak256(messageBytes);
        console.log("messageHash", messageHash.length, messageHash, " decimal: ", BigInt(messageHash));

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
        console.log("nullifier", JSON.stringify(Array.from(ethers.getBytes(nullifier), byte => byte.toString())));


        // For debugging
        setLastInput(input);

        // Both variants work:
        // setInput({
        //     public_key_x: Array.from(ethers.getBytes('0x' + pubKey.slice(4, 68)), byte => byte.toString()),
        //     public_key_y: Array.from(ethers.getBytes('0x' + pubKey.slice(68, 132)), byte => byte.toString()),
        //     signature: Array.from(ethers.getBytes(signature.slice(0, 130)), byte => byte.toString()),
        //     message_hash: Array.from(ethers.getBytes(messageHash), byte => byte.toString()),
        //     address: Array.from(ethers.getBytes(addressRecovered), byte => byte.toString()),
        //     nullifier: Array.from(ethers.getBytes(nullifier), byte => byte.toString()),
        // });
        setInput({
            public_key_x: Array.from(ethers.getBytes('0x' + pubKey.slice(4, 68))),
            public_key_y: Array.from(ethers.getBytes('0x' + pubKey.slice(68, 132))),
            signature: Array.from(ethers.getBytes(signature.slice(0, 130))),
            message_hash: Array.from(ethers.getBytes(messageHash)),
            address: Array.from(ethers.getBytes(addressRecovered)),
            nullifier: Array.from(ethers.getBytes(nullifier)),
        });
    }

    // For debugging
    React.useEffect(() => {
        console.log("**************** same input?", JSON.stringify(input) === JSON.stringify(lastInput) ? "yes" : "no");
    }, [input, lastInput]);

    // Calculates proof
    React.useEffect(() => {
        if (!input) return;
        (async () => {
            const calc = new Promise(async (resolve, reject) => {
                const before = Date.now();
                // Insteaad of: const proof = await noir.generateFinalProof(input);
                const witness = await generateWitness(circuit, input);
                const proof = await noirWithBackend.backend.generateIntermediateProof(witness);
                console.log("Proof generated in", (Date.now() - before)/1000, "s");
                console.log("proof", proof);
                console.log("proof hash", ethers.keccak256(proof));
                console.log("circuit hash", ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(circuit))));
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
                const verification = await noirWithBackend.backend.verifyIntermediateProof(proof);
                console.log("Proof verified in", (Date.now() - before)/1000, "s");
                if (!verification) window.alert('Proof verification failed!');
                console.log("verification", verification);
                // // For debugging, to show that second verification works as well, and it's much faster after the initial loading
                // const beforesecond = Date.now();
                // const secondverification = await noirWithBackend.backend.verifyIntermediateProof(proof);
                // console.log("Proof verified again in", (Date.now() - beforesecond)/1000, "s");
                // if (!secondverification) window.alert('Proof verification failed!');
                // console.log("secondverification", secondverification);
                resolve(verification);
            });
            toast.promise(verify, {
                loading: { title: 'Verifying proof...'},
                success: { title: 'Proof verified!'},
                error: { title: 'Error verifying proof'},
            });
        }
    }, [proof]);

    // Uploads proof to IPFS
    React.useEffect(() => {
        if (!ipfs) return;
        if (Object.keys(proof).length === 0) return; // Empty proof
        (async () => {
            const topic = issue; // For clarity of code
            ipfs.pubsub.publish(topic, JSON.stringify({proof: proof, publicInputs: {message_hash: input.message_hash, nullifier: input.nullifier}}), (err: any) => {
                if (err) {
                  console.error('Failed to publish message:', err);
                  toast({title: 'Failed to publish message'});
                } else {
                  console.log(`Published message to topic: ${topic}`);
                  toast({title: 'Published vote proof to topic: ' + topic});
                }
              });              
        }) ();
    }, [proof]);
  
    // Initializes Noir
    React.useEffect(() => {
        (async () => {
            const init = new Promise(async (resolve, reject) => {
                await noirWithBackend.noir.init();
                const nb = {backend: noirWithBackend.backend, noir: noirWithBackend.noir};
                //setNoirWithBackend(nb);
                resolve(nb);
            });
            toast.promise(init, {
                loading: { title: 'Initializing Noir...'} ,
                success: { title: 'Noir initialized!'},
                error: { title: 'Error initializing Noir'},
            });
        }) ();

        return () => {
            (async () => {
                await noirWithBackend.backend.destroy();
            }) ();
        };
    }, [noirWithBackend]);

    if (!signer) return(<><br/>Please connect!</>)
    return (<Flex height="100vh" width="100vw" alignItems="center" justifyContent="center">
            <Box>
                <InputGroup>
                    <InputLeftAddon color="black" children='Issue' />
                    <Input placeholder='type issue ID number here' value={issue} onChange={(e) => setIssue(e.target.value)}/>
                </InputGroup>
                <br/><br/><br/><br/><br/>
                <Text>Issue: {issueTitle}</Text>
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