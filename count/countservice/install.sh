#!/bin/bash

pushd ../mockvotezkproof/
nargo check
nargo compile
nargo prove
nargo verify
popd
mkdir -p artifacts
cp ../mockvotezkproof/target/* artifacts/
pushd ../countvproof/
nargo check
nargo compile
popd
cp ../countvproof/target/* artifacts/
