/**
 * Base for our custom Narrative cells.
 *
 * @public
 */

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery'
	], function(
		KBWidget,
		bootstrap,
		$
	) {
    return KBWidget({
        /* 
         * (required) Your widget should be named in CamelCase.
         */
        name: 'kbaseNarrativeCell',
        
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
