# Narrative Testing

## Unit Tests

### Short version
1. Install the Narrative and activate its virtualenv (if appropriate)  
    a. (optional) set credentials in test/
2. Run `make test` at a prompt.
3. Lament the coverage is so low.

### Long version
**About**  
Because the Narrative Interface is built on both the front and back ends of the Jupyter Notebook, there's two sides to Narrative testing. The front end tests are in JavaScript, and make use of [Karma](http://karma-runner.github.io/1.0/index.html) as a test runner, and [Jasmine](https://jasmine.github.io/2.0/introduction.html) as a testing language. The back end tests are written in Python using the unittest framework, and run with [nose](http://nose.readthedocs.io/en/latest/).

**How to run tests**  
We aren't testing the underlying Jupyter code, but we are making use of it, so a test run requires a Narrative install as described in the [installation](../install/local_install.md) docs. If you're installing in a Virtualenv, make sure it's activated. You don't need to run the narrative yourself for tests to work, it just needs to be installed.  

Then, simply run (from the narrative root directory) `make test`.  

This calls a few subcommands, and those can be run independently for specific uses:
  * `make test-frontend-unit` will run only the unit tests on the frontend (i.e. those with the Karma runner)
  * `make test-frontend-e2e` will run only the frontend tests that make use of Selenium to simulate a browser on the real Narrative site.
  * `make test-backend` will run only the backend Python tests.

**Add credentials for tests**  
The Narrative Interface is one of the hubs of KBase - it touches several different services, all of which need real authentication. Some of those have been mocked in various tests (like running apps), but others (the Workspace service) still require a real Auth token. If you have a KBase Developer account, you can create a Developer Token in the Account tab of the main KBase interface.

You can store auth token files in test/. These are single line files, containing only the Auth token used for testing a single user. For example, `test/narrativetest.tok` would be for the narrativetest user, and would only contain that user's Auth token. DO NOT CHECK THESE IN TO GITHUB.

Next, these credentials need to be referenced for both the back and front end. This version requires two configs - one for Python, and one for JavaScript.  

* Python:  
`src/biokbase/narrative/tests/test.cfg`  
In the `[users]` and `[token_files]` blocks, two sets of values are needed: test_user and private_user. They don't have any special permissions, they just need to be different users.  

* JavaScript:  
`test/unit/testConfig.json`  
This just needs the path to the token file (with pre-pended slash), such as `"/test/narrativetest.tok"`  

* *TODO (10/24/2017): Unify these token configs!*

