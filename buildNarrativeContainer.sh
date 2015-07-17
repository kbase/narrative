#!/bin/bash

VER_OUTFILE="/kb/deployment/ui-common/narrative_version"
DS=$( date +%Y%m%d%H%M )

NAR_BASE_DIR=${PWD##*/}

# This is the name for now, as this is what the Lua provisioner looks for to fire up a Narrative.
NAR_NAME="kbase/narrative"
NAR_BASE="base3.0"

# Update the git submodule(s)
git submodule init
git submodule update

# Start by updating the config file to include the current git commit hash and timestamp
src/scripts/kb-git-version -f src/config.json -o $VER_OUTFILE

# Compile Javascript down into an itty-bitty ball.
cd src/notebook/ipython_profiles/profile_narrative/kbase_templates
npm install
grunt build

# For everything else to flow right, the container needs to be built from one level above the narrative directory.
# It needs these files, so temporarily copy them outside.
cd ../../../../../../

docker images |grep "^$NAR_NAME "|grep " $NAR_BASE " > /dev/null

if [ $? -eq 1 ] ; then
  echo "Build base image"
  cp $NAR_BASE_DIR/docker/Dockerfile.base ./Dockerfile
  cp $NAR_BASE_DIR/docker/r-packages.R $NAR_BASE_DIR/docker/sources.list ./
  cp -r $NAR_BASE_DIR/docker/narrative_python_packages ./
  docker build -q -t $NAR_NAME:$NAR_BASE .
  rm Dockerfile r-packages.R sources.list
  rm -r narrative_python_packages
fi

echo "Building latest version"
cp $NAR_BASE_DIR/docker/Dockerfile.update ./Dockerfile

# Build the Narrative container and tag it (as a backup)
docker build -q -t $NAR_NAME .
docker tag $NAR_NAME:latest $NAR_NAME:$DS

# Remove the temp files.
rm Dockerfile

# Remove any provisioned, but not used, containers
curl -L -X DELETE http://localhost/proxy_map/provisioned
