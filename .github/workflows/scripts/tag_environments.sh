
#! /usr/bin/env bash
# Add vars for PR & environments to yaml, as called from external script

export MY_ORG=$(echo "${GITHUB_REPOSITORY}" | awk -F / '{print $1}')
export MY_APP=$(echo "${GITHUB_REPOSITORY}" | awk -F / '{print $2}')
export DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export COMMIT=$(echo "$SHA" | cut -c -7)

if [ $DEV_PROD = "dev" ] || [ $DEV_PROD = "develop" ]
then
  IMAGE=$MY_APP"-develop"
else
  IMAGE=$MY_APP
fi

echo "Dev or Prod:" $DEV_PROD
docker login -u "$DOCKER_ACTOR" -p "$DOCKER_TOKEN" ghcr.io
docker pull ghcr.io/"$MY_ORG"/"$IMAGE":"$IMAGE_TAG"
docker tag ghcr.io/"$MY_ORG"/"$IMAGE":"$IMAGE_TAG" ghcr.io/"$MY_ORG"/"$IMAGE":"$TARGET"
docker push ghcr.io/"$MY_ORG"/"$IMAGE":"$TARGET"
