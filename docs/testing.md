# Narrative Unit Testing

***Table of Contents***

- [Installation](#installation)
- [Short Version](#short-version)
- [Long Version](#long-version)
  - [About](#about)
  - [How to Run Tests](#how-to-run-tests)
  - [Add Credentials for Tests](#add-credentials-for-tests)
  - [Testing with Travis-CI and Coveralls](#testing-with-travis-ci-and-coveralls)
  - [Adding Your Own Tests](#adding-your-own-tests)
  - [Manual Testing and Debugging](#manual-testing-and-debugging)

## Installation

Install grunt-cli via the following command:

```
npm install -g grunt-cli
```

## Short version

1. Install the Narrative and activate its environment
    a. (optional) set credentials in test/
2. Run `make test` at a prompt.
3. Lament the coverage is so low.

## Long version

### About

Because the Narrative Interface is built on both the front and back ends of the Jupyter Notebook, there's two sides to Narrative testing. The front end tests are in JavaScript, and make use of [Karma](http://karma-runner.github.io/1.0/index.html) as a test runner, and [Jasmine](https://jasmine.github.io/2.0/introduction.html) as a testing language. The back end tests are written in Python using the unittest framework, and run with [nose](http://nose.readthedocs.io/en/latest/).

### How to Run Tests

We aren't testing the underlying Jupyter code, but we are making use of it, so a test run requires a Narrative install as described in the [installation](../install/local_install.md) docs. If you're installing in a Virtualenv, make sure it's activated. You don't need to run the narrative yourself for tests to work, it just needs to be installed.

Then, simply run (from the narrative root directory) `make test`.

This calls a few subcommands, and those can be run independently for specific uses:

- `make test-frontend-unit` will run only the unit tests on the frontend (i.e. those with the Karma runner)
- `make test-integration` will run the frontend integration tests that make use of webdriver.io to simulate the browser on a locally instantiated Narrative, but running against live KBase services. Note that this currently requires an authentication token. 
- `make test-frontend` will run both the frontend unit tests and integration tests as above.
- `make test-backend` will run only the backend Python tests.

### Add Credentials for Tests

The Narrative Interface is one of the hubs of KBase - it touches several different services, all of which need real authentication. Some of those have been mocked in various tests (like running apps), but others (the Workspace service) still require a real Auth token. If you have a KBase Developer account, you can create a Developer Token in the Account tab of the main KBase interface. To create a developer token, follow the instructions in [Section 3.4 of the KBase SDK documentation](https://kbase.github.io/kb_sdk_docs/tutorial/3_initialize.html).

You can store auth token files in test/. These are single line files, containing only the Auth token used for testing a single user. For example, `test/narrativetest.tok` would be for the narrativetest user, and would only contain that user's Auth token. DO NOT CHECK THESE IN TO GITHUB.

Next, these credentials need to be referenced for both the back and front end. This version requires two configs - one for Python, and one for JavaScript.

#### ***Python***

`src/biokbase/narrative/tests/test.cfg`
In the `[users]` and `[token_files]` blocks, two sets of values are needed: test_user and private_user. They don't have any special permissions, they just need to be different users.

#### ***JavaScript***

`test/testConfig.json`
This just needs the path to the token file, which should be kept in the `test` directory, for example `"test/narrativetest.tok"`.

*TODO (10/24/2017): Unify these token configs!*

#### ***Frontend Integration Tests***

There are currently two options here.
1. Set your token in the `KBASE_TEST_TOKEN` environment variable before running integration tests. 
2. Use the same token file as described above.

These are checked in that order. That is, if there's a `KBASE_TEST_TOKEN` variable, that gets used. Otherwise, it checks for the token file referenced in `test/testConfig.json`. If both of those are absent, a fake test token is used, which might cause failures if your tests include authenticated services.

### Testing with Github Actions and Codecov

These tests are run automatically on a pull request to the Narrative Github repo. These are currently run through [Github Actions](https://docs.github.com/en/free-pro-team@latest/actions) and the coverage reported with [Codecov](https://codecov.io/).

Unit tests are automatically run without credentials, skipping various tests that are, really, more like integration tests.

The integration tests that run with webdriver.io do require an authentication token. This is the `NARRATIVE_TEST_TOKEN` Github secret in the Narrative repo. It will become available in the test environment as `KBASE_TEST_TOKEN`, which is the variable that the `wdio.conf.js` file looks for.

### Adding Your Own Tests

#### ***Python***

Python tests should be per module, and should all be added to the `src/biokbase/narrative/tests`. The `test.cfg` file there is in INI file format, and should be added to, as necessary.

There are some service client Mocks available using the `mock` library. Check out `test_appmanager.py` for some examples of how these can be used.

#### ***JavaScript***

JavaScript tests follow the common Test Spec idiom. Here, we create a new spec file for each JavaScript module. These all live under `test/unit/spec` in roughly the same subdirectory as found under `kbase-extension/static/kbase/js`. There's an example spec in `test/unit/specTemplate.js` - you can just copy this to a new module, and modify to fit your needs.

#### ***Frontend Integration Tests***

Integration tests are done using [webdriver.io](https://webdriver.io). The test scripts are written in JavaScript and all resemble the common Mocha style. These tests are all under `test/integration/spec`. It's helpful for each of these files to include the `wdioUtils.js` module in `test/integration`. For each view that requires authentication (i.e. most of them), be sure to start your test with the async `login` function provided by that module. An example spec file might look like:

```javascript
const Utils = require('../wdioUtils');

describe('Simple test runner', () => {
    beforeEach(async () => await Utils.login());

    it('opens a narrative', async () => {
        await browser.url(Utils.makeURL('narrative/31932'));
        const loadingBlocker = await $('#kb-loading-blocker');
        const loadingText = await loadingBlocker.getText();
        expect(loadingText).toContain('Connecting to KBase services...');
    });
});
```

When running these locally, these require an auth token in either the `KBASE_TEST_TOKEN` environment variable, or in the file referenced by `test/testConfig.json` (see the [Add Credentials for Tests - JavaScript](#javascript) section above).

### Manual Testing and Debugging

#### ***Python***

For python changes, it will require shutting down the notebook, running `scripts/install_narrative.sh -u` and then starting the notebook server up again with `kbase-narrative`. You can print messages to the terminal using

```
log = logging.getLogger("tornado.application")
log.info("Your Logs Go Here")
```

#### ***JavaScript***

It can be useful to immediately see your changes in the narrative. For JavaScript changes, you will just have to reload the page. You can print messages to the console with `console.log`.

To debug using the Karma Debugger complete the following steps:

- In one terminal tab enter:

```
kbase-narrative --no-browser --NotebookApp.allow_origin="*" --ip=127.0.0.1 --port=32323
```

- Open a second tab and enter:

```
export PATH=$PATH:./node_modules/.bin/
```

- In the second tab enter:

```
karma start test/unit/karma.conf.js --browsers=Chrome --single-run=false
```

After running the third command, a chrome browser will open. Click on the debug button. This opens a second browser window where you can inspect the page and use chrome debugger tools.
