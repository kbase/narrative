define([
    'jquery',
    'kbwidget'
], function(
    $,
    KBWidget
) {
    'use strict';
    return KBWidget({
        name: 'objectCellHeader',
        options: {
            upas: {}
        },
        init: function(options) {
            this._super(options);
            this.render();
        },
        render: function() {
            this.$elem.append('i am a header! my upas are ' + JSON.stringify(this.options.upas));
        }
    });
});
