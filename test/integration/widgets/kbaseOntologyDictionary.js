/* global Jupyter casper */

/**
 * Working example of a widget tester.
 * Works in tandem with test/casper/testConfig.json, test/casper/widgetTestBed.js.
 *
 * To test a widget, a test module needs (at minimum) the four blocks below.
 * 1. Require the widgetTestBed module.
 * 2. A validateCell function (actually optional - this is intended to validate the structure of
 *    the code cell and its metadata. Many of the key parts this are also done automatically by
 *    widgetTestBed, based on the configuration. The validateCell function written here will be
 *    run after validating that the code is structured properly and the output has a valid
 *    serialized UPA. This takes in the CasperJS test object and widget config objects (the
 *    particular widget block from testConfig.json)
 * 3. A validateWidget function.
 *    This is the key part here that should be used to validate that a widget is working properly
 *    under the test conditions. It takes in the CasperJS test object, widget config (from the
 *    particular widget block in testConfig.json) and the selector used to get to the div
 *    that contains the widget in question.
 * 4. Call the testbed with the necessary functions and arguments.
 */

// Need the test bed loaded.
var WidgetTestBed = require('../widgetTestBed');

/**
 * validateCell is intended for use in validating the cell's structure, NOT the displayed widget.
 * If there's additional metadata to ensure exists in the cell, this is the place to do it.
 * A sample command is given as an example.
 * Things to note:
 * - The cell in question that contains the widget in its output area is ALWAYS going to be the last
 *   cell in the Narrative.
 * - CasperJS is really finicky about getting useful things out of the rendered DOM to use in the
 *   test script, so the example below shows how to use assertEval to get the cell index.
 * - See the CasperJS tester API for some details and examples on how to use it. Note that any
 *   eval statements will only return true or false, at least I couldn't get anything else to
 *   work...
 *   http://docs.casperjs.org/en/latest/modules/tester.html
 * inputs:
 *    test - the CasperJS test object. See the link above for API.
 *    config - the block under "widgets" in testConfig.json for this particular widget. Might be
 *             more useful as that config file grows.
 */
function validateCell (test, config) {
    'use strict';
    test.assertEval(function() {
        var cellIdx = Jupyter.notebook.get_cells().length-1;
        var cell = Jupyter.notebook.get_cell(cellIdx);
        var dataType = cell.metadata.kbase.dataCell.objectInfo.type.toLowerCase();
        return dataType.indexOf('genome') !== -1;
    }, 'Cell metadata references a Genome typed object');
}

/**
 * validateWidget is intended to validate that the widget rendered correctly. This can be as simple
 * as making sure elements appear in the right place, or as complex as manipulating the widget by
 * simulating clicks.
 * This example just makes sure the widget tabs show up and have the right labels.
 * inputs:
 *    test - the CasperJS test object. See the link above for API.
 *    config - the block under "widgets" in testConfig.json for this widget. Needed for the right
 *             selector, and maybe other things in the future.
 *    widgetDivSelector - the selector used to capture the widget in question. This gets generated
 *        by widgetTestBed.js, and will point directly to the div in the output area of the last
 *        cell of the narrative where the widget should be placed.
 */
function validateWidget(test, config, widgetDivSelector) {
    'use strict';
    var sel = widgetDivSelector + ' ' + config.widgetSelector;
    test.assertSelectorHasText(sel + ' li:first-child', 'Overview');
    test.assertSelectorHasText(sel + ' li:nth-child(2)', 'Browse Features');
    test.assertSelectorHasText(sel + ' li:nth-child(3)', 'Browse Contigs');
}

/**
 * We're set up! Run the tests!
 */
WidgetTestBed.runWidgetTest({
    widget: 'kbaseOntologyDictionary',
    validateCellFn: validateCell,
    validateWidgetFn: validateWidget
});
