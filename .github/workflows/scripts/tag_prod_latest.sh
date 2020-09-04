#! /usr/bin/env bash

export MY_APP=$(echo "${GITHUB_REPOSITORY}"/$(echo "$GITHUB_REPOSITORY" | awk -F / '{print $2}' | sed -e "s/:refs//"))
export DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export COMMIT=$(echo "$SHA" | cut -c -7)

docker login -u "$DOCKER_ACTOR" -p "$DOCKER_TOKEN" docker.pkg.github.com
docker pull docker.pkg.github.com/"$MY_APP":"pr-""$PR"
docker tag docker.pkg.github.com/"$MY_APP":"pr-""$PR" docker.pkg.github.com/"$MY_APP":"latest"
docker push docker.pkg.github.com/"$MY_APP":"latest"
