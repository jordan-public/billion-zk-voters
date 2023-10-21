#!/bin/bash
set -x

nargo check
nargo compile
nargo codegen-verifier
cp contract/sumvproof/plonk_vk.sol ../src/