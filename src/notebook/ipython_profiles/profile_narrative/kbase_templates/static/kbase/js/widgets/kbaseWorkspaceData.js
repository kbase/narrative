/**
 * Widget to display a table of data objects from a kbase workspace.
 *
 * Options:
 *    workspaceName - the name of the workspace to show in this widget
 *    workspaceURL - the location of the workspace service (default points to existing deployed service)
 *    loadingImage - an image to show in the middle of the widget while loading data
 *    notLoggedInMsg - a string to put in the middle of the widget when not logged in.
 */
(function( $, undefined ) {

	$.KBWidget("kbaseWorkspaceDataWidget", 'kbaseWidget', {
		version: "1.0.0",
		wsClient: null,
		table: null,
        tableData: [],
        $loginMessage: null,
        $errorMessage: null,
        $loading: null,
        isLoggedIn: false,
		options: {
			workspaceName: "workspace_1",
			workspaceURL: "https://www.kbase.us/services/workspace",
			loadingImage: "ajax-loader.gif",
			notLoggedInMsg: "Please log in to view a workspace.",
            container: null
		},

		init: function(options) {
			this._super(options);
            this.$tbl = options.container;
            this.createTable()
                .createMessages()
                .createLoading()
                .render(null);
            return this;
        },

        /**
         * Create the message element.
         * @returns this
         */
        createMessages: function() {
            this.$loginMessage = $('<span>')
                .css({display: 'none'})
                .text(this.options.notLoggedInMsg);
            this.$tbl.append(this.$loginMessage);
            this.$errorMessage = $('<span>')
                .css({display: 'none'})
                .text('Sorry, an error occurred');
            this.$tbl.append(this.$errorMessage);
            return this;
        },

        /**
         * Create the 'loading' element.
         * @returns this
         */
        createLoading: function() {
            this.$loading = $('<img>').attr('src', this.options.loadingImage)
                .css({display: 'none'})
            this.$tbl.append(this.$loading);
            return this;
        },

        /**
         * Create/populate the table element.
         *
         * @returns this
         */
        createTable: function() {
            if (this.table) {
                this.table.fnDestroy();
            }
            var $elem = this.$tbl.find('table');
            this.table = $elem.dataTable( {
                aaData : this.tableData,
                aoColumns : [
                    /* Name */{
                      sTitle: 'Name',
                      bSortable: true,
                      bSearchable: true
                              },
                    /* Type */ {
                        sTitle: 'Type',
                        bSortable: true,
                        bSearchable: true
                    },
                ],
                oSearch: {sSearch: ''},
                aaSorting: [[1, 'asc'], [7, 'asc']],
                //bFilter: false,
                bInfo: false,
                bLengthChange: false,
                bPaginate: false,
                bAutoWidth: false,
                sScrollY: '270px'
            });
            /* indices of displayed columns in result array */
            this.NAME_IDX = 0;
            this.TYPE_IDX = 1;
            //this.$tbl.append(this.table);
			return this;
		},

        /**
         * Render the widget.
         * This fetches the list of workspaces.
         *
         * @returns this
         */
		render: function(token) {
            this.hideMessages();
            if (!this.isLoggedIn) {
                this.clearTable();
                this.$loginMessage.show();
            }
            else {
                this.$loading.show();
                var that = this;
                var opts = {workspace: this.options.workspaceName,
                            auth: token};
                this.wsClient.list_workspace_objects(opts,
                    function(results) {
                        console.log("Results: " + results);
                        that.updateResults(results);
                        that.createTable();
                    },
                    function(err) {
                        that.$loading.hide();
                        that.$errorMessage.show();
                    }
                );
                this.$loading.hide();
            }
            return this;
		},

        /**
         * Display new data in the table.
         *
         * @param results The new data
         * @returns this
         */
        updateResults: function(results) {
            this.tableData = [ ]; // clear array
            // Extract selected columns from full result set
            var i1 = this.NAME_IDX, i2 = this.TYPE_IDX;
            for (var i=0; i < results.length; i++) {
                this.tableData.push([results[i][i1], results[i][i2]]);
            }
            return this;
        },

		loggedIn: function(token) {
            this.isLoggedIn = true;
            this.wsClient = new workspaceService(this.options.workspaceURL);
            this.render(token);
            return this;
		},

		loggedOut: function(e, args) {
            this.isLoggedIn = false;
            this.render(null);
            return this;
        },

        clearTable: function() {
			if (this.table) {
				this.table.fnDestroy();
				this.table = null;
			}
            return this;
		},

        hideMessages: function() {
            this.$errorMessage.hide();
            this.$loginMessage.hide();
        }

	});

})( jQuery );
