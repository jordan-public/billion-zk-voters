#!/bin/bash
set +x

# From the directory above this one, source the .env file
source ../.env

PASSPHRASE=$PASSPHRASE RPC=$RPC node pushcount.js