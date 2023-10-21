import * as IPFS from 'ipfs-http-client';
import { ethers } from 'ethers';
import aAggregateCounts from './artifacts/AggregateCounts.json' assert { type: 'json' };;

// Proof verification works only for non-recursive proofs at this time.
// This issue has been reported.
// This script skips the recursive proof verification step and generation of total count proof.

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
ipfs.pubsub.subscribe(displayTopic, async (msg) => {
    // Convert message data to object
    const decoder = new TextDecoder('utf-8');
    message = JSON.parse(decoder.decode(msg.data));
    console.log('Received message of length: ', message.length, ' and type: ', typeof message);
    await pushCountProof(message);
}, (err) => {
    if (err) {
        console.error('Failed to subscribe to topic:', err);
        process.exit(1);
    } else {
        console.log(`Subscribed to topic: ${topic}`);
    }
});

const voteCountMap = new Map(); // Initially, no votes have been counted
const numShards = 1;
const shardId = 0;

const pushCountProof = async (message) => {               
    // Recursive proof verification would occur here
    console.log('recursive proof count');
    countVote(message.publicInputs.message_hash);
    
    // Get passphrase from environment variable
    const passphrase = process.env.PASSPHRASE;
    if (passphrase === undefined) {
        console.log('MNEMONIC environment variable not set');
        process.exit(1);
    }
    // Get provider from environment variable
    const rpc = process.env.RPC;
    if (rpc === undefined) {
        console.log('RPC environment variable not set');
        process.exit(1);
    }
    
    const contractAddress = aAggregateCounts.contractAddress;
    const contractABI = aAggregateCounts.abi;
    const wallet = ethers.Wallet.fromMnemonic(passphrase);
    const provider = new ethers.providers.JsonRpcProvider(rpc); // e.g., Infura, Alchemy, or a local node
    const signer = wallet.connect(provider);  
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    try {
        const updateResult = await contract.updateResult(ethers.keccak256(ethers.toUtf8Bytes(topic)), message.publicInputs.message_hash, message.publicInputs.voteCount, message.publicInputs.shardId, "0x", []);
        const r = await updateResult.wait();
        console.log('Completed. Transaction hash: ', r.hash);
    } catch (error) {
        console.log("Tansaction error: ", error);
    }
};

// To keep the Node.js process running
process.stdin.resume();