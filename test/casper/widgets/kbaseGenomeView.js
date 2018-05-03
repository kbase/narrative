/* global Jupyter casper */

var WidgetTestBed = require('../widgetTestBed');

function validateCell (test, config, cellIdx) {
    'use strict';

    // make sure we have the code for a data widget in that cell
    test.assertEval(function(cellIdx) {
        var cell = Jupyter.notebook.get_cell(cellIdx);
        var text = cell.get_text();
        return (text.indexOf('WidgetManager().show_data_widget') !== -1) &&
               (text.indexOf('title="Sbicolor.JGI-v2.1",') !== -1);
    }, 'show_data_widget function added to code cell', cellIdx);

    // make sure the cell's output area has JS for a KBase widget
    test.assertEval(function(cellIdx) {
        var cell = Jupyter.notebook.get_cell(cellIdx);
        var outputCode = cell.output_area.outputs[0].data['application/javascript'];
        return (outputCode.indexOf('"widget": "kbaseGenomeView"') !== -1);
    }, 'widget "kbaseGenomeView" added to output area', cellIdx);

    // make sure the metadata has a serialized UPA in the right place
    test.assertEval(function(cellIdx) {
        var metadata = Jupyter.notebook.get_cell(cellIdx).metadata;
        return (metadata.kbase.dataCell.upas.id === '[28238]/2/8');
    }, 'Metadata contains properly formatted UPA', cellIdx);
}

function validateWidget(test, config, widgetSelector) {
    'use strict';
    test.assertSelectorHasText(widgetSelector + ' .tabbable li:first-child', 'Overview');
    test.assertSelectorHasText(widgetSelector + ' .tabbable li:nth-child(2)', 'Browse Features');
    test.assertSelectorHasText(widgetSelector + ' .tabbable li:nth-child(3)', 'Browse Contigs');
}

WidgetTestBed.runWidgetTest({
    widget: 'kbaseGenomeView',
    validateCellFn: validateCell,
    validateWidgetFn: validateWidget
});
