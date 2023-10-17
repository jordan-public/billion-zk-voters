// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.13;

import "./interfaces/IVerifier.sol";
import "./plonk_vk.sol";

contract Verifier is IVerifier {
    UltraVerifier verifier;

    constructor () {
        verifier = new UltraVerifier();
    }

    function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool) {
        return verifier.verify(_proof, _publicInputs);
    }
}