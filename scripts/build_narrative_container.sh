#!/bin/bash

VER_OUTFILE="/kb/deployment/ui-common/narrative_version"
DS=$( date +%Y%m%d%H%M )

# This is the name for now, as this is what the Lua provisioner looks for to fire up a Narrative.
NAR_NAME="kbase/narrative"
NAR_BASE="kbase/narrbase"
NAR_BASE_VER="4.3"
NAR_PREREQ="kbase/narrprereq"
NAR_PREREQ_VER="1.1"
WEBROOT_DIR="/kb/deployment/services/kbase-ui"

# Make sure the prereq image is there. If not, build it.
docker images |grep "^$NAR_PREREQ "|grep " $NAR_PREREQ_VER " > /dev/null

if [ $? -eq 1 ] ; then
    echo "Build prereq image"
    docker build -q -t $NAR_PREREQ:$NAR_PREREQ_VER narrprereq-image/
fi

# Make sure the base image is there. If not, build it.
docker images |grep "^$NAR_BASE "|grep " $NAR_BASE_VER " > /dev/null

if [ $? -eq 1 ] ; then
  echo "Build base image"
  docker build -q -t $NAR_BASE:$NAR_BASE_VER narrbase-image/
fi

echo "Building latest version"

# Build the Narrative container and tag it (as a backup)
docker build -q -t $NAR_NAME .
docker tag $NAR_NAME:latest $NAR_NAME:$DS

# Update the Git hash in the config file to be hosted at *.kbase.us/narrative_version
./src/scripts/kb-git-version -f src/config.json -o $WEBROOT_DIR/narrative_version
cp kbase-extension/static/kbase/config/data_source_config.json $WEBROOT_DIR/data_source_config.json

# Remove any provisioned, but not used, containers
curl -L -X DELETE http://localhost/proxy_map/provisioned || echo "Ignore Error"
