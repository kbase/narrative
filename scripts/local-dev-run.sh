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
echo "Starting Narrative for environment '${env}'"

if [ "${mount}" == "t" ]; then
	docker run \
		--dns=8.8.8.8 \
		-e "CONFIG_ENV=${env}" \
		--network=kbase-dev \
		--name=narrative  \
		--mount type=bind,src=${root}/${static_dir},dst=${container_root}/${static_dir} \
		--mount type=bind,src=${root}/${nbextension_dir},dst=${container_root}/kbase-extension/static/${nbextension_dir} \
		--rm -it \
		kbase/narrative:dev
else
	echo "Not mounting local dirs ${mount}"
	docker run \
		--dns=8.8.8.8 \
		-e "CONFIG_ENV=${env}" \
		--network=kbase-dev \
		--name=narrative  \
		--rm -it \
		kbase/narrative:dev
fi

