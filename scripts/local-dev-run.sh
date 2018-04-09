#!/bin/bash
root=$(git rev-parse --show-toplevel)
static_dir=kbase-extension/static/kbase
ext_components_dir=kbase-extension/static/ext_components
nbextension_dir=nbextensions
container_root=/kb/dev_container/narrative/
if [ -z $env ]; then
	echo "The 'env' environment variable is required"
	exit 1
fi
docker run \
	--dns=8.8.8.8 \
	-e "ENVIRON=${env}" \
	--network=kbase-dev \
	--name=narrative  \
	--rm kbase/narrative:dev