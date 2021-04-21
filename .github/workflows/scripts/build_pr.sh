#! /usr/bin/env bash

export MY_ORG=$(echo "${GITHUB_REPOSITORY}" | awk -F / '{print $1}')
if [ "${GITHUB_BASE_REF}" != "master" ]; then
    export SUFFIX="${GITHUB_BASE_REF}"
else
    export SUFFIX=""
fi

export MY_APP=$(echo $(echo "${GITHUB_REPOSITORY}" | awk -F / '{print $2}')"${SUFFIX}")
export DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export COMMIT=$(echo "$SHA" | cut -c -7)
export NARRATIVE_VERSION_NUM=`grep '\"version\":' src/config.json.templ | awk '{print $2}' | sed 's/"//g'`
export MY_APP2="$MY_APP"_version

echo $DOCKER_TOKEN | docker login ghcr.io -u $DOCKER_ACTOR --password-stdin
docker build --build-arg BUILD_DATE="$DATE" \
             --build-arg COMMIT="$COMMIT" \
             --build-arg BRANCH="$GITHUB_HEAD_REF" \
             --build-arg PULL_REQUEST="$PR" \
             --label us.kbase.vcs-pull-req="$PR" \
             -t ghcr.io/"$MY_ORG"/"$MY_APP":"pr-""$PR" .
docker push ghcr.io/"$MY_ORG"/"$MY_APP":"pr-""$PR"

docker tag ghcr.io/"$MY_ORG"/"$MY_APP":"pr-""$PR" kbase/narrative:tmp

docker build -t ghcr.io/"$MY_ORG"/"$MY_APP2":"pr-""$PR" \
                --build-arg BUILD_DATE=$DATE \
                --build-arg VCS_REF=$COMMIT \
                --build-arg BRANCH="$GITHUB_HEAD_REF" \
                --build-arg PULL_REQUEST="$PR" \
                --label us.kbase.vcs-pull-req="$PR" \
                --build-arg NARRATIVE_VERSION=$NARRATIVE_VERSION_NUM \
                -f Dockerfile2 \
                .
docker rmi kbase/narrative:tmp
docker push ghcr.io/"$MY_ORG"/"$MY_APP2":"pr-""$PR"
