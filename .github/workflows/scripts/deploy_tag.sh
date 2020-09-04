#! /usr/bin/env bash

# Usage: ./deploy_tag.sh -e TARGET -o ORG -r REPO -s DEV_PROD -t IMAGE_TAG
#
# Example 1: ./deploy_tag.sh -o "kbase" -r "narrative-traefiker" -s "dev" -t "pr-9001" -e "ci"
# Example 2: ./deploy_tag.sh -o "kbase" -r "narrative" -s "prod" -t "latest" -e "next"
#
# Where:
#   -o ORG is the organization (`kbase`, `kbaseapps`, etc.)
#   -r REPO is the repository (e.g. `narrative`)
#   -s DEV_PROD determines whether to pull the development {APPNAME}-develop or production {APPNAME} image.
#   -t IMAGE_TAG is the *current* Docker image tag, typically `pr-#` or `latest`
#   -e TARGET is one of: `appdsshev`, `ci`, or `next`
#
# Be sure to set $TOKEN first!
# See: https://docs.github.com/en/packages/getting-started-with-github-container-registry/migrating-to-github-container-registry-for-docker-images#authenticating-with-the-container-registry


while getopts e:o:r:s:t: option
  do
   case "${option}"
    in
      e) TARGET=${OPTARG};;
      o) ORG=${OPTARG};;
      r) REPO=${OPTARG};;
      s) DEV_PROD=${OPTARG};;
      t) IMAGE_TAG=${OPTARG};;
    esac
done

curl -H "Authorization: token $TOKEN" \
    -H 'Accept: application/vnd.github.everest-preview+json' \
    "https://api.github.com/repos/$ORG/$REPO/dispatches" \
    -d '{"event_type":"Tag '"$DEV_PROD"' '"$IMAGE_TAG"' for '"$TARGET"'", "client_payload": {"image_tag": "'"$IMAGE_TAG"'","target": "'"$TARGET"'","dev_prod": "'"$DEV_PROD"'"}}'
