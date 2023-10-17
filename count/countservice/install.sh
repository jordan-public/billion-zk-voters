#!/bin/bash

pushd ../mockvotezkproof/
nargo check
nargo compile
nargo prove
nargo verify
popd
mkdir -p circuits
cp ../mockvotezkproof/target/* circuits/
pushd ../countvproof/
nargo check
nargo compile
popd
cp ../countvproof/target/* circuits/
