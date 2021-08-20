# Integration Testing

## Contents

- For the impatient
- Files involved
- Command line options
- Topics
  - run against container
  - running against a testing service
  - run without Python
  - run against narrative-dev
  - running in in github actions
  - a minimal integration test run
  - a moderate integration test run
  - a comprehensive integration test run
  - test account and data

## For the impatient

- build local narrative
  - see [local install](./install/local_install.md) for complete instructions
  - or, briefly, and without explanation:
    - ensure you have virtualenv installed on your host machine
    - clone the narrative repo
        - `git clone https://github.com/kbase/narrative`
    - in the narrative repo dir, make a Python virtual environment
        - `cd narrative`
        - `virtualenv venv`
    - activate the virtual environment
        - `source ./venv/bin/activate`
    - build the narrative locally
        - `make install`
- obtain a KBase login (or dev) CI token
  - it must be either for the "narrativetest" account, or account which has view access to the same narratives as narrativetest (e.g. kbaseuitest).
  - log into `https://ci.kbase.us`
  - in the browser console issue
    - `document.cookie`
    - copy the value for the `kbase_session` cookie
- run the integration tests
  - `KBASE_TEST_TOKEN={YOUR_TOKEN} make test-integration`
  - where `{YOUR_TOKEN}` is the token copied above.

## Files involved

- `Makefile` top level test invocation
- `test/integration/WDIO.conf.js` WebDriverIO test runner file; contains logic for presets, defaults, etc.
- `test/integration/testUtils.js` a set of convenience functions for common test tasks
- `test/integration/specs/*_test.js` the actual test files
- `package.json` test library and service package installation

## Test parameters

All test parameters are supplied as environment variables with upper case names. All options other than `KBASE_TEST_TOKEN` have defaults, making the base testing workflow quite easy.

| Name                | Description                                                                                         | Required | Default                                    |
| ------------------- | --------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------ |
| `KBASE_TEST_TOKEN`  | A KBase login or dev token                                                                          | all      | n/a                                        |
| `ENV`               | KBase deployment environment                                                                        | all      | `ci`                                       |
| `BASE_URL`          | The base part of the url to access the running narrative                                            | all      | `http://localhost:8888`                   |
| `SERVICE`           | The WDIO service to use                                                                             | all      | `ChromeDriver`                             |
| `SERVICE_USER`      | If a remote testing service is used, specifies the testing service user id or account name          | bs       |                                            |
| `SERVICE_KEY`       | If a remote testing service is used, specifies the account key or password used for authentication. | bs       |                                            |
| `BROWSER`           | The browser model to use for testing                                                                | bs, ss   | `chrome`                                   |
| `BROWSER_VERSION`   | The version of the browser to use                                                                   | bs       | `latest`                                   |
| `HEADLESS`          | Whether the browser should render in a GUI or not                                                   | all      | `t`                                        |
| `WIDTH`             | The width of the browser viewport, in pixes.                                                        | all      | `1280`                                     |
| `HEIGHT`            | The height of the browser viewport, in pixels.                                                      | all      | `1024`                                     |
| `PRESET_DIMENSIONS` | A key indicating a set of predefined width and height pairs.                                        | all      | `sxga`                                     |
| `OS`                | The operating system model to use for online testing service)                                       | bs       | `Windows`                                  |
| `OS_VERSION`        | The operating system version to use for online testing services.                                    | bs       | `10` for `Windows`, `Catalina` for `OS X`. |
| `PRESET`            | A preset bundles several settings (see below)                                                       | all      | `cd`                                       |


### `KBASE_TEST_TOKEN`

Since narrative operation requires a valid KBase auth token, this should be considered a required test parameter.

The auth token may be any valid KBase auth token, including login and developer. 

> TODO: A small set of integration tests which specifically test behavior without a token should NOT have a token. This is future work.

### `ENV`

KBase deployment environment.

Note only `ci` (and partially `narrative-dev`) currently supported. Environment support requires the `narrativetest` account be set up, and test data available and configured in the tests, and this has only been completed for `ci`.

Accepted values should be:

