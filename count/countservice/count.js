import { Noir, generateWitness } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import voteCircuit from './circuits/votezkproof.json' assert { type: 'json' };
import countCircuit from './circuits/countvproof.json' assert { type: 'json' };
import * as IPFS from 'ipfs-http-client';
import { ethers } from 'ethers';
//import { BackendInstances, ProofArtifacts } from './types';

// Connect to IPFS daemon API server
const ipfs = await IPFS.create("http://localhost:5001");
// const ipfs = IPFS({
//   host: 'localhost',   // IPFS daemon address
//   port: '5001',       // API port
//   protocol: 'http'    // HTTP or HTTPS
// });

const topic = 'To be or not to be?|Not to be.|To be.';  // Replace with your topic name

// Subscribe to a topic
ipfs.pubsub.subscribe(topic, async (msg) => {
    // Convert message data to object
    const decoder = new TextDecoder('utf-8');
    message = JSON.parse(decoder.decode(msg.data));
    console.log('Received message of length: ', message.length, ' and type: ', typeof message);
    await prove();
}, (err) => {
    if (err) {
        console.error('Failed to subscribe to topic:', err);
        process.exit(1);
    } else {
        console.log(`Subscribed to topic: ${topic}`);
    }
});


let input;
let voteProof;
let proofArtifacts;
let countBackend;
let countProof;
let message;

const calculateVoteProof = async () => {
    const voteBackend = new BarretenbergBackend(voteCircuit, 8);
    
    // Main
    const vote = new Noir(voteCircuit, voteBackend);
    await vote.init();

    const numPublicInputs = 32+32;
    // console.log('generating vote proof');
    // input = { junk: 1, pubjunk: [1, 2, 3], pubjunk2: 1 };
    // console.log("input:", input);
    // const voteWitness = await generateWitness(voteCircuit, input);
    // voteProof = await voteBackend.generateIntermediateProof(voteWitness);
    // //console.log('vote proof generated: ', voteProof);
    const voteProofWithInputs = { proof: Uint8Array.from(Object.values(message.proof)), publicInputs: message.publicInputs };
    console.log('voteProofWithInputs type and length', typeof voteProofWithInputs, voteProofWithInputs.length, voteProofWithInputs);
    console.log('proof type and length', typeof voteProofWithInputs.proof, voteProofWithInputs.proof.length, voteProofWithInputs.proof);
    console.log('public_inputs type and length', typeof voteProofWithInputs.publicInputs, voteProofWithInputs.publicInputs.length, voteProofWithInputs.publicInputs);
    console.log('message_hash type and length', typeof voteProofWithInputs.publicInputs.message_hash, voteProofWithInputs.publicInputs.message_hash.length, voteProofWithInputs.publicInputs.message_hash);
    console.log('nullifier type and length', typeof voteProofWithInputs.publicInputs.nullifier, voteProofWithInputs.publicInputs.nullifier.length, voteProofWithInputs.publicInputs.nullifier);
    console.log("proof hash", ethers.keccak256(voteProofWithInputs.proof));
    console.log("circuit hash", ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(voteCircuit))));
                                
    // Verify the same proof, not inside of a circuit
    console.log('verifying vote proof (out of circuit)');
    const verified = await voteBackend.verifyIntermediateProof(voteProofWithInputs.proof);
    console.log('vote proof verified as', verified);

    // Now we will take that vote proof and verify it in an count proof.
    console.log('Preparing input for count proof');
    const { proofAsFields, vkAsFields, vkHash } = await voteBackend.generateIntermediateProofArtifacts(
        voteProof,
        numPublicInputs,
    );
    proofArtifacts = { proofAsFields, vkAsFields, vkHash };
    
    await voteBackend.destroy();
};

const calculateCountProof = async () => {
    // Recursion
    countBackend = new BarretenbergBackend(countCircuit, 8);

    //const count = new Noir(countCircuit, countBackend!);
    const count = new Noir(countCircuit, countBackend);
    await count.init()

    //console.log("proofArtifacts: ", proofArtifacts);

    //const { proofAsFields, vkAsFields, vkHash } = proofArtifacts!
    const { proofAsFields, vkAsFields, vkHash } = proofArtifacts;
    // console.log('Proof as Fields: ', proofAsFields);
    // console.log('Vk as Fields: ', vkAsFields);
    // console.log('Vk Hash: ', vkHash);
    const aggregationObject = Array(16).fill(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    const countInput = {
        verification_key: vkAsFields.map(e => e.toString()),
        proof: proofAsFields,
        //public_inputs: [input!["junk"]],
        public_inputs: [input["pubjunk"][0], input["pubjunk"][1], input["pubjunk"][2], input["pubjunk2"]],
        key_hash: vkHash,
        input_aggregation_object: aggregationObject,
        proof_b: proofAsFields,
    }

    //console.log("count input", countInput)
    console.log('generating witnesses for count proof');
    console.log("countInput.proof.length:", countInput.proof.length)
    const countWitness = await generateWitness(countCircuit, countInput);

    console.log('generating count proof');
    //const countProof = await countBackend!.generateFinalProof(countWitness);
    const countProof = await countBackend.generateFinalProof(countWitness);
    console.log('Count proof generated: ', countProof);
}

const verifyCountProof = async () => {
    if (countProof) {
        console.log("verifying count proof")
        //const verification = await countBackend!.verifyFinalProof(countProof);
        const verification = await countBackend.verifyFinalProof(countProof);
        console.log('Proof verified as', verification);
        //countBackend!.destroy();
        await countBackend.destroy();
    }
};

async function prove() {
    await calculateVoteProof();
    console.log("calculateVoteProof done");
    await calculateCountProof();
    console.log("calculateCountProof done");
    await verifyCountProof();
    console.log("verifyCountProof done");
}

// To keep the Node.js process running
process.stdin.resume();
