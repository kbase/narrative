/* global casper, phantom, Jupyter, $ */

var TestUtil = require('../casperUtil');
var token = TestUtil.authToken;
casper.echo(token);

var pageTitle = 'Widget Test Bed';
casper.test.begin('Can add a functioning widget to a Narrative', function suite(test) {
    'use strict';
    TestUtil.setAuthCookie('wjriehl');
    // phantom.addCookie({
    //     'name': 'kbase_session',
    //     'value': token,
    //     'domain': 'localhost',
    //     'path': '/'
    // });

    // Start the test at this page.
    // TODO: rewire to work with the port loaded up with test/unit/run_tests.py (32323?)
    casper.start('http://localhost:8888/narrative/ws.28238.obj.1');

    // Wait for the narrative to get going. We get the first line from Jupyter's test util,
    // and add the second to wait for the KBase loading screen to go away.
    casper.wait_for_kernel_ready();
    casper.waitWhileVisible('#kb-loading-blocker');

    // Smoketest stuff - make sure the title's right and the creator's in place.
    // This checks that the Jupyter stuff works (title) and our stuff can talk to the
    // server (user name)
    casper.then(function() {
        test.assertSelectorHasText('span#kb-narr-creator', 'William Riehl');
        test.assertTitle(pageTitle);
    });

    // Now, evaluate a data panel click to make a viewer cell
    casper.then(function() {
        test.assertEquals(casper.get_cells_length(), 1);
        casper.thenEvaluate(function() {
            Jupyter.notebook.select(0);
            $('.kb-narr-panel-body-wrapper .icon-genome').click();
        });
    });

    // wait a second for it to run (the utility "wait_for_output" isn't working...), but this
    // shouldn't take longer than a second.
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

        // next, we can go through the widget layout and all that... (need to have that code so
        // we can test it on a copied narrative)
    });

    /* NEXT STEPS (for Tuesday and beyond...)
     * 1. Automatically create a new narrative and add data.
     * 2. Save the narrative after adding the viewer cell(s)
     * 3. Share that with user B
     * 4. User B should copy Narrative.
     * 5. User B should open new Narrative and see valid viewer cell.
     */

    casper.run(function() {
        test.done();
    });
});
