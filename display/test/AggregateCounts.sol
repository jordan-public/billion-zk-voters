// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {IVerifier} from "../src/interfaces/IVerifier.sol";
import {MockVerifier} from "../src/MockVerifier.sol";
import {AggregateCounts} from "../src/AggregateCounts.sol";

contract AggregateCountsTest is Test {
    IVerifier public verifier;
    AggregateCounts public aggregateCounts;

    function setUp() public {
        verifier = new MockVerifier();
        aggregateCounts = new AggregateCounts();
    }

    function test_Count() public {
        aggregateCounts.createIssue(0, 2, 1, 0, block.timestamp + 100, verifier);
        aggregateCounts.updateResult(0, 0, 1, 0, new bytes(1), new bytes32[](1));
        aggregateCounts.updateResult(0, 0, 2, 0, new bytes(1), new bytes32[](1));
        assert(aggregateCounts.getVoteCount(0, 0) == 2);
    }
}
