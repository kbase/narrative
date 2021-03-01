# Running Narrative in local Docker

It is useful to run the Narrative within a local docker container. E.g. this makes it easy to work on Narrative ui locally integrated with a local instance of kbase-ui.

## Narrative

The following changes are required:

- Build the docker image using the make target "dev_image", this builds the docker image without the "npm run minify" step.
  The image will be tagged kbase/narrative:dev instead of the current git branch

  ```bash
  make dev-image
  ```

- start the container:

    ```bash
    ENV={ci/next/prod} [PORT=<some port number>] make run-dev-image
    ```

    where:

      - `ENV` sets the `CONFIG_ENV` environment variable for the Docker container; ci is the environment in which you are working (needs to be same as the ui is running on.)
      - `PORT` sets the host port that can be used. E.g. if you use PORT=12345, then http://localhost:12345 will start the Narrative. Default is 8888.
        - Note that the logging on the console will always show 8888 since that will be used internal to the container.
      - uses the config set $env; makes it easy to test different environments alongside ui
      - uses kbase-dev network; allows interoperation with the kbase-ui proxier
      - uses name "narrative"; same
      - mounts kbase static directory inside container; allows editing files on host and having changes reflected with a Narrative reload
      - removes container when done; easy cleanup
      - uses "dev" tagged container; matches the docker build task above

## Integration Tests

Integration tests with Narrative running within a container are essentially the same as running on localhost, we just need an extra option:

```bash
KBASE_TEST_TOKEN=YOUR_TOKEN_HERE BASE_URL=https://ci.kbase.us make test-integration
```

E.g.
```bash
SERVICE=selenium-standalone BROWSER=chrome HEADLESS=f BASE_URL=https://ci.kbase.us KBASE_TEST_TOKEN=TOKEN_HERE make test-integration
```

The `BASE_URL` option will override the default test runner behavior, which is to launch a local narrative instance.

This will launch the integration test  runner against the CI environment, using chrome browser, and using the chromedriver testing service.

This may all be overridden.

### Additional Options

The default test configuration may be overridden with the usage of environment variables:

- `ENV` indicates the deployment environment, either `ci`, `next`, `narrative-dev`, or `prod`. Additional  values may be used, but if they are not supported in all the tests, the tests will fail. Defaults to `ci`.
- `SERVICE` indicates the testing service. Currently supported services are `chromedriver` and `selenium-standalone`; defaults to `chromedriver`.
- `SERVICE_USER` for a remote service this provides the user account id
- `SERVICE_KEY` for a remote service this indicates the authorization key for using the account
- `BROWSER` indicates the browser to test against; `chrome` and `firefox` are supported; defaults to `chrome`
- `HEADLESS` indicates that the browser should be run in headless mode; may be `t` or `f`; defaults to `t`


### Testing Scenarios

#### default local test

This is the default, documented integration test method:

```bash
make test-integration
```

- by default the default environment is `ci`, the default browser is `chrome`, and the default testing service is `chromedriver`.
- Note that this requires a local build, which you should have already conducted.
- starts up a narrative server on your host, in python
- if testing is interrupted, the port may be retained by the process, you should be prepared to run ` lsof -i -n -P | grep 32323 ` where `32323` is the default port
  - the symptom for this will be an error message when attempting to run the tests.

All of the testing options may be used

#### ci local container

#### narrative-dev local container


#### next local container

#### prod local container

## Notes

The container can't be killed with Ctrl-C; you'll need to stop it using Docker or another tool like Kitematic.

If you need to update or change dependencies (bower.json), you'll need to rebuild the image.

### config.json changes

The Dockerfile runs `src/scripts/kb-update-config` to generate `/kb/deployment/ui-common/narrative_version`. This script has the unfortunate side effect of overwriting the config file source in `/src/config.json`.
This is a little frustrating because it means that a committer has to be very careful to omit this file when building the image for development or testing.

## kbase-ui

The kbase-ui development proxy knows how to route to a local narrative container. To invoke this behavior add `local-narrative=t` to the start line as run from the kbase-ui repo:

```bash
make start env=ci build=dev build-image=f local-narrative=t
```

> Use `build-image=t` if you haven't built the kbase-ui image yet.

## Running against another environment

For testing against other KBase deployment environments, you can change the option `env` to `next`, `narrative-dev`, or `prod`. The Narrative will need to be restarted to point to that environment.

In the narratives repo:

```bash
ENV=next make run-dev-image
```

In the kbase-ui repo:

```bash
make start build-image=f env=next local-narrative=t
```

> Note that the integration tests do not directly support running against environments other than CI, due to the need to set up test narratives in each environment, and to pass an environment variable indicating which environment dataset to switch to.

## Done

You should now be able to navigate to https://ci.kbase.us, log in, and pull a Narrative from the Dashboard.
