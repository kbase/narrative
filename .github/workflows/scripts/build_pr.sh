#! /usr/bin/env bash

export MY_ORG=$(echo "${GITHUB_REPOSITORY}" | awk -F / '{print $1}')
if [ "${GITHUB_BASE_REF}" != "master" ]; then
    export SUFFIX="-""${GITHUB_BASE_REF}"
else
    export SUFFIX=""
fi

export MY_APP=$(echo $(echo "${GITHUB_REPOSITORY}" | awk -F / '{print $2}')"${SUFFIX}")
export DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export COMMIT=$(echo "$SHA" | cut -c -7)
export NARRATIVE_VERSION_NUM=`grep '\"version\":' src/config.json.templ | awk '{print $2}' | sed 's/"//g'`
export NARRATIVE_GIT_HASH=`grep '\"git_commit_hash\":' src/config.json.templ | awk '{print $2}' | sed 's/"//g' | sed 's/,//'`
export MY_APP_VERSION="$MY_APP"_version

echo building image ghcr.io/"$MY_ORG"/"$MY_APP":"pr-""$PR"

# echo $DOCKER_TOKEN | docker login ghcr.io -u $DOCKER_ACTOR --password-stdin
echo docker build --build-arg BUILD_DATE="$DATE" \
             --build-arg VCS_REF="$COMMIT" \
             --build-arg BRANCH="$GITHUB_HEAD_REF" \
             --build-arg NARRATIVE_VERSION="$NARRATIVE_VERSION_NUM" \
             --label us.kbase.vcs-pull-req="$PR" \
             -t ghcr.io/"$MY_ORG"/"$MY_APP":"pr-""$PR" \
             .
echo docker push ghcr.io/"$MY_ORG"/"$MY_APP":"pr-""$PR"

if [ "${GITHUB_BASE_REF}" != "truss" ]; then

    echo docker tag ghcr.io/"$MY_ORG"/"$MY_APP":"pr-""$PR" kbase/narrative:tmp

    echo building image ghcr.io/"$MY_ORG"/"$MY_APP_VERSION":"pr-""$PR"
    echo docker build --build-arg BUILD_DATE=$DATE \
                --build-arg VCS_REF=$COMMIT \
                --build-arg BRANCH="$GITHUB_HEAD_REF" \
                --build-arg NARRATIVE_VERSION="$NARRATIVE_VERSION_NUM" \
                --build-arg NARRATIVE_GIT_HASH="$NARRATIVE_GIT_HASH" \
                --label us.kbase.vcs-pull-req="$PR" \
                -t ghcr.io/"$MY_ORG"/"$MY_APP_VERSION":"pr-""$PR" \
                -f Dockerfile2 \
                .

    echo docker rmi kbase/narrative:tmp
    echo docker push ghcr.io/"$MY_ORG"/"$MY_APP_VERSION":"pr-""$PR"
fi
