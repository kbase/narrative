root=$(git rev-parse --show-toplevel)
# Most of KBase javascript source; directory structure does not allow
# mounting all of it because npm dependencies are installed within static.
# Best would be one parent directory for KBase JS, one for all installed.
# Note that if you want to fiddle with dependencies locally w/in the image
# you can add a --mount of the entirety of kbase-extension
narrative_paths=kbase-extension/static/narrative_paths.js
kbase_dir=kbase-extension/static/kbase
src_dir=src
test_dir=test
ext_components_dir=kbase-extension/static/ext_components
nbextension_dir=nbextensions
container_root=/kb/dev_container/narrative/

#
# We need the ENV to pass in to the Narrative for selecting the config.
#
if [ -z "$ENV" ]; then
	echo "The 'ENV' environment variable is required, set to either ci, next, appdev, or prod"
	exit 1
fi

#
# This port is exposed on the host.
#
if [ -z "$PORT" ]; then
	PORT=8888
fi
echo "Starting Narrative for environment '${ENV}'"

mount_local_dirs="${MOUNT:-t}"

if [ "${mount_local_dirs}" == "t" ]; then
	echo "Mounting local dirs ${mount_local_dirs}"
	docker run \
		--dns=8.8.8.8 \
		-e "CONFIG_ENV=${ENV}" \
		-p "${PORT}:8888" \
		--network=kbase-dev \
		--name=narrative  \
 		--mount "type=bind,src=${root}/${kbase_dir},dst=${container_root}/${kbase_dir}" \
 		--mount "type=bind,src=${root}/${narrative_paths},dst=${container_root}/${narrative_paths}" \
		--mount "type=bind,src=${root}/${test_dir},dst=${container_root}/${test_dir}" \
		--mount "type=bind,src=${root}/${src_dir},dst=${container_root}/${src_dir}" \
		--mount "type=bind,src=${root}/${nbextension_dir},dst=${container_root}/kbase-extension/static/${nbextension_dir}" \
		--rm -it \
		"${IMAGE:-kbase/narrative:dev}"

else
	echo "Not mounting local dirs ${MOUNT}"
	docker run \
		--dns=8.8.8.8 \
		-e "CONFIG_ENV=${ENV}" \
		-p "${PORT}:8888" \
		--network=kbase-dev \
		--name=narrative  \
		--rm -it \
		kbase/narrative:dev
fi