- `ci`
- `next`
- `narrative-dev`
- `appdev`
- `next`
- `prod`

But as stated above, only `ci` is supported (with `narrative-dev` in the wings).

Defaults to `ci`.

### `BASE_URL`

The base url is used to form requests to the test browser, such as to load a narrative.

The default value of `http://localhost:8888` is based on the default behavior of the local development narrative. Even remote testing services use this default, as they connect to the narrative via a tunnel.

See the topic "Testing with local kbase-ui" for a use case for changing this from the default.

### `SERVICE`

The integration testing framework, WebDriver io (WDIO), relies on the concept of a "service" to provide an endpoint for testing directives.

As an aside, WebDriver is an api for remote control and inspection of browsers which facilitates integration testing. The WebDriver api is network-based -- it can be thus used to communicate with a WebDriver serve either locally or remotely.

Even when used locally, WDIO requires that a service be specified. The corresponding service must be installed by npm (or yarn) and specified in the repo's top level `package.json` file.

At present, three drivers are supported:

- `ChromeDriver` - a local, non-selenium endpoint for controlling a local chrome browser
- `selenium-standalone` - a local selenium instance with built-in drivers for chrome, FireFox, and safari. Requires java.
- `BrowserStack` - a remote testing service with support for a broad set of browser models and versions, operating systems and versions, and screen sizes.

__`ChromeDriver`__ supports only chrome on the local operating system. It defaults to the currently installed chrome version. Due to its speed and low number of dependencies (other than chrome), this is the current service used for github actions automated tests.

__`selenium-standalone`__ supports FireFox, chrome, and safari on the local operating system. It relies on a local instance of selenium, a java-based WebDriver endpoint which supports many browsers through "drivers", which is installed by the narrative's `package.json`.

Note that no separate selenium server needs to be installed or managed. The WDIO selenium-standalone service takes care of that.

