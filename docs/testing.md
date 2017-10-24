# Narrative Unit Testing

### Short version
1. Install the Narrative and activate its virtualenv (if appropriate)  
    a. (optional) set credentials in test/
2. Run `make test` at a prompt.
3. Lament the coverage is so low.

### Long version
**About**  
Because the Narrative Interface is built on both the front and back ends of the Jupyter Notebook, there's two sides to Narrative testing. The front end tests are in JavaScript, and make use of Karma[link] as a test runner, and Jasmine [link] as a testing language. The back end tests are written in Python using the unittest framework, and run with nose [link].

**How to run tests**  
We aren't testing the underlying Jupyter code, but we are making use of it, so a test run requires a Narrative install as described in the installation [link] docs. If you're installing in a Virtualenv, make sure it's activated. You don't need to run the narrative yourself for tests to work, it just needs to be installed.  

Then, simply run (from the narrative root directory) `make test`.  

This calls a few subcommands, and those can be run independently for specific uses:
  * `make test-frontend-unit` will run only the unit tests on the frontend (i.e. those with the Karma runner)
  * `make test-frontend-e2e` will run only the frontend tests that make use of Selenium to simulate a browser on the real Narrative site.
  * `make test-backend` will run only the backend Python tests.

**Add credentials for tests**  
The Narrative Interface is one of the hubs of KBase - it touches several different services, all of which need real authentication. Some of those have been mocked in various tests (like running apps), but others (the Workspace service) still require a real Auth token. See [link] for creating KBase Developer tokens.  

You can create auth token files in test/. These are single line files, containing only the Auth token used for testing a single user. For example, `test/narrativetest.tok` would be for the narrativetest user, and would only contain that user's Auth token.  

Next, these credentials need to be referenced for both the back and front end. This version requires two configs - one for Python, and one for JavaScript.  

* Python:  
`src/biokbase/narrative/tests/test.cfg`  
In the `[users]` and `[token_files]` blocks, two sets of values are needed: test_user and private_user. They don't have any special permissions, they just need to be different users.  

* JavaScript:  
`test/unit/testConfig.json`  
This just needs the path to the token file (with pre-pended slash), such as `"/test/narrativetest.tok"`  

* *TODO (10/24/2017): Unify these token configs!*

**Testing with Travis-CI / Coveralls**  
These tests are run (without credentials) automatically on a pull request to the Narrative Github repo. These are currently run through Travis-CI [link] and the coverage reported with Coveralls [link]. There should be nothing you need to do to make this work.

**Adding your own tests**  
  * **Python**  
  Python tests should be per module, and should all be added to the `src/biokbase/narrative/tests`. The `test.cfg` file there is in INI file format, and should be added to, as necessary.  

  There are some service client Mocks available using the `mock` library. Check out `test_appmanager.py` for some examples of how these can be used.
  * **JavaScript**  
  JavaScript tests follow the common Test Spec idiom. Here, we create a new spec file for each JavaScript module. These all live under `test/unit/spec` in roughly the same subdirectory as found under `kbase-extension/static/kbase/js`. There's an example spec in `test/unit/specTemplate.js` - you can just copy this to a new module, and modify to fit your needs.
