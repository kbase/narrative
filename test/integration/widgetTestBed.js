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
 *   "narrativeName": "Widget Test Bed",
 *   "dataSelector": ".icon-genome",
 *   "widgetSelector": ".tabbable",
 *   "testFile": "widgets/kbaseGenomeView",
 *   "publicData": "28238/2/8"
 * }
 * The main key should match the widget name.
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
 * narrativeName =
 *     A name that should be used for the generated narrative
 * testFile =
 *     The name of the CasperJS test file to be used to test this widget. Path is relative to
 *     test/casper.
 * publicData =
 *     The UPA of the public data object to be copied and used for testing.
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
        var doWidgetInsert = casper.cli.get('insert-widget'),
            doSave = casper.cli.get('save'),
            doValidate = true,
            currentUser = casper.cli.get('current-user'),
            narrativeId = casper.cli.get('narrative-id'),
            workspaceId = casper.cli.get('workspace-id'),
            ownerId = casper.cli.get('owner-id'),
            ownerName = casper.cli.get('owner-name'),
            narrativeTitle = casper.cli.get('title');
        config.objectUpa = casper.cli.get('object-upa'),
        config.objectName = casper.cli.get('object-name'),
        config.widgetName = casper.cli.get('widget-name');

        Object.keys(casper.cli.options).forEach(function(k) {
            casper.echo(k + ': "' + casper.cli.get(k) + '"');
        });

        TestUtil.setAuthCookie(currentUser);

        // Start the test at this page.
        casper.echo('Starting page... ' + TestUtil.buildNarrativeUrl(workspaceId, narrativeId));
        casper.start(TestUtil.buildNarrativeUrl(workspaceId, narrativeId))
            .viewport(2000,2000);

        casper.options.clientScripts.push('node_modules/babel-polyfill/dist/polyfill.js');

        // Wait for the narrative to get going. We get the first line from Jupyter's test util,
        // and add the second to wait for the KBase loading screen to go away.
        casper.wait_for_kernel_ready();
        casper.waitWhileVisible('#kb-loading-blocker');

        // Smoketest stuff - make sure the title's right and the creator's in place.
        // This checks that the Jupyter stuff works (title) and our stuff can talk to the
        // server (user name)
        casper.then(function() {
            test.assertSelectorHasText('span#kb-narr-creator', ownerName);
            test.assertTitle(narrativeTitle);
        });

        if (doWidgetInsert) {
            casper.then(function() {
                // Now, evaluate a data panel click to make a viewer cell
                // gotta be inside a .then block, otherwise will just run while outside of the
                // evaluation cycle.
                TestUtil.addDataWidgetFromIcon(config.dataSelector);
            });
        }

        // wait a second for it to run (the utility "wait_for_output" isn't working...), but this
        // shouldn't take longer than a second.
        casper.wait(5000);
        casper.thenEvaluate(function() {
            var numCells = Jupyter.notebook.get_cells().length;
            Jupyter.narrative.scrollToCell(Jupyter.notebook.get_cell(numCells-1));
        });

        if (doValidate) {
            casper.then(function() {
                // Validate that the show_data_widget code chunk looks right enough.
                test.assertEval(function(params) {
                    var cellIdx = Jupyter.notebook.get_cells().length-1;
                    var cell = Jupyter.notebook.get_cell(cellIdx);
                    var text = cell.get_text();
                    return (text.indexOf('WidgetManager().show_data_widget') !== -1) &&
                           (text.indexOf('title="' + params[0] + '",') !== -1) &&
                           (text.indexOf('"' + params[1] + '"') !== -1);
                }, 'show_data_widget function added to code cell', [config.objectName, config.objectUpa]);

                // make sure the cell's output area has JS for a KBase widget
                test.assertEval(function(widgetName) {
                    var cellIdx = Jupyter.notebook.get_cells().length-1;
                    var cell = Jupyter.notebook.get_cell(cellIdx);
                    var outputCode = cell.output_area.outputs[0].data['application/javascript'];

                    return (outputCode.indexOf('"widget": "' + widgetName + '"') !== -1);
                }, 'widget "' + config.widgetName + '" added to output area', config.widgetName);

                // make sure the metadata has a serialized UPA in the right place
                test.assertEval(function(serialUpa) {
                    var cellIdx = Jupyter.notebook.get_cells().length-1;
                    var metadata = Jupyter.notebook.get_cell(cellIdx).metadata;
                    return (metadata.kbase.dataCell.upas.id === serialUpa);
                }, 'Metadata contains properly formatted UPA', TestUtil.serializeUpa(config.objectUpa));

                // if there's anything extra special to do. Like something else in metadata.
                if (params.validateCellFn) {
                    params.validateCellFn(test, config);
                }
            });
        }

        // next, we can go through the widget layout and all that... (need to have that code so
        // we can test it on a copied narrative)
        var widgetDivSelector = '#notebook .cell:last-child .kb-cell-output-content > div:last-child';
        casper.waitUntilVisible(widgetDivSelector);
        casper.waitUntilVisible(widgetDivSelector + ' ' + config.widgetSelector);

        casper.then(function() {
            return params.validateWidgetFn(test, config, widgetDivSelector);
        });

        // finally, save the resulting narrative, if the --save argument is given
        if (doSave) {
            casper.then(function() {
                casper.click('#kb-save-btn');
                casper.waitWhileSelector('#kb-save-btn .fa.fa-save.fa-spin');
                casper.echo('Narrative saved.');
            });
        }

        casper.run(function() {
            test.done();
        });
    });
}

module.exports = {
    runWidgetTest: runWidgetTest
};
