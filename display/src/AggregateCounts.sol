// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.13;

import "./interfaces/IVerifier.sol";

contract AggregateCounts {
    struct candidate {
        uint256 numVoteCount;
        uint256[] shardVoteCounts;
    }

    struct issue {
        uint256 numShards;
        uint256 descriptionHash;
        uint256 deadline;
        IVerifier verifier;
        candidate[] candidates;
    }

    mapping (uint256=>issue) public issues; // issueId => issue

    function createIssue(uint256 issueId, uint256 numCandidates, uint256 numShards, uint256 descriptionHash, uint256 deadline, IVerifier verifier) public {
        require(issues[issueId].numShards == 0, "issueId already exists");
        require(numCandidates > 0, "numCandidates must be positive");
        require(numShards > 0, "numShards must be positive");
        require(deadline > block.timestamp, "deadline must be in the future");
        issues[issueId].numShards = numShards;
        issues[issueId].descriptionHash = descriptionHash;
        issues[issueId].deadline = deadline;
        issues[issueId].verifier = verifier;
        for (uint256 i = 0; i < numCandidates; i++) {
            issues[issueId].candidates.push(candidate(0, new uint256[](numShards)));
        }
    }

    function updateResult(uint256 issueId, uint256 candidateId, uint256 result, uint256 shardId, bytes calldata _proof, bytes32[] calldata _publicInputs) public {
        require(shardId < issues[issueId].numShards, "shardId out of range");
        require(candidateId < issues[issueId].candidates.length, "candidateId out of range");
        require(block.timestamp <= issues[issueId].deadline, "voting is over");
        if (issues[issueId].candidates[candidateId].shardVoteCounts[shardId] >= result)
            return; // Succeed quietly if the result is not an improvement
        require(issues[issueId].verifier.verify(_proof, _publicInputs), "invalid proof");
        issues[issueId].candidates[candidateId].numVoteCount += result - issues[issueId].candidates[candidateId].shardVoteCounts[shardId]; // Update the total vote count
        issues[issueId].candidates[candidateId].shardVoteCounts[shardId] = result;
    }

    function getVoteCount(uint256 issueId, uint256 candidateId) public view returns (uint256) {
        require(issues[issueId].numShards > 0, "issueId does not exist");
        require(candidateId < issues[issueId].candidates.length, "candidateId out of range");
        return issues[issueId].candidates[candidateId].numVoteCount;
    }

    function getDeadline(uint256 issueId) public view returns (uint256) {
        require(issues[issueId].numShards > 0, "issueId does not exist");
        return issues[issueId].deadline;
    }
}
