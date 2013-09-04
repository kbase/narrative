/**
 * Options:
 *
 * loadingImage - an image to show in the middle of the widget while loading data
 */

(function( $, undefined ) {
	$.KBWidget("kbaseNarrativeWorkspace", 'kbaseWidget', {
		version: "1.0.0",
		uploadWidget: 'x',
        dataTableWidget: 'y',
		options: {
			loadingImage: "",
            tableElem: null,
            controlsElem: null
		},

		init: function(options) {
			this._super(options);
            this.initControls(options.controlsElem);
            this.initDataTable(options.tableElem);
            // bind search to data table
            $search_inp = options.controlsElem.find(':input');
            var that = this;
            $search_inp.on('change keyup', function(e) {
                var tbl = that.dataTableWidget.table;
                tbl.fnFilter($search_inp.val());
                tbl.fnDraw();
            });
			return this;
		},

        /**
         * Initialize controls at top of workspace view.
         *
         * @param elem Workspace view element
         * @returns this
         */
        initControls: function(elem) {
            var $search = $('<div>').addClass('kb-search')
            var $search_inp = $('<input>').attr('type', 'text');
            $search.append($search_inp);
            $search.append($('<i>').addClass('icon-search'));
            elem.append($search);
            elem.find('.dropdown-toggle').dropdown();
            //XXX: add intermediate menu, one option is upload
            var opts = {$anchor: $('#kb-ws-upload-selected')};
            this.uploadWidget = $('#kb-ws-upload-dialog').kbaseUploadWidget(opts);
            return this;
        },

        /**
         * Initialize the data table in the workspace view
         *
         * @param elem Data table parent element
         * @returns this
         */
        initDataTable: function(elem) {
            this.dataTableWidget = elem.kbaseWorkspaceDataWidget({
                loadingImage: this.options.loadingImage,
                container: elem
            });
            return this;
        },

        /**
         * Render the widgets.
         *
         * @returns this
         */
		render: function() {
			return this;
		},

        /**
         * Log in to all the widgets.
         *
         * @param token
         * @returns this
         */
		loggedIn: function(token) {
            this.dataTableWidget.loggedIn(token);
            //this.uploadWidget.loggedIn(token);
            //return this._widgetApply(token, 1);
		},

        /**
         * Log out from all the widgets.
         *
         * @param token
         * @returns this
         */
		loggedOut: function(token) {
            this.dataTableWidget.loggedOut(token);
            //this.uploadWidget.loggedOut(token);
            //return this._widgetApply(token, 0);
		},

	});

})( jQuery );