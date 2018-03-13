# Running Narrative in local Docker

It is useful to run the Narrative within a local docker container. E.g. this makes it easy to work on Narrative ui locally integrated with a local instance of kbase-ui.

The following changes are required:

- omit the line `RUN grunt minify` from /Dockerfile

- build the image manually. 

    The makefile has a tag of 1.0.3, we don't need that, so just use a more convenient "dev" tag for local usage.

    ```bash
    docker build -t kbase/narrative:dev .
    ```

- start the container using the `scripts/local-dev-run.sh` script. 

    This script starts the narrative image using features to integrate it with local kbase-ui.

    ```bash
    env=ci bash scripts/local-dev-run.sh
    ```

    where env sets the ENVIRON environment variable for the Docker container; ci is the environment in which you are working (needs to be same as the ui is running on.)

    - uses the config set $env; makes it easy to test different environments alongside ui
    - uses kbase-dev network; allows interoperation with the kbase-ui proxier 
    - uses name "narrative"; same
    - mounts kbase static directory inside container; allows editing files on host and having changes reflected with a Narrative reload
    - removes container when done; easy cleanup
    - uses "dev" tagged container; matches the docker build task above

## Notes

The container can't be killed with Ctrl-C; you'll need to stop it using Docker or another tool like Kitematic.

If you need to update or change dependencies (bower.json), you'll need to rebuild the image.

