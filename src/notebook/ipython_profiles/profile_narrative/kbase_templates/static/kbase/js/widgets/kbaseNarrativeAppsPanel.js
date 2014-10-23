(function( $, undefined ) {
    $.KBWidget({
        name: 'kbaseNarrativeAppsPanel', 
        parent: 'kbaseNarrativeControlPanel',
        version: '0.0.1',
        options: {
            loadingImage: 'static/kbase/images/ajax-loader.gif',
            autopopulate: true,
            title: 'Apps',
        },

        init: function(options) {
            this._super(options);

            return this;
        }
    });
})(jQuery);