/* global casper, phantom */

var fs = require('fs');
var token = fs.read('test/wjriehl.tok').trim();

var pageTitle = 'Widget Test Bed';
casper.test.begin('Can add a functioning widget to a Narrative', function suite(test) {
    'use strict';
    phantom.addCookie({
        'name': 'kbase_session',
        'value': token,
        'domain': 'localhost',
        'path': '/'
    });

    casper.start('http://localhost:8888/narrative/ws.28238.obj.1');

    casper.wait_for_kernel_ready();
    casper.waitWhileVisible('#kb-loading-blocker', function() {
        test.assertTitle(pageTitle);
    });

    casper.then(function() {
        test.assertSelectorHasText('span#kb-narr-creator', 'William Riehl');
    });

    // Now, evaluate a data panel click to make a viewer cell
    casper.then(function() {
        test.assertEquals(casper.get_cells_length(), 1);
        casper.thenEvaluate(function() {
            Jupyter.notebook.select(0);
            $('.kb-narr-panel-body-wrapper .icon-genome').click();
        });
    });

    // wait a second for it to run (the utility "wait_for_output" isn't working...)
    casper.then(function() {
        casper.wait(1000);
    });

    // now, validate what we see in the output.
    casper.then(function() {
        // make sure we got a new cell
        test.assertEquals(casper.get_cells_length(), 2);

        // make sure we have the code for a data widget in that cell
        test.assertEval(function() {
            var cell = Jupyter.notebook.get_cell(1);
            var text = cell.get_text();
            return (text.indexOf('WidgetManager().show_data_widget') !== -1) &&
                   (text.indexOf('title="Sbicolor.JGI-v2.1",') !== -1);
        });

        // make sure the cell's output area has JS for a KBase widget
        test.assertEval(function() {
            var cell = Jupyter.notebook.get_cell(1);
            var outputCode = cell.output_area.outputs[0].data['application/javascript'];
            return (outputCode.indexOf('"widget": "kbaseGenomeView"') !== -1);
        });

        // make sure the metadata has a serialized UPA in the right place
        test.assertEval(function() {
            var metadata = Jupyter.notebook.get_cell(1).metadata;
            return (metadata.kbase.dataCell.upas.id === '[28238]/2/8');
        });

        // next, we can go through the widget layout and all that...
    });

    casper.run(function() {
        test.done();
    });
});
