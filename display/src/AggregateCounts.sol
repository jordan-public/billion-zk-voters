// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.13;

import "./interfaces/IVerifier.sol";

contract AggregateCounts {
    struct candidate {
        uint256 numVoteCount;
        uint256[] shardVoteCounts;
    }

    struct issue {
        address owner;
        uint256 numShards;
        uint256 deadline;
        IVerifier verifier;
        mapping (uint256 => candidate) candidates;
    }

    mapping (uint256 => issue) public issues; // descriptionHash => issue

    // Anyone can create an issue denoted by a descriptionHash, but it has to be unique
    function createIssue(uint256 descriptionHash, uint256 numCandidates, uint256 numShards, uint256 deadline, IVerifier verifier) public {
        require(issues[descriptionHash].numShards == 0, "issue already exists");
        require(numCandidates > 0, "numCandidates must be positive");
        require(numShards > 0, "numShards must be positive");
        require(deadline > block.timestamp, "deadline must be in the future");
        issues[descriptionHash].owner = msg.sender;
        issues[descriptionHash].numShards = numShards;
        issues[descriptionHash].deadline = deadline;
        issues[descriptionHash].verifier = verifier;
    }

    // The creator of the issue can add candidates
    function addCandidate(uint256 descriptionHash, uint256 candidateHash) public {
        require(issues[descriptionHash].numShards > 0, "issueId does not exist");
        require(issues[descriptionHash].owner == msg.sender, "only the owner can add candidates");
        require(issues[descriptionHash].candidates[candidateHash].shardVoteCounts.length == 0, "candidate already exists");
        issues[descriptionHash].candidates[candidateHash].shardVoteCounts = new uint256[](issues[descriptionHash].numShards);
    }

    function updateResult(uint256 descriptionHash, uint256 candidateHash, uint256 result, uint256 shardId, bytes calldata _proof, bytes32[] calldata _publicInputs) public {
        require(shardId < issues[descriptionHash].numShards, "shardId out of range");
        require(issues[descriptionHash].candidates[candidateHash].shardVoteCounts.length != 0, "candidateHash has not been added");
        require(block.timestamp <= issues[descriptionHash].deadline, "voting is over");
        if (issues[descriptionHash].candidates[candidateHash].shardVoteCounts[shardId] >= result)
            return; // Succeed quietly if the result is not an improvement
        require(issues[descriptionHash].verifier.verify(_proof, _publicInputs), "invalid proof");
        issues[descriptionHash].candidates[candidateHash].numVoteCount += result - issues[descriptionHash].candidates[candidateHash].shardVoteCounts[shardId]; // Update the total vote count
        issues[descriptionHash].candidates[candidateHash].shardVoteCounts[shardId] = result;
    }

    function getVoteCount(uint256 descriptionHash, uint256 candidateHash) public view returns (uint256) {
        require(issues[descriptionHash].numShards > 0, "issueId does not exist");
        require(issues[descriptionHash].candidates[candidateHash].shardVoteCounts.length != 0, "candidateHash has not been added");
        return issues[descriptionHash].candidates[candidateHash].numVoteCount;
    }

    function getDeadline(uint256 descriptionHash) public view returns (uint256) {
        require(issues[descriptionHash].numShards > 0, "issueId does not exist");
        return issues[descriptionHash].deadline;
    }
}
