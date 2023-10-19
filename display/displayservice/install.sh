#!/bin/bash
set -x

mkdir -p circuits
cp ../sumvproof/target/* circuits/
ln -sf ../displayui/src/artifacts artifacts
