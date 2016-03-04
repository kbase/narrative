#!/bin/bash

VER_OUTFILE="/kb/deployment/ui-common/narrative_version"
DS=$( date +%Y%m%d%H%M )

# This is the name for now, as this is what the Lua provisioner looks for to fire up a Narrative.
NAR_NAME="kbase/narrative"
NAR_BASE="kbase/narrbase"
NAR_BASE_VER="4.3"
NAR_PREREQ="kbase/narrprereq"
NAR_PREREQ_VER="1.1"
WEBROOT_DIR="/kb/deployment/services/kbase-ui"

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
./src/scripts/kb-update-config -f src/config.json -o $WEBROOT_DIR/narrative_version -e $env -d $dev_mode || exit 1
cp kbase-extension/static/kbase/config/data_source_config.json $WEBROOT_DIR/data_source_config.json

# Make sure the prereq image is there. If not, build it.
echo "Checking for prereq image v$NAR_PREREQ_VER"
docker images |grep "^$NAR_PREREQ "|grep " $NAR_PREREQ_VER " > /dev/null

if [ $? -eq 1 ] ; then
    echo "Prereq image not found! Building..."
    docker build -q -t $NAR_PREREQ:$NAR_PREREQ_VER narrprereq-image/
fi

# Make sure the base image is there. If not, build it.
echo "Checking for base image v$NAR_BASE_VER"
docker images |grep "^$NAR_BASE "|grep " $NAR_BASE_VER " > /dev/null

if [ $? -eq 1 ] ; then
  echo "Base image not found! Building..."
  docker build -q -t $NAR_BASE:$NAR_BASE_VER narrbase-image/
fi

echo "Building latest narrative version"

# Build the Narrative container and tag it (as a backup)
docker build -q -t $NAR_NAME .
docker tag $NAR_NAME:latest $NAR_NAME:$DS

# Remove any provisioned, but not used, containers
curl -k -X DELETE https://localhost/proxy_map/provisioned || echo "Ignore Error"
