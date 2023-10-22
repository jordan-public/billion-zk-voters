# Installation and Running Instructions

The system consists of several components:
- Vote: Web application for casting a vote.
- Count: Service for counting the votes.
- Display: service, Smart Contracts and web application for displaying the results.

The versions if Noir compiler and packages used are: 
- noir v0.11.0 (to insall run ```noirup -v 0.11.0```)
- noir-lang/backend_barretenberg 0.7.10
- noir-lang/noir_js 0.16.0

## Vote

### Web application

To install:
```
cd vote
# Compile the vote zk prover
nargo compile
cd voteui
pnpm install
./install.sh
```

To run it locally from the ```vote/voteui``` directory:
```
pnpm start
```
and use a browser with MetaMask installed to open ```http://localhost:3000```.

## Count

### Counting application

Install the counting application, including the recursive count validity prover:
```
cd count\countservice
pnpm install
./install.sh
```

To count a single new vote (this should be scripted in a loop, one loop for each shard) in the ```count\countservice``` directory:
```
SHARD=0 node count.js
```

## Display

### Environment

First set up the proper environment values:
```
cd display/display
cp .env.example .env
```
and edit the file ```.env``` appropriately.

To install the vote sum validity prover:
```
cd display/sumvproof
./install.sh
cp 
```

### Smart Contracts:

To install the Smart Contracts,

On testnets:
```
cd display
./deployTestnets.sh
```

or on a local Anvil instance:
- In one shell keep Anvil running
```
cd display
./anvil.sh
```
- In another shell run:
```
cd display
./deployAnvil.sh
```
Note that the above script initiates a new Issue for voting as follows:
"To be or not to be?|Not to be.|To be.". To register other voting Issues/Referendums see the script ```display/script/RegisterIssue.s.sol``` and follow the same simple pattern.

### Display Service etc.

To install the display service which is used for:
- Creating an issue / election / referendum
- Displaying the voting results

```
cd display/displayservice
pnpm install
./install.sh
```

To create a new issue / election / referendum in the ```display/displayservice```, for example "To be or not to be" with voting choices "Not to be" and "To be" with 1 shard for the counting service and deadline for voting January 1, 2024 at midnight UTC:
```
node createIssue.js "To be or not to be|Not to be|To be" 1 1704085200
```
where 1704085200 represents Unix time for January 1, 2024 at midnight UTC.

finally, as people vote in the web application ```http://localhost:3000``` the voting results are displayed in the web application ```http://localhost:3001``` (once this application is installed at the end of this writeup). However, occasionally, the results of the ongoing counting have to be published on the blockchain. To do this, for each shard, in a loop, typically each 10 minutes, the following would publish to the blockchain, (temporarily hardcoded for for shardId = 0):
```
./pushcount.sh
```

### Result Display

To install the result display web application:

```
cd display/displayui
pnpm install
```

To run it locally in the ```display/displayui``` directory:
```
./start.sh
```
and use a browser with to open ```http://localhost:3001```


## Demo

For better understanding see the in the [demo](./demo/README.md) folder.