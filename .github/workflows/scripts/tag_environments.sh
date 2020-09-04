
#! /usr/bin/env bash
# Add vars for PR & environments to yaml, as called from external script

export MY_APP=$(echo "${GITHUB_REPOSITORY}"/$(echo "$GITHUB_REPOSITORY" | awk -F / '{print $2}' | sed -e "s/:refs//"))
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
docker login -u "$DOCKER_ACTOR" -p "$DOCKER_TOKEN" docker.pkg.github.com
docker pull docker.pkg.github.com/"$IMAGE":"$IMAGE_TAG"
docker tag docker.pkg.github.com/"$IMAGE":"$IMAGE_TAG" docker.pkg.github.com/"$IMAGE":"$TARGET"
docker push docker.pkg.github.com/"$IMAGE":"$TARGET"
