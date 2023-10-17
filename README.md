See demo [here](./demo/README.md).

Installation instructions [here](./HOWTO.md).

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

Upon initialization, the **Organizer** creates a Sparse Merkle Tree of all registered voters and distributes ballots to all registered voters in form of Merkle Paths of their public keys.
Sparse Merkle Tree is used to make sure there are no duplicates, it each voter can only get one ballot. But wait, the organizer can cheat by issuing extra ballots. To alleviate this they
have to produce a ZK proof of the counting. In reality, if additional facts have to be proven, they would go into this proof.
To achieve this we devise a proof of insertion into a Sparse Merkle Tree (described below). The Organizer starts from an empty Sparse Merkle Tree and for each added ballot, it creates a proof that the new Sparse Merkle Tree is a result
of adding the ballot into the old Sparse Merkle Tree and incrementing the count by one. In other words:
```
voterCount = 0
t = empty Sparse Merkle Tree
p = proof: empty Sparse Merkle Tree contains 0 votes
for voter in voters
  t1 = insert(voter, t)
  p1 = proof: p verifies ok, t1 contains voterCount+1 members
  voterCount = voterCount+1
  t = t1
  p = p1
record p, voterCount on chain into a Smart Contract that verifies p first
for voter in t
  distribute ballot to voter // ballot is Merkle Proof that voter is in t and it can only be used by the voter
```

Note that the first ```for``` loop can be unrolled into chunks of several votes instead of creating proofs for each iteration. 
However, for the prototype, we are creating a separate incremental recursive proof p for each voter iteration. 

Now each voter has a ballot (proof of membership in the Sparse Merkle Tree with root recorded in the Smart Contract. The voting can start.

### Voting

Each voter does the following
```
  vote for candidate C
  sign C using the public key corresponding to the ballot's public key **deterministically** // This is possible - see RFC 6979
  hash the signature - this is the Nullifier
  produce a proof that:
    ballot == Merkle Proof that ballot is valid == voter is in the Sparse Merkle Tree with root recorded in the Smart Contract
    Nullifier is calculated as above correctly
  distribute proof, Nullifier, C to interested parties anonymously // iterested parties are vote counters
```

Note that from the above note we cannot tell who the voter is, but we know the voted candidate C and a unique **Nullifier**.
Also note that the voter can vote for multiple candidates and create a separate Nullifier for each, but this is no problem - the voter
will contradict himself and effectively achieve nothing.

### Vote Counting

Anyone can count votes, and they are publically available, but we cannot find out who was the voter for each vote.
At any point in the counting process, anyone can submit to the Smart Contract the current count so far.
The Smart Contract will verify the count proof, and if it is larger than the previous recorded count, it will update it.

Note that an impartial counter may count all candidate votes, but we are not assumming this.
Instead, we rely on the interested candidate to count his own votes, but he cannot cheat because each step has to
be proven cryptographically.

The counting is as follows:
```
const C = our candidate
count = 0
tn = empty Sparse Merkle Tree of Nullifiers
p = proof: empty Sparse Merkle Tree contains 0 members
for vote in votes
  if Nullifier(vote) is in tn then skip the loop to the next vote
  tn1 = insert(v, tn)
  if tn1 == tn then skip the loop to the next vote
  p1 = 
    if proof: p verifies vote for C, tn1 != tn // == tn1 contains count+1 elements
    else if proof fails skip the loop to the next vote
  count = count+1
  tn = tn1
  p = p1
  optionally record p, count for candidate C on chain into a Smart Contract that verifies p first // better do this in the final iteration, and before the deadline
```

Note that the above counting can occur separately for each candidate, if performed by adversarial parties.
It is only important that by having to submit a proof of vote count and Nullifier non-duplication, they cannot cheat.

### Outcome

The outcome has to be recorded by the deadline, as separate candidates act in their own interest to record all votes in their favor.

## Methods

### Proof of Insertion into a Sparse Merkle Tree

We chose Sparse Merkle Trees to make sure there are no duplicate ballots in the Initialization phase and no duplicate Nullifiers in the
counting phase (no duplicate votes).

The Sparse Merkle Tree height would equal the number of bits in the Nullifier. This may not be optimal, but we cannot enumerate the voters,
as this would reveal their identities. Anyway, the Sparse Merkle Tree is generally full of null members and to optimize, only the non-null subtrees are
recorded, while the hashes represending null subrees of various heights are cached for immediate recognition.

### Scaling by Sharding

The entire process seems sequential and it seems that, while the process is better than on-chain voting, the problem of slow execution still exists.
To mitigate this, the entire process can be partitioned in Shards as each vote is independent of the others. The Smart Contract would sum up all recorded
Shard counts upon recording of the vote counts. So, how can we partition the space of voters? Simple:

In the initialization process:
```
  const shardCount = some constant // number of parallel processors
  for each voter in voters
    shardId = hash(voter) mod shardCount
    send voter to be processed by processor identified by shardId
```
Note that the space of voters is partitioned disjunctively by virtue of collision-free safety of the hash function.

In the counting process:
```
  const shardCount = some constant // number of parallel processors
  for each vote in votes
    shardId = hash(Nullifier) mod shardCount
    send vote to be processed by processor identified by shardId
```
Here also the space of nullifiers is partitioned disjunctively by virtue of collision-free safety of the hash function.