**Testing with Travis-CI / Coveralls**  
These tests are run (without credentials) automatically on a pull request to the Narrative Github repo. These are currently run through [Travis-CI](https://travis-ci.org/) and the coverage reported with [Coveralls](https://coveralls.io/). There should be nothing you need to do to make this work.

**Adding your own tests**  
  * **Python**  
  Python tests should be per module, and should all be added to the `src/biokbase/narrative/tests`. The `test.cfg` file there is in INI file format, and should be added to, as necessary.  

  There are some service client Mocks available using the `mock` library. Check out `test_appmanager.py` for some examples of how these can be used.
  * **JavaScript**  
  JavaScript tests follow the common Test Spec idiom. Here, we create a new spec file for each JavaScript module. These all live under `test/unit/spec` in roughly the same subdirectory as found under `kbase-extension/static/kbase/js`. There's an example spec in `test/unit/specTemplate.js` - you can just copy this to a new module, and modify to fit your needs.

## Widget Integration Tests

### Short Version:  
1. Install the Narrative and activate its virtualenv (if appropriate)  
2. Set credentials in test/ and test/integration/testConfig.json
3. Run `make test-integration` at a prompt.

### Long Version:  
**About**  
The goal of these integration tests are to ensure that the various data widgets (1) render properly and (2) continue to render properly in Narratives that have been shared, copied, and subsequently unshared. To do this, the tester needs a few things:  
* Authentication tokens for two users (should be in files under `test/` as in the unit tests above)
* Information about which widget to test (placed in testConfig.json, detailed below)
* Data to test for each widget.

Then, given two users - UserA and UserB - for each widget, the following steps happen in a scripted manner.

1. UserA creates a new Narrative and shares it with UserB.
2. UserA copies a piece of public data (viewed with the widget) into the new Narrative.
3. UserA opens that Narrative, clicks on the data object to create the viewer widget, validates that the widget it in place, then saves the Narrative.
4. UserB makes a copy of that Narrative.
5. UserA revokes any sharing privileges from UserB.
6. UserB then opens their copy of the Narrative and validates that the widget is viewable as intended.

This complicated series of steps is orchestrated by several scripts and configuration.  
**Scripts**  
* `test/integration/run_tests.py` - this coordinates starting up the Narrative Interface, Narrative creation and sharing, and finally deletion of the test Narratives. It also spins up the headless Narrative viewer.  
* `test/integration/widgetTestBed.js` - this uses [CasperJS](http://casperjs.org/) (and [PhantomJS](http://phantomjs.org/)) to headlessly open Narrative documents and simulate the activities the Users take above. Specifically, it does the following (so you don't have to in your individual widget scripts)
  * Opens the Narrative on behalf of UserA or UserB (depending on the step)
  * Verifies that the Narrative title is rendered correctly.
  * Verifies that the Narrative owner shows up correctly.
  * If we're adding the widget, simulate a click on the object's icon in the data panel.
  * Verifies that the Python code in the new cell that creates the widget is made properly (it runs the right function with the right data object info)
  * Verifies that the JavaScript code in the new cell's output area that renders the widget is made properly (i.e. it has the right widget's name)
  * Verifies that the right UPA is in the cell's metadata, serialized properly so sharing will work.
  * Verifies that the output area of the cell renders properly.
  * Waits a moment, then verifies that the widget itself shows up in the output area.
  * Saves the Narrative if it's UserA doing this.
* `test/integration/widgets/*.js` - these are the individual widget test scripts. While the two scripts above are important, they shouldn't need any modification by end users or developers. However, any new widget added should have a short script added to this directory that describes how to validate a widget.

**Configuration**  
`test/integration/testConfig.json` is the configuration file for all widget integration tests. It describes important features for each test user, and widget. Here's a breakdown of the main keys in that file and how they're used.

`users` - describes the two test users, `"userA"` and `"userB"`. All that's needed here are their ids and a file with a valid auth token for each.

`widgets` - this is the main piece to modify if you want to add a new widget. Each key under `widgets` should reference a different widget. Here's an example to go over in detail:
```
"kbaseGenomeView": {
    "dataSelector": ".icon-genome",
    "widgetSelector": ".tabbable",
    "testFile": "widgets/kbaseGenomeView.js",
    "publicData": "28238/2/8",
    "narrativeName": "Test Genome Viewer"
}
```
This example tells the scripts how to test the kbaseGenomeView widget. The top level key name here references the name of the widget to be tested, as used in the Narrative Interface. The subkeys are:
* `dataSelector`: this is a selector to pick out where to click on the data panel. It's relative to the card on the data panel that has info about the object. If you click the icon, it plops a new widget into the Narrative, and this selector is used to tell the script where to click.
* `widgetSelector`: this selector tells the script where to look for the instantiated widget. This should be relative to the output area of the cell that contains the widget. Basically, given that we're looking at the widget in the cell, surrounded by all the KBase and Jupyter trappings, what's a selector that uniquely (more or less) identifies the DOM element containing your widget. It's (1) used to validate the widget was fully loaded, and (2) passed to the `validateWidget` function as described below.
* `testFile`: the path to the JS script used to test this widget. Relative to `test/integration`.
* `publicData`: an UPA (preferably public, but at a minimum, it must be visible to UserA) for the data that should be copied into UserA's narrative.
* `narrativeName`: some name to give UserA's Narrative at creation. Mainly used to verify that the Narrative was created and loaded properly.

These should all be filled out for each widget to be tested.

**Widget Test Script**  
Each script in `test/integration/widgets` should follow the same overall format. See `test/integration/widgets/kbaseGenomeView.js` for an example, but the pieces are below as well.

This should look, and is meant to be, reasonably simple. This script just invokes the `widgetTestBed.js` module with information about the widget to test, including its name, a function on how to test that the cell is well formatted (for specific cases) and a function on how to test that the widget rendered properly. Those two functions should be structured (roughly) as follows.

`validateCell(test, config)`  
This function takes in the CasperJS test object (see the [CasperJS Docs](http://docs.casperjs.org/en/latest/testing.html) for details) and the widget config (the block given above). In here, it's recommended to either do nothing (as the main testbed script takes care of it) or focus on what shows up in the cell metadata.

`validateWidget(test, config, widgetDivSelector)`  
This function takes in the CasperJS test object, the widget config, and the selector used to get to the precise div in the correct cell where your widget lies. Note that this doesn't go all the way down to the `widgetSelector` in the configuration file. Here, it's a good idea to throw in a few `test.assertEval()` statements to really inspect the DOM and make sure the widget is working as intended. You can chain together a few CasperJS commands to manipulate things as well (e.g. clicking various tabs and inspecting what they show).

Finally, run the testbed from your script with the following command:
```
WidgetTestBed.runWidgetTest({
    widget: widgetName,
    validateCellFn: validateCell,
    validateWidgetFn: validateWidget
})
```
And it'll take care of the rest. Failures will percolate up to the main running script and get reported in the terminal.
