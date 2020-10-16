#! /usr/bin/env bash

export MY_ORG=$(echo "${GITHUB_REPOSITORY}" | awk -F / '{print $1}')
export MY_APP=$(echo $(echo "${GITHUB_REPOSITORY}" | awk -F / '{print $2}')"-develop")
export DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export COMMIT=$(echo "$SHA" | cut -c -7)

docker login -u "$DOCKER_ACTOR" -p "$DOCKER_TOKEN" ghcr.io
docker pull ghcr.io/"$MY_ORG"/"$MY_APP":"pr-""$PR"
docker tag ghcr.io/"$MY_ORG"/"$MY_APP":"pr-""$PR" ghcr.io/"$MY_ORG"/"$MY_APP":"latest"
docker push ghcr.io/"$MY_ORG"/"$MY_APP":"latest"
