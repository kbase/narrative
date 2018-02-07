/**
 * params needs to be an object with certain keys:
 * widget = the name of the widget to test (as in testConfig.json)
 * dataSelector = the CSS-selector for finding a data object. An icon would be best.
 * validateFn = a function (full of casper's test.XXX commands) for validating that a
 *              widget instantiates and renders correctly.
 * mainUser = which user to use for initial permissions and ownership
 * sharedUser = which user to use for sharing
 * Eventually, this will handle the sharing and other validating that needs to happen.
 */

var TestUtil = require('./casperUtil');

function runWidgetTest(params) {
    'use strict';
    // check params
    if (!params.widget) {
        throw new Error('No widget entered for this test!');
    }
    if (!params.validateFn) {
        throw new Error('a validateFn is needed to validate the widget rendering.');
    }

    var config = TestUtil.getWidgetConfig(params.widget);
    casper.test.begin('Testing widget "' + params.widget + '"', function (test) {
        TestUtil.setAuthCookie(config.mainUser);

        // Start the test at this page.
        casper.echo('starting page... ' + TestUtil.getNarrativeUrl(params.widget));
        casper.start(TestUtil.getNarrativeUrl(params.widget));

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
        casper.wait(1000);
        casper.thenEvaluate(function(cellIdx) {
            Jupyter.narrative.scrollToCell(Jupyter.notebook.get_cell(cellIdx));
        }, config.numCells);

        casper.then(function() {
            return params.validateFn(test, config);
        });

        casper.run(function() {
            test.done();
        });
    });
}

module.exports = {
    runWidgetTest: runWidgetTest
};
