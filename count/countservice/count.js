import { Noir, generateWitness } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import voteCircuit from './artifacts/mockvotezkproof.json' assert { type: 'json' };
import countCircuit from './artifacts/countvproof.json' assert { type: 'json' };

//import { BackendInstances, ProofArtifacts } from './types';
//import { ethers } from 'ethers';

let countBackend;
let input;
let voteProof;
let proofArtifacts;
let countProof;

const calculateVoteProof = async () => {
    const backends = {
        vote: new BarretenbergBackend(voteCircuit, 8),
        count: new BarretenbergBackend(countCircuit, 8)
    }

    countBackend = backends.count;

    // Main
    const vote = new Noir(voteCircuit, backends.vote);
    await vote.init();

    const numPublicInputs = 3;
    console.log('generating vote proof');
    input = { junk: 1, pubjunk: [1, 2, 3] };
    console.log("input:", input);
    const voteWitness = await generateWitness(voteCircuit, input);
    voteProof = await backends.vote.generateIntermediateProof(voteWitness);
    //console.log('vote proof generated: ', voteProof);

    // Verify the same proof, not inside of a circuit
    console.log('verifying vote proof (out of circuit)');
    const verified = await backends.vote.verifyIntermediateProof(voteProof);
    console.log('vote proof verified as', verified);

    // Now we will take that vote proof and verify it in an count proof.
    console.log('Preparing input for count proof');
    const { proofAsFields, vkAsFields, vkHash } = await backends.vote.generateIntermediateProofArtifacts(
        voteProof,
        numPublicInputs,
    );
    proofArtifacts = { proofAsFields, vkAsFields, vkHash };
    
    await backends.vote.destroy();
};

const calculateCountProof = async () => {
    // Recursion
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
        public_inputs: [input["pubjunk"][0], input["pubjunk"][1], input["pubjunk"][2]],
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
        countBackend.destroy();
    }
};

async function main() {
    await calculateVoteProof();
    console.log("calculateVoteProof done");
    await calculateCountProof();
    console.log("calculateCountProof done");
    await verifyCountProof();
    console.log("verifyCountProof done");
}

(async () => {
    await main();
})();
