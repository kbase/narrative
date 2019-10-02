#!/bin/bash

VER_OUTFILE="deployment/ui-common/narrative_version"
DS=$( date +%Y%m%d%H%M )

# This is the name for now, as this is what the Lua provisioner looks for to fire up a Narrative.
NAR_NAME="kbase/narrative"
NAR_VER_NAME="kbase/narrative_version"  # Image for serving up the narrative version
HEADLESS_NAME="kbase/narrative_headless"
NAR_BASE="kbase/narrbase"
NAR_BASE_VER="5.2"

# Get the current branch, so that we can tag images to branch
BRANCH=${TRAVIS_BRANCH:-`git symbolic-ref --short HEAD`}
# Use the branch unless we aere given am explicit DOCKER_TAG
NARRATIVE_VER=${DOCKER_TAG:-$BRANCH}
COMMIT=`git rev-parse --short HEAD`

WEBROOT_DIR="deployment/services/kbase-ui"
DOCKERFILE_HEADLESS="Dockerfile_headless"


function usage () {
    printf "usage: $0 [options]\n"
    printf "example: $0 -e ci -d true\n"
    printf "options:\n"
    printf "  {-h | --help} \n\tShow these help options.\n"
    printf "  {-e | --env} environment\n\tSet the environment the narrative should use.\n\t"
    printf "current options are ci, next, prod, appdev (default=ci)\n"
    printf "  {-d | --dev_mode} true/false\n\tSet developer mode true or false (default=true)\n"
}

# Arg parsing
env="ci"
dev_mode="true"
while [ $# -gt 0 ]; do
    case $1 in
        -h | --help | -\?)
            usage
            exit 0
            ;;
        -e | --env)
            env=$2
            shift 2
            ;;
        -d | --dev_mode)
            dev_mode=$2
            shift 2
            ;;
        *)
            usage
            exit 0
            ;;
    esac
done

# Update the Git hash in the config file to be hosted at *.kbase.us/narrative_version
echo "Updating configuration"
mkdir -p $WEBROOT_DIR
./src/scripts/kb-update-config -f src/config.json.templ -o $WEBROOT_DIR/narrative_version -e $env -d $dev_mode || exit 1
cp kbase-extension/static/kbase/config/data_source_config.json $WEBROOT_DIR/data_source_config.json

# Make sure the base image is there. If not, build it.
echo "Checking for base image v$NAR_BASE_VER"
docker images |grep "^$NAR_BASE "|grep " $NAR_BASE_VER " > /dev/null

if [ $? -eq 1 ] ; then
  echo "Base image $NAR_BASE:$NAR_BASE_VER not found! Checking Dockerhub..."
  docker pull $NAR_BASE:$NAR_BASE_VER
fi

if [ $? -eq 1 ] ; then
  echo "Base image not found on Dockerhub either! Building..."
  docker build -t $NAR_BASE:$NAR_BASE_VER narrbase-image/
  echo "Done. Recommend pushing this back to Dockerhub."
fi

echo "Building latest narrative version"

# Build the Narrative container and tag it (as a backup)
# Force the entrypoint to "headless-narrative" for the headless
# narrative runner
export NARRATIVE_VERSION_NUM=`grep '\"version\":' src/config.json.templ | awk '{print $2}' | sed 's/"//g'`
export DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"`

docker build -t $NAR_NAME:$NARRATIVE_VER \
                --build-arg BUILD_DATE=$DATE \
                --build-arg VCS_REF=$COMMIT \
                --build-arg BRANCH=$BRANCH \
                --build-arg NARRATIVE_VERSION=$NARRATIVE_VERSION_NUM \
                --build-arg BRANCH=$BRANCH \
                --build-arg SKIP_MINIFY=$SKIP_MINIFY \
                .
docker tag $NAR_NAME:$NARRATIVE_VER $NAR_NAME:$COMMIT

# Give the image a fixed name because dockfile FROM fields cannot take a variable/argument
# and we're using the output from the previous build in this 2nd container
docker tag $NAR_NAME:$NARRATIVE_VER kbase/narrative:tmp
docker build -t $NAR_VER_NAME:$NARRATIVE_VER \
                --build-arg BUILD_DATE=$DATE \
                --build-arg VCS_REF=$COMMIT \
                --build-arg BRANCH=$BRANCH \
                --build-arg NARRATIVE_VERSION=$NARRATIVE_VERSION_NUM \
                --build-arg BRANCH=$BRANCH \
                -f Dockerfile2 \
                .
docker tag $NAR_VER_NAME:$NARRATIVE_VER $NAR_VER_NAME:$COMMIT
docker rmi kbase/narrative:tmp

# Remove any provisioned, but not used, containers
curl -k -X DELETE https://localhost/proxy_map/provisioned || echo "Ignore Error"
