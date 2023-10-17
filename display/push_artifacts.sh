#!/bin/zsh
# Usage: ./push_artifacts.sh <chain_id>

rm displayui/src/artifacts/*.json

# Ignore errors
for dirname in out/*.sol; do
    cat $dirname/$(basename "$dirname" .sol).json | jq '{abi: .abi}' > web/src/artifacts/$(basename "$dirname" .sol).json
done

cat broadcast/$1/run-latest.json out/AggregateCounts.sol/AggregateCounts.json | \
jq -s \
    'add | 
    { chain: .chain} * (.transactions[] |
    { transactionType, contractName, contractAddress } |
    select(.transactionType == "CREATE" and .contractName == "AggregateCounts") |
    {contractName, contractAddress}) * {abi: .abi}' > web/src/artifacts/AggregateCounts.json

cat broadcast/$1/run-latest.json out/MockVerifier.sol/MockVerifier.json | \
jq -s \
    'add | 
    { chain: .chain} * (.transactions[] |
    { transactionType, contractName, contractAddress } |
    select(.transactionType == "CREATE" and .contractName == "MockVerifier") |
    {contractName, contractAddress}) * {abi: .abi}' > web/src/artifacts/MockVerifier.json
