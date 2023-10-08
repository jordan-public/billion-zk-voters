# Billion Secret Voters
Massive scale secret voting with on-chain results

## Abstract

Can large scale voting be performed on-chain? Not with current technology. I have a solution. With ZK voting and a combination of naturally incentivized ZK counting, we can put the results on-chain, all feasible with 
today's technology. Multiple vote counters can scale up the speed of counting to an arbitrary multiple.

We use Aztec's Noir for generating ZK Plonk proofs. The ballots are distributed to each voter in form of Merkle Tree proofs. Voters produce proofs and nullifiers by running the Voting Prover. Interested vote counters 
(for the appropriate side) count the votes by producing recursive incremental proofs of one-time counted votes. At any time, the current count (or the final one) can be verified on-chain and recorded.

## Introduction

Imagine a country with large population, such as USA, India or China, trying to run a referendum, with timely results (almost real time) and the results cannot be corruptable. The results should be recorded on a 
blockchain, end even corrupt vote counters or on-chain recorders should not be able to influence the outcome. Let's throw one more thing: the votes should be private and no one should be able to discover how anyone 
voted. Is this possible? Yes - read on...

Fastest blockchain: At Solana's questionable claim of 65,000 TPS (theoretically 600,000 transfers / simplest transactions), for 1 billion voters to secretly vote, even with a single transaction each, it would completely
overwhelm Solana for 4 days. In addition, these are not simple transactions, especially if we need to verify the anonymous votes on-chain. Looking at the size of the ZK verifiers, realistically, Solana may run for 
several months to complete the voting count for billion voters. And this is the fastest blockchain I know of today. And we haven't even counted the storage burden. Let's not even think of implementing this on Ethereum -
the total amount of transactions to date are a few 100,000s. A billion votes would 10-fold the storage requirement and break most validators.

But this is possible. Here is how:

## Protocol

I am using Zero Knowledge (ZK) proofs of voting. The proover is written in Noir. Then the votes are verified and counted by the **interested** party incrementally in a recursive manner. For each new count, a new proof of total votes so far is created by taking the previous count proof and the current vote proof. Finally, the result can be recorded on-chain. The Smart Contract records the new count after verifying the correctness of it's proof. The recording can be incremental, and in addition the counting can be split (sharded) among several parties, for arbitrary speed-up (scaling) of this process. The devil is in the details, so let's see how this works:

### Election or Referendum Initialization

Upon initialization, the **Organizer** creates a Merkle Tree of all registered voters and distributes ballots to all registered voters in form of Merkle Paths of their public keys.
But wait, the organizer can cheat by issuing extra ballots. To alleviate this they have to produce a ZK proof of the counting. In reality, if additional facts have to be proven, they would go into this proof.
To achieve this we devise a proof of insertion into a Merkle Tree (described below). The Organizer starts from an empty Merkle Tree and for each added ballot, it creates a proof that the new Merkle Tree is a result
of adding the ballot into the old Merkle Tree and incrementing the count by one. In other words:
```
v = 0
t = empty Merkle Tree
p = proof: empty Merkle Tree contains 0 votes
for voter in voters
  t1 = insert(v, t)
  p1 = proof: p verifies ok, t1 contains v+1 votes
  v = v+1
  t = t1
  p = p1
record p, v on chain into a Smart Contract that verifies p first
for voter in t
  distribute ballot to voter // ballot is Merkle Proof that voter is in t and it can only be used by the voter
```

Note that the first ```for``` loop can be unrolled into chunks of several votes instead of creating proofs for each iteration. 
However, for the prototype, we are creating a separate incremental recursive proof p for each voter iteration. 

Now each voter has a ballot (proof of membership in the recorded Merkle Tree in the Smart Contract. The voting can start.

### Voting

Each voter does the following
```
  vote for candidate C
  sign C using the public key corresponding to the ballot's public key **deterministically** // This is possible - see RFC 6979
  hash the signature - this is the Nullifier
  produce a proof that:
    ballot == Merkle Proof that ballot is valid == voter is in the Merkle Tree with root recorded in the Smart Contract
    Nullifier is calculated as above correctly
  distribute proof, Nullifier, C to interested parties anonymously // iterested parties are vote counters
```

Note that from the above note we cannot tell who the voter is, but we know the voted candidate C and a unique **Nullifier**

### Vote Counting



## Methods

### Proof of Insertion into a Merkle Tree
