#! /usr/bin/env bash

# Usage: ./deploy_tag.sh IMAGE_TAG TARGET DEV_PROD
#
# Example 1: ./deploy_tag.sh latest ci dev
# Example 2: ./deploy_tag.sh pr-9001 next prod
#
# Where:
#   IMAGE_TAG is either the pull request (e.g. `pr-9001`) or `latest`
#   TARGET is one of: `appdev`, `ci`, or `next`
#   DEV_PROD is the source of the above IMAGE_TAG:
#     If set to `dev`, then the image will be pulled from the `APPNAME-develop` image
#     Otherwise, it'll pull the (pre)production `APPNAME` image
#
# Be sure to set $TOKEN first!
# See: https://docs.github.com/en/packages/getting-started-with-github-container-registry/migrating-to-github-container-registry-for-docker-images#authenticating-with-the-container-registry

IMAGE_TAG=$1
TARGET=$2
DEV_PROD=$3

curl -v -H "Authorization: token $TOKEN" \
    -H 'Accept: application/vnd.github.everest-preview+json' \
    "https://api.github.com/repos/kbase/narrative/dispatches" \
    -d '{"event_type":"Tag '"$IMAGE_TAG"' for '"$TARGET"'", "client_payload": {"image_tag": "'"$IMAGE_TAG"'","target": "'"$TARGET"'","dev_prod": "'"$DEV_PROD"'"}}'
