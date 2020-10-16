root=$(git rev-parse --show-toplevel)
kbase_dir=kbase-extension
src_dir=src
test_dir=test
ext_components_dir=kbase-extension/static/ext_components
nbextension_dir=nbextensions
container_root=/kb/dev_container/narrative/
if [ -z "$ENV" ]; then
	echo "The 'ENV' environment variable is required, set to either ci, next, appdev, or prod"
	exit 1
fi
if [ -z "$PORT" ]; then
	$PORT=8888
fi
echo "Starting Narrative for environment '${ENV}'"

mount_local_dirs="${mount:-t}"

if [ "${mount_local_dirs}" == "t" ]; then
	echo "Mounting local dirs ${mount_local_dirs}"
	docker run \
		--dns=8.8.8.8 \
		-e "CONFIG_ENV=${ENV}" \
		-p ${PORT}:8888 \
		--network=kbase-dev \
		--name=narrative  \
		--mount type=bind,src=${root}/${kbase_dir},dst=${container_root}/${kbase_dir} \
		--mount type=bind,src=${root}/${test_dir},dst=${container_root}/${test_dir} \
		--mount type=bind,src=${root}/${src_dir},dst=${container_root}/${src_dir} \
		--mount type=bind,src=${root}/${nbextension_dir},dst=${container_root}/kbase-extension/static/${nbextension_dir} \
		--rm -it \
		kbase/narrative:dev
else
	echo "Not mounting local dirs ${mount}"
	docker run \
		--dns=8.8.8.8 \
		-e "CONFIG_ENV=${ENV}" \
		-p ${PORT}:8888 \
		--network=kbase-dev \
		--name=narrative  \
		--rm -it \
		kbase/narrative:dev
fi

