/* global Jupyter casper */

var WidgetTestBed = require('../widgetTestBed');

function validateCell (test, config) {
    'use strict';
}

function validateWidget(test, config, widgetDivSelector) {
    'use strict';
    var sel = widgetDivSelector + ' ' + config.widgetSelector;
    test.assertSelectorHasText(sel + ' li:first-child', 'Overview');
    test.assertSelectorHasText(sel + ' li:nth-child(2)', 'Browse Features');
    test.assertSelectorHasText(sel + ' li:nth-child(3)', 'Browse Contigs');
}

WidgetTestBed.runWidgetTest({
    widget: 'kbaseGenomeView',
    validateCellFn: validateCell,
    validateWidgetFn: validateWidget
});
