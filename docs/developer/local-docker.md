# Running Narrative in local Docker

It is useful to run the Narrative within a local docker container. E.g. this makes it
easy to work on Narrative ui locally integrated with a local instance of kbase-ui.

## Requirements

- make
- git
- docker
- nodejs 16
- nvm

> Sorry, this is just a quick guide, no instructions provided for installing these.

## Narrative

The following changes are required:

- Build the docker image using the make target "dev_image", this builds the docker image without the "npm run minify" step.
  The image will be tagged kbase/narrative:dev instead of the current git branch

  ```bash
  make dev-image
  ```

  > Note that this may produce an error, since the build attempts to attach to the running container.
  > For example
  > ```shell
  > Use 'docker scan' to run Snyk tests against images to find vulnerabilities and learn how to fix them
  > Untagged: kbase/narrative:tmp
  > curl: (7) Failed to connect to localhost port 443 after 6 ms: Couldn't connect to server
  > Ignore Error
  > ```

- start the container:

    ```bash
    ENV={ci/next/prod} [PORT=<some port number>] make run-dev-image
    ```

    where:

      - `ENV` sets the `CONFIG_ENV` environment variable for the Docker container; ci is the environment in which you are working (needs to be same as the ui is running on.)
      - `PORT` sets the host port that can be used. E.g. if you use PORT=12345, then http://localhost:12345 will start the Narrative. Default is 8888.
        - Note that the logging on the console will always show 8888 since that will be used internal to the container.
      - uses the config set in `$ENV`; makes it easy to test different environments alongside ui
      - uses `kbase-dev` network; allows interoperation with the kbase-ui proxier to access local services
      - uses container host name "narrative"
      - mounts `kbase-extension/static/kbase` directory inside container; allows editing files on host and having changes reflected with a Narrative reload
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

## Unit tests

Unit tests require a running Narrative server in order to access Jupyter javascript files which are only available when the server is built and running.

As a server, it can be accessed within a container as well, and for those who prefer Docker-based workflows, is quite convenient.

- run the container as specified above. For example:

```shell
make dev-image
ENV=ci make run-dev-image
```

Then, to run tests without authentication.

```shell
nvm use 16
npm install
NARRATIVE_SERVER_URL=http://localhost:8888 npm run test_local
```

> You are using `nvm` for node work on your host machine, aren't you? If not, please
> install it first.

To run with authentication, follow the normal instructions, but briefly:

- obtain a KBase token for a given user, such as yourself. This token does not require any special privileges.
- in `test/testConfig.json` you may change `SOMETESTUSER` to the associated username, or leave as is
- create `test/SOMETESTUSER.tok` (or using the actual username as changed above) and make the contents the token string.

### Other conveniences

The unit tests, by default, are quite noisy. To quiet them down make the following changes to the test configuration:

(all of these changes may not be necessary, but the combination of them does inhibit all logging, with just test results left)

- in `test/unit/karma.conf.js` change `logLevel: config.LOG_INFO,` to `logLevel: config.LOG_DISABLE,`

after the line:

```javascript
    config.reporters = ['kjhtml', 'brief'];
```

add this:

``` javascript
    config.briefReporter = {
        suppressBrowserLogs: true
    }
```

Now your tests, if they pass, will be quite pleasant to gaze upon:

```shell
erikpearson@Eriks-MacBook-Pro narrative % NARRATIVE_SERVER_URL=http://localhost:8888 npm run test_local

> kbase-narrative-core@5.1.3 test_local /Users/erikpearson/Work/KBase/2022/helpdesk/PTV-1620/pr2redux/narrative
> karma start test/unit/karma.local.conf.js


Chrome Headless 108.0.5359.124 (Mac OS 10.15.7) WARN: 'Loaded token file test/SOMETESTUSER.tok'
TOTAL: 13 SUCCESS 13 passed      0 failed      0 skipped            
   13 total       13 passed      0 failed      0 skipped 
```

To focus tests, you can modify `karma.local.conf.js`. Here we have focussed on the tests that
are directly contained within `test/unit/spec/widgets/*`, which at the moment, is just `kbaseTabs-spec.js`.

```javascript
 .concat([
            // To isolate groups of tests, uncomment ALL of the
            // exclude filters below, and comment the group you
            // want to test.
            //
            'test/unit/spec/*.js',
            'test/unit/spec/api/**/*',
            'test/unit/spec/appWidgets/**/*',
            'test/unit/spec/common/**/*',
            'test/unit/spec/function_output/*.js',
            'test/unit/spec/function_output/kbaseSampleSet/**/*',
            'test/unit/spec/function_output/modeling/**/*',
            'test/unit/spec/function_output/rna-seq/**/*',
            'test/unit/spec/jsonrpc/**/*',
            'test/unit/spec/narrative_core/**/*',
            'test/unit/spec/nbextensions/**/*',
            'test/unit/spec/util/**/*',
            'test/unit/spec/vis/**/*',
            'test/unit/spec/widgets/common/*',
            // 'test/unit/spec/widgets/*'
        ]);
```

You may also focus or exclude individual tests using the usual `f*` and `x*` prefixes
for `describe` and `it`. 

E.g. to only run a test group you can focus the `describe` function by prefixing the it
with an `f`:

```javascript
    fdescribe('The KBaseTabs widget', () => {
      ..
    }
```

or to exclude a cranky test you can prefix `it` with `x`:

```javascript
          xit('should render with minimal options', () => {
            const kbaseTabs = makeKBaseTabs({
```

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

If you need to update or change dependencies (package.json), you'll need to rebuild the image.

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

## Testing with a local container

Testing instructions assume that all JS and Python dependencies are installed locally, and that Narrative is built on the host for local usage.

This, however, is not necessary with the container, although it is necessary for now to install JS dependencies because tooling relies up it. Of course,
it would be possible to run any node-based tool via a simple node container, but that is for another day.

- Get the narrative running in one terminal window:
  - `make dev-image`
  - `ENV=ci make run-dev-image`
- In another terminal window:
  - `NARRATIVE_SERVER_URL=http://localhost:8888 npm run test_local`

Please note the volume mounts in `scripts/local-def-run.sh`. Not all directories in kbase-extension/static local narrative repo are mounted, due to
the fact that ext_components is installed.

To explain the `ext_` directories briefly.

- `ext_modules` is where all node modules should be placed; that is what it was originally designed for and a very few npm dependencies are placed there;
   it does not exist until the narrative is built.
- `ext_components` is where `node_modules` is copied to, for those bower components which were migrated to npm modules; it also does not exist until the
   narrative is built.
- `ext_packages` is where old dependencies which cannot be brought into the codebase as normal npm dependencies reside; it essentially never changes as
   it freezes certain dependencies that could not be brought in as bower dependencies when the narrative was converted from manually installed
   dependencies to bower.
