// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {IVerifier} from "../src/interfaces/IVerifier.sol";
import {MockVerifier} from "../src/MockVerifier.sol";

contract MockVerifierTest is Test {
    IVerifier public verifier;

    function setUp() public {
        verifier = new MockVerifier();
    }

    function test_Verify() public view {
        assert(verifier.verify(new bytes(1), new bytes32[](1)));
    }

}
