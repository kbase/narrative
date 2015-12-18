#!/bin/bash

VER_OUTFILE="/kb/deployment/ui-common/narrative_version"
DS=$( date +%Y%m%d%H%M )

# This is the name for now, as this is what the Lua provisioner looks for to fire up a Narrative.
NAR_NAME="kbase/narrative"
NAR_BASE="kbase/narrbase"
NAR_BASE_VER="3.1"

docker images |grep "^$NAR_BASE "|grep " $NAR_BASE_VER " > /dev/null

if [ $? -eq 1 ] ; then
  echo "Build base image"
  docker build -q -t $NAR_BASE:$NAR_BASE_VER base/
fi

echo "Building latest version"
# Build the Narrative container and tag it (as a backup)
docker build -q -t $NAR_NAME .
docker tag $NAR_NAME:latest $NAR_NAME:$DS

# Remove any provisioned, but not used, containers
curl -L -X DELETE http://localhost/proxy_map/provisioned || echo "Ignore Error"