This is the preferred testing service when testing locally. It is just as fast as ChromeDriver, but allows one to test with FireFox as well. (Safari support not working at the moment, but I've used it in the past successfully.)

It does support installation of different driver versions, which allows one to support additional browsers locally, but an online testing service is much better if one wants to expand to additional browsers, versions, operating systems.

It is not used for github action based testing at the moment due to lack of java in the narrative image. If java is added to the image, we may consider switching to it so that integration tests can cover FireFox as well.

__`BrowserStack`__ is an online selenium-based testing service with support for a broad range of browser models and versions, operating systems and versions, and screen sizes.

We have a free open-source account for up to 5 users, with unlimited testing.

BrowserStack tests take up to 5 times longer than local tests, so it is recommended that these tests be run only periodically or on special events, such as for PR or release acceptance.

### `SERVICE_USER`

Only applicable if `SERVICE` is an online testing service such as BrowserStack.

This string is equivalent to a username, and is unique for each user of the testing service. The testing service will indicate the value to use here.

### `SERVICE_KEY`

Only applicable if `SERVICE` is an online testing service such as BrowserStack.

This string is equivalent to an account password. It is generated at the testing service.

### `BROWSER`

The model of browser to use for testing.

Currently supported browsers are generally chrome and FireFox, but:

- ChromeDriver: chrome
- selenium-standalone: chrome, FireFox (safari doesn't seem to work at the moment)
- BrowserStack: chrome, FireFox (other browsers through custom options)

### `HEADLESS`

Whether to run the browser with a GUI or not (headless); `t` to run headless, `f` to run with GUI.

Defaults to `t`.

Most browsers support the ability to run "headless", or without a GUI. This is an important feature for running browsers on build servers which don't have displays or display dependencies installed.

Some considerations for scenarios:

- __local tests__: a matter of taste, but I sometimes prefer to see a browser GUI especially when creating tests in order to monitor browser behavior
- __build server (github actions)__: must be headless due to lack of GUI support
- __remote testing (BrowserStack)__: should be run with GUI if generating test run videos

### `WIDTH` and `HEIGHT`

The width and height of the browser viewport.

Defaults to `1280` and `1024` respectively.

It is important to set the browser width and height.

For one, it ensures consistent browser behavior. Tests involve access to and interaction with visible components, and visibility and inspection depends on whether an element is in the display area. Rendering itself may depend on whether an element is visible.

Secondly, browser testing services support a restricted set of browser dimensions, which differs between operating systems. We support preset dimensions based on the intersection of those supported by BrowserStack on MacOS and Windows.

### `PRESET_DIMENSIONS`

A string key which indicates a predefined width and height.

The default dimension preset is `sxga`, which corresponds to `1280` by `1024`.

The width and height are used by all test services. The presets are required by online test services, but it is best to stick with the presets unless there is a good reason not to.

### `OS`

The operating system to use for online test services, for which it is required. Ignored for local test services.

The value for `OS` depends on the testing service. For `BrowserStack`, the values we support are `Windows` and `OS X`.

### `OS_VERSION`

The operating system version for online test services, for which it is required. Ignored for local test services.

The value for `OS_VERSION` depends on the testing service.

> TODO: Add some examples from BrowserStack.

### `PRESET`

Presets are predefined sets of options for supported configurations. A preset is identified by a preset key:

- `bs-win-chrome`
- `bs-win-firefox`
- `bs-mac-chrome`
- `bs-mac-firefox`
- `ss-firefox`
- `ss-chrome`
- `cd`

The options controlled by presets are:

- `OS`
- `OS_VERSION`
- `BROWSER`
- `BROWSER_VERSION`
- `HEADLESS`
- `SERVICE`

Presets are very handy especially when using a testing service (BrowserStack is supported at present), since there are several options to set, and in most cases using the defaults set by the preset are what we want.

Omitting a preset results in options defaulting to specific values.

Several options set by presets are overridable by providing the corresponding options as environment variables. This allows using a preset and making small changes.

The presets cover all supported services.

For now, please see `WDIO.conf.js` for advanced preset behavior like overriding.

#### `cd`

Preset for the ChromeDriver service.

ChromeDriver runs on the local host and by default uses the version of chrome installed on the host. Thus there is no configuration for the OS, since the host is where the integration test is run, nor browser version, since it is always whatever is installed on the host.

| Variable          | Value        | Overridable |
| ----------------- | ------------ | ----------- |
| `SERVICE`         | ChromeDriver | n           |
| `OS`              | null         | n           |
| `OS_VERSION`      | null         | n           |
| `BROWSER`         | chrome       | n           |
| `BROWSER_VERSION` | null         | n           |
| `HEADLESS`        | t            | Y           |

#### `ss-chrome`

This is a preset for selenium-standalone using chrome.

Selenium standalone uses a "driver" to communicate with a browser. Drivers are installed when it is first run. Drivers for chrome and FireFox are supported out of the box. 

The drivers use the browser installed on the host machine running the tests. Drivers know where to find the binary for the associated browser on each supported OS.

At preset we just let it use the default drivers, which should be quite recent if using a recent version of selenium standalone.

It is possible to override the drivers and provide driver options, but at present we just use the defaults.

| Variable          | Value               | Overridable |
| ----------------- | ------------------- | ----------- |
| `SERVICE`         | selenium-standalone | n           |
| `OS`              | null                | n           |
| `OS_VERSION`      | null                | n           |
| `BROWSER`         | chrome              | n           |
| `BROWSER_VERSION` | null                | n           |
| `HEADLESS`        | t                   | Y           |

#### `ss-firefox`

This is a preset for selenium-standalone using FireFox.

See the description above.

| Variable          | Value               | Overridable |
| ----------------- | ------------------- | ----------- |
| `SERVICE`         | selenium-standalone | n           |
| `OS`              | null                | n           |
| `OS_VERSION`      | null                | n           |
| `BROWSER`         | chrome              | n           |
| `BROWSER_VERSION` | null                | n           |
| `HEADLESS`        | t                   | Y           |

#### `bs-win-chrome`

This is a preset for the BrowserStack testing service using the chrome browser on Windows.

The browser stack presets are each specialized for an OS and BROWSER, using sensible defaults appropriate for each.

Unlike the local testing services, a remote testing service defaults to non-HEADLESS. Testing services typically capture video of the test run, so we want full rendering to occur.

Note that if using `BrowserStack` the `SERVICE_USER` and `SERVICE_KEY` must be provided as well.

| Variable          | Value        | Overridable |
| ----------------- | ------------ | ----------- |
| `SERVICE`         | BrowserStack | n           |
| `OS`              | Windows      | n           |
| `OS_VERSION`      | 10           | Y           |
| `BROWSER`         | chrome       | n           |
| `BROWSER_VERSION` | latest       | Y           |
| `HEADLESS`        | f            | Y           |

#### `bs-win-firefox`

This is a preset for the BrowserStack testing service using the FireFox browser on Windows

| Variable          | Value        | Overridable |
| ----------------- | ------------ | ----------- |
| `SERVICE`         | BrowserStack | n           |
| `OS`              | Windows      | n           |
| `OS_VERSION`      | 10           | Y           |
| `BROWSER`         | FireFox      | n           |
| `BROWSER_VERSION` | latest       | Y           |
| `HEADLESS`        | f            | Y           |

#### `bs-mac-chrome`

This is a preset for the BrowserStack testing service using the Chrome browser on macOS

| Variable          | Value        | Overridable |
| ----------------- | ------------ | ----------- |
| `SERVICE`         | BrowserStack | n           |
| `OS`              | OS X         | n           |
| `OS_VERSION`      | Catalina     | Y           |
| `BROWSER`         | chrome       | n           |
| `BROWSER_VERSION` | latest       | Y           |
| `HEADLESS`        | f            | Y           |

#### `bs-mac-firefox`

This is a preset for the BrowserStack testing service using the FireFox browser on macOS

| Variable          | Value        | Overridable |
| ----------------- | ------------ | ----------- |
| `SERVICE`         | BrowserStack | n           |
| `OS`              | OS X         | n           |
| `OS_VERSION`      | Catalina     | Y           |
| `BROWSER`         | FireFox      | n           |
| `BROWSER_VERSION` | latest       | Y           |
| `HEADLESS`        | f            | Y           |




## Topics

### Run against container with kbase-ui

A handy Narrative development model, at least for kbase-ui developers, is to use `kbase-ui` and its local development proxy to access the narrative at a normal KBase environment hostname.

For instance, running kbase-ui at https://ci.kbase.us with the local-narrative option will proxy https://ci.kbase.us/narrative to a local narrative running in a container.

The make tasks `make dev-image` and `make run-dev-image` are handy for getting this going on the Narrative side.

In this case, the integration tests should be run with the parameter `BASE_URL=https://ci.kbase.us`.

### Running against `BrowserStack`

We support tests running against the `BrowserStack` online testing service.

Such tests work superficially just like local tests, with the following differences:

- specify one of the BrowserStack `PRESET`s
- advanced: specify any test parameters you wish to override
- specify the `SERVICE_USER` and `SERVICE_KEY` BrowserStack credentials available to you
- tests take several times (4-5 in my experience) longer than local tests
- tests may suffer false negatives and require repetition in order to pass

Ask on the `#narrative` slack channel for BrowserStack credentials.

### run without Python

The stock tests require a python installation, and as mentioned at the outset of this document, the recommended method is to use virtualenv.

However, when testing against a local narrative running in a container, you can avoid it and invoke the test directly:

```bash
ENV=ci BASE_URL=https://ci.kbase.us npx WDIO test/integration/WDIO.conf.js
```

### run against narrative-dev or other environments

Ideally we would run integration tests against each KBase deployment environment. Currently there is support in some tests for narrative-dev.

However, specific support is required for each environment:

- the test account `narrativetest`
- for tests which require test data in narratives, test data needs to be generated, the containing narratives shared with write access to narrativetest, and added to tests.

### running in in github actions

Integration tests run in github actions with some special configuration:

- `KBASE_TEST_TOKEN` set for the `narrativetest` user

Currently integration tests in github actions must use the `ChromeDriver` WDIO service due to restrictions of the host environment configured in the actions and github secrets configuration.

For example, selenium-standalone tests do not run due to the lack of java installed in the github action workflows.

BrowserStack tests require configuration of `SERVICE_USER` and `SERVICE_KEY`, and before this we would need to determine how to utilize BrowserStack credentials within KBase. Other issues may arise as well once we attempt testing against BrowserStack.

### a minimal integration test run

Here is an example minimal integration test run, using defaults, assuming that the narrative has already be built, and the terminal is in a virtual env (as described at the beginning of this document):

```bash
KBASE_TEST_TOKEN={MYTOKEN} make test-integration
```

This will run the tests against CI, using the `cd` ChromeDriver default `PRESET` which uses headless chrome.

To see the tests run in the browser GUI, try:

```bash
KBASE_TEST_TOKEN={MYTOKEN} HEADLESS=f make test-integration
```

### a moderate integration test run

Periodically, the integration tests should be run against browsers other than chrome. For this, we use the `selenium-standalone` WDIO service.

```bash
KBASE_TEST_TOKEN={MYTOKEN} PRESET=ss-chrome make test-integration
```

tests against Chrome:

```bash
KBASE_TEST_TOKEN={MYTOKEN} PRESET=ss-chrome make test-integration
```

tests against FireFox:

### a comprehensive integration test run

Comprehensive integration tests should be run at critical junctures, such as prior to a release. Comprehensive tests cover multiple browsers, operating systems, and screen resolutions. They are only possible using an online testing service like BrowserStack.

#### Using presets

```bash
export KBASE_TEST_TOKEN={MYTOKEN}
export SERVICE_USER={MYSERVICEUSER}
export SERVICE_KEY={MYSERVICEKEY}
PRESET=bs-mac-chrome make test-integration
PRESET=bs-mac-firefox make test-integration
PRESET=bs-windows-chrome make test-integration
PRESET=bs-windows-firefox make test-integration
```

#### With overrides

To override test parameters, you can start with a preset and just change what you want.

See [https://www.BrowserStack.com/list-of-browsers-and-platforms/live](https://www.BrowserStack.com/list-of-browsers-and-platforms/live) for a list of supported OSes and Browsers.

##### To change the screen dimensions

```bash
PRESET_DIMENSIONS=xga PRESET=bs-mac-chrome make test-integration
```

or

```bash
width=640 height=480 PRESET=bs-win-chrome make test-integration
```


##### To test a different browser

```bash
BROWSER=safari PRESET=bs-mac-chrome make test-integration
```

##### To test a different OS Version

```bash
OS_VERSION="Mojave" PRESET=bs-mac-firefox make test-integration
```

##### To test a different OS:

Actually, BrowserStack only supports Windows and Mac for desktop browsers.

### test account and data

Integration tests, like unit tests, match the real against the expected. All tests require some sort of test data to both drive the tests and to provide expected values. Although integration tests can certainly be written with all test data embedded directly in the test code, in order to support using the same test functions against multiple environments, it is necessary to drive the tests through per-environment test data.

This test data comes in two forms.

Within the tests themselves there should be an object which provides test data for each supported KBase environment, and potentially each separate test in the file (this really depends on the test design.)

For example

```json
{
    "ci": {
        "CASE1": {
            "narrativeId": 12345,
            "value": "my test narrative"
        }
    },
    "narrative-dev": {
        "CASE1": {
            "narrativeId": 2345,
            "value": "my test narrative"
        }
    }
}
```

Ideally the test data across environments is more similar than different, and the test data provided within the test spec is minimal.

The second source of test data is contained within narratives in the test environment. These narratives should be crafted for whatever is being tested. For instance, a test of some aspect of the Narrative ui may not depend on the narrative itself, but just need a narrative to be viewed. In this case, one should use a generic test narrative with no data or apps embedded.

On the other hand, many tests will be of specific per-narrative features, such as:

- data object viewers
- apps
- behavior of different types of cells

There are many issues to be worked out in this realm, such as:

- standard practices for test narrative creation, ownership, and syncronization across environments
- stability of test data
- creation and destruction of temporary narratives;;

## TODO

- focus tests
- omit tests