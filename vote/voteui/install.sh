#!/bin/bash
set -x
pushd ../votezkproof
nargo check
nargo compile
popd
cd src
ln -sf ../../votezkproof/target circuits