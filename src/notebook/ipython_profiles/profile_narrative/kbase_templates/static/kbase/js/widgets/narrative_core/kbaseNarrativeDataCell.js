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
            objid: null, // object id
        },
        // for 'method_store' service
        method_client: null,
        // workspace service client
        ws_client: null,

        // Factory to initialize the appropriate Viewer for a data object.
        // See ~line 88 of view() for the keys in the 'info' object.
        narrativeViewers: {  
          genericViewer: function(elt, info) {
            desc = name + "(v" + info.version + "), last saved by " + info.saved_by;
            return elt.DisplayTextWidget({'header': info.type, 'text': desc});
          },
        },

        /**
         * Initialize
         */
        init: function(options) {
            console.debug("kbaseNarrativeDataCell.init");
            this._super(options);
            this.ws_client = window.kb.ws;
            this._initMethodStoreClient();
            return this.render(options.objid);
        },

        _initMethodStoreClient: function() {
            if (this.method_client === null) {
              this.method_client = new NarrativeMethodStore(this._getMethodStoreURL());
            }
        },

        _getMethodStoreURL: function() { return window.kbconfig.urls.narrative_method_store },

        /**
         * Render
         */
        render: function(objid) {
            return this.view(objid);
        },

        /**
         * Create viewer widget (and params) for a data object.
         *
         * @param object_id (string) Object identifer
         * @param elt (jQuery) jQuery DOM element
         *
         * @return object with attributes 'widget' and 'params'
         */
        view: function(object_id) {
          var raw_info = {}
          console.debug("ws_client: ",this.ws_client);
          obj = this.ws_client.get_object_info_new({'objects':[object_id], 'includeMetadata': true, 'ignoreErrors': true},
            function(info) {
              raw_info.info = info;
          });
          if (raw_info.info === null) {
            console.error("Cannot get object info for:", object_id);
            return null;
          }
          var viewer_name = "genericViewer"; // TODO: use ws_client to get the appropriate Viewer name from method_store
          var viewer = this.narrativeViewers[viewer_name];
          if (viewer == undefined) {
            console.error("Unknown viewer '" + viewer_name + "' for:", object_id);
            return null;
          }
          obj_info = { id: raw_info[0], name: raw_info[1], type: raw_info[2], save_date: raw_info[3],
                       version: raw_info[4], saved_by: raw_info[5], }; // XXX: etc.
          return viewer(this, obj_info);
        }



    })
})(jQuery);
