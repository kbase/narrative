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
export MY_APP_VERSION="$MY_APP"_version
export NARRATIVE_VERSION_NUM=`grep '\"version\":' src/config.json.templ | awk '{print $2}' | sed 's/"//g'`
echo MY_APP is $MY_APP

tag_image() {
    echo Running tag image commands
    echo docker pull ghcr.io/"$MY_ORG"/"$1":"pr-""$PR"
    echo docker tag ghcr.io/"$MY_ORG"/"$1":"pr-""$PR" ghcr.io/"$MY_ORG"/"$MY_APP":"latest"
    echo docker tag ghcr.io/"$MY_ORG"/"$1":"pr-""$PR" ghcr.io/"$MY_ORG"/"$MY_APP":"$NARRATIVE_VERSION_NUM"
    echo docker push ghcr.io/"$MY_ORG"/"$1":"$NARRATIVE_VERSION_NUM"
    echo docker push ghcr.io/"$MY_ORG"/"$1":"latest"
    # docker pull ghcr.io/"$MY_ORG"/"$1":"pr-""$PR"
    # docker tag ghcr.io/"$MY_ORG"/"$1":"pr-""$PR" ghcr.io/"$MY_ORG"/"$MY_APP":"latest"
    # docker tag ghcr.io/"$MY_ORG"/"$1":"pr-""$PR" ghcr.io/"$MY_ORG"/"$MY_APP":"$NARRATIVE_VERSION_NUM"
    # docker push ghcr.io/"$MY_ORG"/"$1":"$NARRATIVE_VERSION_NUM"
    # docker push ghcr.io/"$MY_ORG"/"$1":"latest"
}

echo $DOCKER_TOKEN | docker login ghcr.io -u $DOCKER_ACTOR --password-stdin
tag_image $MY_APP
tag_image $MY_APP_VERSION
