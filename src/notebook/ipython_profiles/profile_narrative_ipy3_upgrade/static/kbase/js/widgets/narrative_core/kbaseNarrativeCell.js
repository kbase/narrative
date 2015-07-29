/**
 * Base for our custom Narrative cells.
 *
 * @public
 */

define(['jquery', 'kbwidget'], function( $ ) {
    $.KBWidget({
        /* 
         * (required) Your widget should be named in CamelCase.
         */
        name: 'kbaseNarrativeCell',
        parent: 'kbaseWidget',
        version: '0.0.1',
        options: {
        },

        /**
         * Init cell.
         */
        init: function(options) {
            //console.debug("kbaseNarrativeCell.init");
            this._super(options);
        },
    });
});
