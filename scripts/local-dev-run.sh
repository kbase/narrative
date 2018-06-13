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
	-e "CONFIG_ENV=${env}" \
	--network=kbase-dev \
	--name=narrative  \
	--mount type=bind,src=${root}/${static_dir},dst=${container_root}/${static_dir} \
	--mount type=bind,src=${root}/${ext_components_dir},dst=${container_root}/${ext_components_dir} \
	--mount type=bind,src=${root}/${nbextension_dir},dst=${container_root}/kbase-extension/static/${nbextension_dir} \
	--rm kbase/narrative:dev
