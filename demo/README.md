## Video

The video presentation can be found [here](./BillionZKVoters.mov) or on [YouTube here](https://youtu.be/LLJIGYwUeww).

## Installation and Testing instructions

The instructions for installation and testing can be found [here](../HOWTO.md).

## Deployment Addresses

The smart contracts have been deployed at the following addresses:

Scroll Sepolia (Chain 534351):
MockVerifier:  0xe7a044e19D5afbB2957740a3Cdc3E295F152CF7E
Verifier:  0x945923132F617Aa5d1bF4E6ea1baCa041Cc9fBEa
AggregateCounts:  0xaF4cF2Fdd4518615fCd7C82B1b4a9c5818296C26

Polygon zkEVM testnet (Chain 1442):
MockVerifier:  0x703154ACA8ef30eA39E80f127F68E4fE46f97A99
Verifier:  0x33dB3E7528131891A173AD12e7867dAd8d932910
AggregateCounts:  0xa84a60E096Aa5752c9e754aF755327af2227BD59

Mantle testnet (Chain 5001):
MockVerifier:  0xE6Bb8A1395d660b795264f790D4F2958aE5C10D5
Verifier:  0x56FA697d65c52aFe51d406F580671632d30b7F05
AggregateCounts:  0x27979b33BAc1f327C13B693Bd7804B53f86C1457

## Demonstration of my ZK Optimized Sparse Merkle Tree
The tests to complete an example of an empty tree, but most importantly, also with a tree with a single element
with no hashing instead of log(2^32) hashes can be shown as follows:
```
cd count/countvproof
nargo test
```

## Discovered Issue and Reported

I discovered an issue with the Barettenberg ZK proving system. Namely, while the recursive proofs work
inside a single instance of its backend, the backend's function ```generateIntermediateProof``` does not export sufficient information to allow the proof to be verified in another instance of the backend in another process.

As suggested I reported this issue [here](https://github.com/noir-lang/noir/issues/3229) and mocked up the remote verifiers, in order to proceed with the workflow.

I demonstrated the in-process recursive verification success (see source code [here](../count/countservice/testCountDoubleMockVoteZKProof.js) ), which can e shown in the commit 3447d005fe31cfd3bfaca6986d4a54a427a5e4f4 of this repository and run using ```node testCountDoubleMockVoteZKProof.js``` in that commit.
