#!/bin/zsh

# Run anvil.sh in another shell before running this

# To load the variables in the .env file
source .env

# To deploy and verify our contract
forge script script/RegisterIssue.s.sol:Deploy --rpc-url "http://127.0.0.1:8545/" --sender $SENDER --private-key $PRIVATE_KEY --broadcast -vvvv

source push_artifacts.sh "Deploy.s.sol/31337"

# cd web
# npm run build