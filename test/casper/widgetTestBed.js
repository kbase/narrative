/* global casper module Jupyter */

/**
 * CasperJS widget test bed.
 * -------------------------
 * This exports a single function - runWidgetTest - that, oddly enough, tests a widget in place
 * in a given narrative.
 *
 * Most of the fiddly test components are expected to be in test/casper/testConfig.json, so as
 * not to be hard-coded in each test. Maybe they could be in a different version? Not sure
 * what's better. I tried to err on the side of more configuration and less code.
 *
 * The single function here takes in a params object. It needs the following keys:
 *
 * widget
 * ------
 * The name of the widget to test. This will be used as the key for looking up info
 * from testConfig.json
 *
 * validateCellFn
 * --------------
 * A function (full of casper's test.XXX commands) for validating that the cell containing a widget
 * instantiates correctly. This is run before rendering, and should be used to validate things like
 * the code block and metadata. Should have the following signature.
 * myValidateFn(test, config)
 *     test: the casper.test object in the correct context
 *     config: the test configuration object (with configs set for each widget)
 * That is to say, the test and config variables are passed into your validateCellFn
 *
 * validateWidgetFn
 * ----------------
 * A function for validating that a widget has rendered properly. This is run once the widget is
 * "rendered" (the JavaScript code is executed by the browser). This doesn't mean it's done
 * rendering - your widget could still be fetching data and building itself. But the DOM node and
 * JS code has been run.
 * As in the validateCellFn above, this is given the test and config objects, but is also given
 * a widgetSelector variable. This is the selector for the DOM node containing the newly built
 * widget itself. Any selectors used for testing the render should be relative to this one.
 *
 *
 * The config file test/casper/testConfig.json should have a special mention here, too. Each block
 * in that file represents some configuration stuff for each widget tested.
 *
 * Documentation by example!
 * "kbaseGenomeView": {
 *   "narrativeId": "ws.28238.obj.1",
 *   "narrativeName": "Widget Test Bed",
 *   "creatorName": "William Riehl",
 *   "ownerId": "wjriehl",
 *   "numCells": 1,
 *   "dataSelector": ".icon-genome",
 *   "widgetSelector": ".tabbable",
 *   "mainUser": "wjriehl"
 * }
 * The main key should match the widget name.
 * narrativeId = the id of the narrative (as in the URL path)
 * narrativeName = the name that shows in the Narrative page header
 * creatorName = the full name of the user that shows in the page header
 * ownerId = the user id for the narrative creator
 * numCells = the number of cells in that saved narrative
 * dataSelector =
 *     The CSS-selector for finding a data object. An icon would be best. This one is relative to
 *     the "card" that holds each data object in the Data panel (that part gets filled out
 *     automatically).
 * widgetSelector =
 *     A CSS-selector for the relevant part of the widget itself, used to test for its presence.
 *     For example, if the main part of widget is sitting in a KBaseTabs, then ".tabbable" should
 *     be used. The tests will wait until this becomes visible to proceed, so it should either be
 *     right away (like some spinner in the widget), or delayed until the widget is expected to be
 *     rendered (like the '.tabbable' that would appear only after data gets loaded).
 * mainUser =
 *     The user who's token will be used to open that narrative, make the widget, and share it.
 * sharedUser =
 *     The user who this narrative will be shared with to do the sharing validation
 */

var TestUtil = require('./casperUtil');

function runWidgetTest(params) {
    'use strict';
    // check params
    if (!params.widget) {
        throw new Error('No widget entered for this test!');
    }
    if (!params.validateCellFn) {
        throw new Error('a validateFn is needed to validate the cell structure and metadata.');
    }
    if (!params.validateWidgetFn) {
        throw new Error('needs a function for validating the widget rendering.');
    }

    var config = TestUtil.getWidgetConfig(params.widget);
    casper.test.begin('Testing widget "' + params.widget + '"', function (test) {
        TestUtil.setAuthCookie(config.mainUser);

        // Start the test at this page.
        casper.echo('Starting page... ' + TestUtil.getNarrativeUrl(params.widget));
        casper.start(TestUtil.getNarrativeUrl(params.widget));

        casper.options.clientScripts.push('node_modules/string.prototype.startswith/startswith.js');
        // casper.options.clientScripts.push('node_modules/es6-shim/es6-shim.min.js');

        // Wait for the narrative to get going. We get the first line from Jupyter's test util,
        // and add the second to wait for the KBase loading screen to go away.
        casper.wait_for_kernel_ready();
        casper.waitWhileVisible('#kb-loading-blocker');

        // Smoketest stuff - make sure the title's right and the creator's in place.
        // This checks that the Jupyter stuff works (title) and our stuff can talk to the
        // server (user name)
        casper.then(function() {
            test.assertSelectorHasText('span#kb-narr-creator', config.creatorName);
            test.assertTitle(config.narrativeName);
            test.assertEquals(casper.get_cells_length(), config.numCells);
        });

        casper.then(function() {
            // Now, evaluate a data panel click to make a viewer cell
            // gotta be inside a .then block, otherwise will just run while outside of the
            // evaluation cycle.
            TestUtil.addDataWidgetFromIcon(config.dataSelector);
        });

        //
        // wait a second for it to run (the utility "wait_for_output" isn't working...), but this
        // shouldn't take longer than a second.
        casper.wait(10000);
        casper.thenEvaluate(function(cellIdx) {
            Jupyter.narrative.scrollToCell(Jupyter.notebook.get_cell(cellIdx));
        }, config.numCells);

        casper.then(function() {
            return params.validateCellFn(test, config);
        });

        // next, we can go through the widget layout and all that... (need to have that code so
        // we can test it on a copied narrative)
        var widgetSelector = '#notebook .cell:last-child .kb-cell-output-content > div:last-child';
        casper.then(function() {
            casper.waitUntilVisible(widgetSelector);
            casper.captureSelector('widget-test.png', '#notebook .cell:last-child');
            casper.echo('here!');
            casper.waitUntilVisible(widgetSelector + ' ' + config.widgetSelector);
        });

        casper.then(function() {
            return params.validateWidgetFn(test, config, widgetSelector);
        });

        casper.run(function() {
            test.done();
        });
    });
}

module.exports = {
    runWidgetTest: runWidgetTest
};
