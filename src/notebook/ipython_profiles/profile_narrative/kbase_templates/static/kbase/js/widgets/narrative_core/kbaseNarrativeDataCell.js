/**
 * Narrative data cell.
 * This data cell knows how to "view" itself
 *
 * @public
 */
(function($, undefined) {
    $.KBWidget({
        name: 'kbaseNarrativeDataCell',
        parent: 'kbaseNarrativeCell',
        version: '0.0.1',
        options: {
            info: null, // object info
        },
        obj_info: null,
        // for 'method_store' service
        method_client: null,

        // Factory to initialize the appropriate Viewer for a data object.
        // See ~line 88 of view() for the keys in the 'info' object.
        narrativeViewers: {  
          genericViewer: function(elt, info) {
            desc = info.name + "(v" + info.version + "), last saved by " + info.saved_by;
            return elt.DisplayTextWidget({'header': info.type, 'text': desc});
          },
        },

        /**
         * Initialize
         */
        init: function(options) {
            console.debug("kbaseNarrativeDataCell.init");
            this._super(options);
            this.obj_info = options.info;
            this._initMethodStoreClient();
            return this.render(options.info);
        },

        _initMethodStoreClient: function() {
            if (this.method_client === null) {
              this.method_client = new NarrativeMethodStore(this._getMethodStoreURL());
            }
        },

        _getMethodStoreURL: function() { return window.kbconfig.urls.narrative_method_store },

        /**
         * Create viewer widget (and params) for a data object.
         *
         * @param object_info (object) Object with info about data item
         *
         * @return Whatever the 'viewer' function returns.
         */
        render: function() {
          var viewer_names = {default: "genericViewer"}; // XXX
          var viewer = this.narrativeViewers[viewer_names.default];
          return viewer(this.$elem, this.obj_info);
        }



    })
})(jQuery);
