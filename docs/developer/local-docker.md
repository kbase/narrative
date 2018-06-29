# Running Narrative in local Docker

It is useful to run the Narrative within a local docker container. E.g. this makes it easy to work on Narrative ui locally integrated with a local instance of kbase-ui.



## Narrative

The following changes are required:

- Build the docker image using the make target "dev_image", this builds the docker image without the "grunt minify" step.
  The image will be tagged kbase/narrative:dev instead of the current git branch

- start the container using the `scripts/local-dev-run.sh` script. 

    This script starts the narrative image using features to integrate it with local kbase-ui.

    ```bash
    env=ci bash scripts/local-dev-run.sh
    ```

    where env sets the CONFIG_ENV environment variable for the Docker container; ci is the environment in which you are working (needs to be same as the ui is running on.)

    - uses the config set $env; makes it easy to test different environments alongside ui
    - uses kbase-dev network; allows interoperation with the kbase-ui proxier 
    - uses name "narrative"; same
    - mounts kbase static directory inside container; allows editing files on host and having changes reflected with a Narrative reload
    - removes container when done; easy cleanup
    - uses "dev" tagged container; matches the docker build task above

## Notes

The container can't be killed with Ctrl-C; you'll need to stop it using Docker or another tool like Kitematic.

If you need to update or change dependencies (bower.json), you'll need to rebuild the image.

### config.json changes

The Dockerfile runs 'src/scripts/kb-update-config' to generate '/kb/deployment/ui-common/narrative_version'. This script has the unfortunate side effect of overwriting the config file source in /src/config.json.
This is a little frustrating because it means that a committer has to be very careful to omit this file when building the image for development or testing.


## kbase-ui

The kbase-ui proxier needs to route narrative requests. In order to enable this, the proxier's nginx config needs to be modified:

- in your kbase-ui repo

- edit tools/proxier/docker/src/conf/nginx.conf.tmpl

- comment out the line `proxy_pass https://{{ .Env.deploy_ui_hostname }}/narrative;` and uncomment the line below it

- comment out the line `proxy_pass https://{{ .Env.deploy_hostname }}/narrative;` and uncomment the line below it.

- rebuild the proxier image: make proxier-image

- launch the proxier image: make run-proxier-image env=ci

## Done?

You should now be able to navigate to https://ci.kbase.us, log in, and pull a Narrative from the Dashboard.

## Full Recipe

TODO: all steps to from zero to hero.

TODO: copy version of this doc into kbase-ui docs.