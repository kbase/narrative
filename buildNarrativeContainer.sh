#!/bin/bash

DS=$( date +%Y%m%d )

# This is the name for now, as this is what the Lua provisioner looks for to fire up a Narrative.
NAR_NAME="sychan/narrative"

# For everything else to flow right, the container needs to be built from one level above the narrative directory.
# It needs these files, so temporarily copy them outside.
cp docker/Dockerfile ..
cp docker/r-packages.R ..
cp docker/sources.list ..
cd ..

# Build the Narrative container and tag it (as a backup)
docker build -q -t $NAR_NAME .
docker tag $NAR_NAME:latest $NAR_NAME:$DS

# Remove the temp files.
rm Dockerfile r-packages.R sources.list