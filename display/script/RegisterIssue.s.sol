// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/MockVerifier.sol";
import "../src/AggregateCounts.sol";
import "../src/Verifier.sol";

contract Deploy is Script {
    function run() external {
        // uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(); /*deployerPrivateKey*/

        console.log("Creator (owner): ", msg.sender);

        MockVerifier mv = new MockVerifier();
        console.log(
            "MockVerifier deployed: ",
            address(mv)
        );

        Verifier v = new Verifier();
        console.log(
            "Verifier deployed: ",
            address(v)
        );

        AggregateCounts ac = new AggregateCounts();
        console.log(
            "AggregateCounts deployed: ",
            address(ac)
        );

        // Create an issue
        uint256 descriptionHash = uint256(keccak256(bytes("To be or not to be?|Not to be.|To be.")));
        uint256 numCandidates = 2;
        uint256 numShards = 1;
        uint256 deadline = block.timestamp + 1000000000;
        ac.createIssue(descriptionHash, numCandidates, numShards, deadline, mv);
        console.log("Issue created: ", descriptionHash);

        string memory candidate0 = "\x19Ethereum Signed Message:\n38To be or not to be?|Not to be.|To be.0";
        console.log("candidate0: ", candidate0);
        uint256 candidateHash0 = uint256(keccak256(bytes(candidate0)));
        ac.addCandidate(descriptionHash, candidateHash0);

        string memory candidate1 = "\x19Ethereum Signed Message:\n38To be or not to be?|Not to be.|To be.1";
        uint256 candidateHash1 = uint256(keccak256(bytes(candidate1)));
        ac.addCandidate(descriptionHash, candidateHash1);
        console.log("candidate1: ", candidate1);
    }
}
