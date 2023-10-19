#!/bin/bash
set -x

pushd ../mockvotezkproof/
nargo check
nargo compile
#nargo prove
#nargo verify
popd
mkdir -p circuits
cp ../mockvotezkproof/target/* circuits/
pushd ../countvproof/
nargo check
nargo compile
popd
cp ../countvproof/target/* circuits/
# pushd ../../vote/votezkproof/
# nargo check
# nargo compile
# popd
cp ../../vote/votezkproof/target/*.json circuits/
