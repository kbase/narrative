#!/bin/bash
root=$(git rev-parse --show-toplevel)
dir=kbase-extension/static/kbase
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
	--mount type=bind,src=${root}/${dir},dst=${container_root}/${dir} \
	--rm kbase/narrative:dev
