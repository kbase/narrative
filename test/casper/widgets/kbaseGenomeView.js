/* global casper, Jupyter, $ */

var TestUtil = require('../casperUtil');
var config = TestUtil.getWidgetConfig('kbaseGenomeView');

casper.test.begin('Can add a functioning widget to a Narrative', function suite(test) {
    'use strict';
    casper.echo(JSON.stringify(config));
    TestUtil.setAuthCookie('wjriehl');

    // Start the test at this page.
    casper.start(TestUtil.getNarrativeUrl('kbaseGenomeView'));

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
        TestUtil.addDataWidgetFromIcon('.icon-genome');
    });


    // // Now, evaluate a data panel click to make a viewer cell
    // casper.then(function() {
    //     casper.thenEvaluate(function(cellIdx) {
    //         Jupyter.notebook.select(cellIdx);
    //         $('.kb-narr-panel-body-wrapper .icon-genome').click();
    //     }, config.numCells-1);
    // });
    //
    // wait a second for it to run (the utility "wait_for_output" isn't working...), but this
    // shouldn't take longer than a second.
    casper.wait(1000);
    casper.thenEvaluate(function(cellIdx) {
        Jupyter.narrative.scrollToCell(Jupyter.notebook.get_cell(cellIdx));
    }, config.numCells);

    // now, validate what we see in the output.
    casper.then(function() {
        // make sure we got a new cell
        test.assertEquals(casper.get_cells_length(), config.numCells + 1);

        // make sure we have the code for a data widget in that cell
        test.assertEval(function(cellIdx) {
            var cell = Jupyter.notebook.get_cell(cellIdx);
            var text = cell.get_text();
            return (text.indexOf('WidgetManager().show_data_widget') !== -1) &&
                   (text.indexOf('title="Sbicolor.JGI-v2.1",') !== -1);
        }, 'show_data_widget function added to code cell', config.numCells);

        // make sure the cell's output area has JS for a KBase widget
        test.assertEval(function(cellIdx) {
            var cell = Jupyter.notebook.get_cell(cellIdx);
            var outputCode = cell.output_area.outputs[0].data['application/javascript'];
            return (outputCode.indexOf('"widget": "kbaseGenomeView"') !== -1);
        }, 'widget "kbaseGenomeView" added to output area', config.numCells);

        // make sure the metadata has a serialized UPA in the right place
        test.assertEval(function(cellIdx) {
            var metadata = Jupyter.notebook.get_cell(cellIdx).metadata;
            return (metadata.kbase.dataCell.upas.id === '[28238]/2/8');
        }, 'Metadata contains properly formatted UPA', config.numCells);
    });

    // next, we can go through the widget layout and all that... (need to have that code so
    // we can test it on a copied narrative)
    var widgetSelector = '#notebook .cell:last-child .kb-cell-output-content > div:last-child';
    casper.waitUntilVisible(widgetSelector);
    casper.waitUntilVisible(widgetSelector + ' .tabbable');

    casper.then(function() {
        test.assertSelectorHasText(widgetSelector + ' .tabbable li:first-child', 'Overview');
        test.assertSelectorHasText(widgetSelector + ' .tabbable li:nth-child(2)', 'Browse Features');
        test.assertSelectorHasText(widgetSelector + ' .tabbable li:last-child', 'Browse Contigs');
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
