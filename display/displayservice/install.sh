#!/bin/bash

#!/bin/bash

pushd ../sumvproof/
nargo check
nargo compile
popd
mkdir -p circuits
cp ../sumvproof/target/* circuits/
ln -sf ../displayui/src/artifacts artifacts
