#! /usr/bin/env bash

export MY_ORG=$(echo "${GITHUB_REPOSITORY}" | awk -F / '{print $1}')
export MY_APP=$(echo "${GITHUB_REPOSITORY}" | awk -F / '{print $2}')
export DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export COMMIT=$(echo "$SHA" | cut -c -7)
export NARRATIVE_VERSION_NUM=`grep '\"version\":' src/config.json.templ | awk '{print $2}' | sed 's/"//g'`
export NARRATIVE_GIT_HASH=`grep '\"git_commit_hash\":' src/config.json.templ | awk '{print $2}' | sed 's/"//g' | sed 's/,//'`
export MY_APP2="$MY_APP"_version

docker login -u "$DOCKER_ACTOR" -p "$DOCKER_TOKEN" ghcr.io

docker build --build-arg BUILD_DATE="$DATE" \
             --build-arg COMMIT="$COMMIT" \
             --build-arg BRANCH="$GITHUB_HEAD_REF" \
             --build-arg PULL_REQUEST="$PR" \
             --label us.kbase.vcs-pull-req="$PR" \
             --label us.kbase.narrative-version="$NARRATIVE_VERSION_NUM" \
             -t ghcr.io/"$MY_ORG"/"$MY_APP":"pr-""$PR" .
docker push ghcr.io/"$MY_ORG"/"$MY_APP":"pr-""$PR"

docker build --build-arg BUILD_DATE=$DATE \
             --build-arg VCS_REF=$COMMIT \
             --build-arg BRANCH="$GITHUB_HEAD_REF" \
             --build-arg PULL_REQUEST="$PR" \
             --label us.kbase.vcs-pull-req="$PR" \
             --build-arg NARRATIVE_VERSION="$NARRATIVE_VERSION_NUM" \
             --build-arg NARRATIVE_GIT_HASH="$NARRATIVE_GIT_HASH" \
             -f Dockerfile2 \
             -t ghcr.io/"$MY_ORG"/"$MY_APP2":"pr-""$PR" .
docker push ghcr.io/"$MY_ORG"/"$MY_APP2":"pr-""$PR"
