import { Noir, generateWitness } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import voteCircuit from './circuits/votezkproof.json' assert { type: 'json' };
import countCircuit from './circuits/countvproof.json' assert { type: 'json' };
import * as IPFS from 'ipfs-http-client';
import { ethers } from 'ethers';
//import { BackendInstances, ProofArtifacts } from './types';

// Connect to IPFS daemon API server
const ipfs = await IPFS.create("http://127.0.0.1:5001");
// const ipfs = IPFS({
//   host: 'localhost',   // IPFS daemon address
//   port: '5001',       // API port
//   protocol: 'http'    // HTTP or HTTPS
// });

const topic = 'To be or not to be?|Not to be.|To be.';  // Replace with your topic name
const displayTopic = 'display' + topic;

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
const voteCountMap = new Map(); // Initially, no votes have been counted
const numShards = 1;
const shardId = 0;

const countVote = (message_hash) => {
    // Count the vote
    if (voteCountMap.has(message_hash)) {
        voteCountMap.set(message_hash, voteCountMap.get(message_hash) + 1);
    } else {
        voteCountMap.set(message_hash, 1);
    }
}

const getVoteCount = (message_hash) => {
    // Get the vote count
    if (voteCountMap.has(message_hash)) {
        return voteCountMap.get(message_hash);
    } else {
        return 0;
    }
}

const processVoteProof = async () => {
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
               
    // Recursive proof verification would occur here
    console.log('recursive proof count');
    countVote(message.publicInputs.message_hash);
    
    // Send the vote count with proof to the display service
    const voteCount = getVoteCount(message.publicInputs.message_hash);
    console.log(message.publicInputs.message_hash, 'has vote count', voteCount);
    ipfs.pubsub.publish(displayTopic, JSON.stringify({proof: 0, publicInputs: {descriptionHash: descriptionHash, message_hash: message.publicInputs.message_hash, voteCount: voteCount, numShards: numShards, shardId: shardId }}), (err) => {
        if (err) {
          console.error('Failed to publish message:', err);
          toast({title: 'Failed to publish message'});
        } else {
          console.log(`Published message to topic: ${displayTopic}`);
          toast({title: 'Published vote proof to topic: ' + displayTopic});
        }
    });              
};

async function prove() {
    await processVoteProof();
}

// To keep the Node.js process running
process.stdin.resume();
