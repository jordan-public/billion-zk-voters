See demo [here](./demo/README.md).

Installation instructions [here](./HOWTO.md).

# Billion Secret Voters
Massive scale secret voting with on-chain results

## Abstract

Can large scale voting be performed on-chain? Not with current technology. I have a solution. With ZK voting and a combination of naturally incentivized ZK counting, we can put the results on-chain, all feasible with 
today's technology. Multiple vote counters can scale up the speed of counting to an arbitrary multiple.

I use Aztec's Noir for generating ZK Plonk proofs. The ballots are distributed to each voter in form of Merkle Tree proofs. Voters produce proofs and nullifiers by running the Voting Prover. Interested vote counters 
(for the appropriate side) count the votes themselves by producing recursive incremental proofs of one-time counted votes. At any time, the current count (or the final one) can be verified on-chain and recorded.

This system allows for massive scalability as a hash function separates the voting population into multiple disjoint shards, which can be processed independently. The on-chain Smart Contract merely verifies the shards's proofs and tallies up the total number of votes.

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

I am using Zero Knowledge (ZK) proofs of voting. The proover is written in Noir. Then the votes are verified and counted by the **interested** party incrementally in a recursive manner. For each new count, a new proof of total votes so far is created by taking the previous count proof and the current vote proof, as well as a proof of single insertion of the new vote's nullifier into a Sparse Merkle Tree. Finally, the result is summarized into another proof which can be verified can be recorded on-chain. The Smart Contract records the new count after verifying the correctness of it's proof. The recording can be incremental, and in addition the counting can be split (sharded) among several parties, for arbitrary speed-up (scaling) of this process. The devil is in the details, so let's see how this works:

### Election or Referendum Initialization

Upon initialization, the **Organizer** creates a Merkle Tree of all registered voters and distributes ballots to all registered voters in form of Merkle Paths of their EVM addresses (practically uniquely defining their public keys).
But wait, the organizer can cheat by issuing extra ballots. To alleviate this they
have to produce a ZK proof of inclusion for each ballot.

And by the way, duplicates are OK, as each ballot would contain a nullifier, which would disallow double voting, an as we will see how below,
duplicate counting is prevented.

Now each voter has a ballot (nullifier and proof of membership in the Merkle Tree with root recorded in the Smart Contract. The voting can start.

### Voting

Each voter does the following
```
  vote for candidate C
  sign C using the public key corresponding to the ballot's public key **deterministically**. This is the Nullifier
  produce a proof that:
    ballot == Merkle Proof that ballot is valid == voter is in the Merkle Tree with root recorded in the Smart Contract
    Nullifier is calculated as above correctly
  distribute proof, Nullifier, C to interested parties anonymously // interested parties are vote counters
```

Note that from the above note we cannot tell who the voter is, but we know the voted candidate C and a unique **Nullifier**.
Also note that the voter can vote for multiple candidates and create a separate Nullifier for each, but this is no problem - the voter
will contradict himself and effectively achieve nothing. This can also be avoided by producing the nullifier from a signature of
voting (instead of specific candidate voting).

### Vote Counting

Anyone can count votes, and they are publicly available, but we cannot find out who was the voter for each vote.
At any point in the counting process, anyone can submit to the Smart Contract the current count so far.
The Smart Contract will verify the count proof, and if it is larger than the previous recorded count, it will update it.

Note that an impartial counter may count all candidate votes, but we are not assuming this.
Instead, we rely on the interested candidates to count their own votes, but they cannot cheat because each step has to
be proven cryptographically.

The counting is as follows:
```
const C = our candidate
count = 0
tn = empty Sparse Merkle Tree of Nullifiers
p = proof: empty Sparse Merkle Tree contains 0 members
for vote in votes
  if Nullifier(vote) is in tn then skip the loop to the next vote
  q = proof: tn1 = insert(v, tn) and tn1 != tn // very important to prove a single element insertion
  r = proof: vote is valid
  if q or r does not verify skip to the next vote // ignore double counts or fake votes
  p1 = verify p, q and r // p and q are external proofs
  count = count+1
  tn = tn1
  p = p1
  optionally record p, count for candidate C for on-chain recording // must do this in the final iteration, and before the deadline
```

Note that the above counting can occur separately for each candidate, if performed by adversarial parties.
It is only important that by having to submit a proof of vote count and Nullifier non-duplication, they cannot cheat.

### Outcome

The outcome has to be recorded by the deadline, as separate candidates act in their own interest to record all votes in their favor.

## Methods

### Proof of Single Element Insertion into a Sparse Merkle Tree

We chose Sparse Merkle Trees to make sure there are no duplicate Nullifiers in the counting phase (no duplicate votes). Also we devise
a proof od insertion of a single element in a sparse tree, which makes sure multiple counts are not snuck into a single vote counting step.

The Sparse Merkle Tree height would equal the number of bits in the Nullifier. This may not be optimal, but we cannot enumerate the voters,
as this would reveal their identities. Anyway, the Sparse Merkle Tree is generally full of empty subtrees and occasionally subtrees with a single
element.

### ZSMT - ZK Optimized Sparse Merkle Tree

To minimize the number of hashing operations inside of a ZK (or validity) proof I do the following:
1. if an element is absent, it is represented by a 0 in the corresponding leaf,
2. if a (sub)tree is empty, instead of a hash of it's subtrees' hashes, it's represented by 0
3. if a (sub)tree contains an empty child, it's represented by the value if it's other child, instead of a hash of it's children

Previously I have seen representation of the point 2 above as cached values of empty subtrees at different levels, but there is no need for that - 0 suffices.

Point 3 is entirely new and it eliminates the need of hashing in **massive subtrees which contain only a single element**. This reduces the number of hashes for such cases from $log(subtree size) = subtree height$ to $0$, which is very frequent in the usual usage of Sparse Merkle Trees.

### Scaling by Sharding

The entire process seems sequential and it seems that, while the process is better than on-chain voting, the problem of slow execution still exists.
To mitigate this, the entire process can be partitioned into disjoint Shards using modulo of the nullifier as each vote is independent of the others. The Smart Contract would sum up all recorded
Shard counts upon recording of the vote counts. So, how can we partition the space of voters? Simple:

In the counting process for shard S:
```
  const shardCount = some constant // number of parallel processors
  for each vote in votes
    shardId = Nullifier mod shardCount
    if shardId == S count the vote
    else ignore it // anyway it would fail to generate a proof of membership in the shard
```
