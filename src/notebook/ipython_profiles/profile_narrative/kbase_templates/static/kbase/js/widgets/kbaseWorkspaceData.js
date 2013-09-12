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
        wsName: null,
        wsToken: null,
		options: {
			//workspaceName: "workspace_1",
			workspaceURL: "https://www.kbase.us/services/workspace",
			loadingImage: "ajax-loader.gif",
			notLoggedInMsg: "Please log in to view a workspace.",
            container: null
		},
        // Constants
        WS_NAME_KEY: 'ws_name', // workspace name, in notebook metadata
        WS_META_KEY: 'ws_meta', // workspace meta (dict), in notebook metadata

        init: function(options) {
			this._super(options);
            this.$tbl = options.container;
            this.createTable()
                .createMessages()
                .createLoading()
                .render();
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
                aaSorting: [[0, 'asc'], [1, 'asc']],
                //bFilter: false,
                bInfo: false,
                bLengthChange: false,
                bPaginate: false,
                bAutoWidth: true,
                bScrollCollapse: true,
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
         * This fetches the list of data sets for the workspace.
         *
         * @returns this
         */
		render: function() {
            this.hideMessages();
            if (!this.isLoggedIn) {
                this.clearTable();
                this.$loginMessage.show();
            }
            else {
                this.$loading.show();
                var that = this;
                this.setWs(function() {
                    var opts = {workspace: that.wsName, auth: that.wsToken};
                    that.wsClient.list_workspace_objects(opts,
                        function(results) {
                            //console.log("Results: " + results);
                            that.updateResults(results);
                            that.createTable();
                        },
                        function(err) {
                            console.log("ERROR: getting workspace objects: " + JSON.stringify(err.error));
                            that.$loading.hide();
                            that.$errorMessage.show();
                            // XXX: hack to get something in there
                            results = [ ];
                            for (var i=0; i < 5; i++) {
                                results.push(['luke' + i, 'Genome']);
                                results.push(['leia' + i, 'Model']);
                                results.push(['anakin' + i, 'Genome']);
                                results.push(['amidala' + i, 'Model']);
                            }
                            that.updateResults(results);
                            that.createTable();
                        }
                    )
                    that.$loading.hide();
                });
            }
            return this;
		},
        /**
         * Set or create workspace
         *
         * Sets this.wsName to name of workspace.
         * Also puts this into Notebook metadata.
         *
         * @returns this
         */
        setWs: function(set_cb) {
            if (this.wsName !== null) {
                set_cb();
            }
            var name = null;
            this._waitForIpython();
            // Get workspace name from metadata, or create new
            var nb = IPython.notebook;
            var md = nb.metadata;
            if (md.hasOwnProperty(this.WS_NAME_KEY)) {
                // use existing name from notebook metadata
                name = md[this.WS_NAME_KEY];
            }
            else {
                // generate new one, and set into notebook metadata
                //md[this.WS_NAME_KEY] = name = this._uuidgen();
                // XXX: use one we know exists
                name = md[this.WS_NAME_KEY] = 'workspace_1';
            }

            console.log("Ensure WS");
            var that = this;
            this._ensureWs(name,
                // callback with value
                function(meta) { 
                    that.wsName = name;
                    // create/replace metadata
                    md[this.WS_META_KEY] = meta;
                    set_cb();
                }, 
                // error callback
                function(err) {
                    console.log("ERROR: getting workspace meta: " + JSON.stringify(err.error));
                }
            );
            return this;
        },
        /**
         * Ensure workspace this.wsName exists.
         *
         * @returns Metadata (mapping) for the workspace
         * @private
         */
        _ensureWs: function(name, callback, errorCallback) {
            var wsmeta = null;
            var that = this;
            // look for the workspace
            console.log("look for the workspace: " + name);
            this.wsClient.list_workspaces({auth: this.wsToken}, 
                function(wslist) {
                    for (var i=0; i < wslist.length; i++) {
                         var name_i = wslist[i][0];
                         if (name_i === name) {
                            params = {workspace: name_i, auth: that.wsToken};
                            wsmeta = that.wsClient.get_workspacemeta(params);
                            console.log('using existing workspace: ' + name);
                            break;
                         }
                    }
                    // create, if not found
                    if (wsmeta === null) {
                        console.log("  no existing workspace found for " + name);
                        var params = {
                            auth: that.wsToken,
                            workspace: name,
                            default_permission: 'w'
                        };
                        console.log("create new workspace: " + name);
                        that.wsClient.create_workspace(params).done(function(result) {
                            wsmeta = result;
                        });
                        // XXX: check return value
                        console.log('created new workspace: ' + name);
                    }
                    callback(wsmeta);
                }, 
                function(err) {
                    errorCallback(err);
                }
            );
        },
        /**
         * UUID generator.
         * @returns {string}
         */
        _uuidgen: function() {
            var s = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
            return(s);
        },
        /**
         * Wait for IPython notebook to exist.
         *
         * @returns {null}
         */
        _waitForIpython: function() {
            console.log("wait for IPython to fully load");
            if (typeof IPython == 'undefined' ||
                typeof IPython.notebook == 'undefined' ||
                typeof IPython.notebook.metadata == 'undefined') {
                setTimeout(this._waitForIpython, 100);
            }
            console.log("Houston, the IPython has loaded");
        },
        /**
         * Display new data in the table.
         *
         * @param results The new data
         * @returns this
         */
        updateResults: function(results) {
            var mdstring = '';
            $.each(IPython.notebook.metadata, function(key, val) {
                mdstring = mdstring + key + "=" + val + "\n";
            });
            console.log('notebook metadata = ' + mdstring);
            this.tableData = [ ]; // clear array
            // Extract selected columns from full result set
            var i1 = this.NAME_IDX, i2 = this.TYPE_IDX;
            for (var i=0; i < results.length; i++) {
                this.tableData.push([results[i][i1], results[i][i2]]);
            }
            return this;
        },

		loggedIn: function(token) {
            console.log("creating workspace service on loggedIn");
            /* with auth
            var auth = {token: token, user: 'narrative'};
            this.wsClient = new workspaceService(this.options.workspaceURL, auth);
            */
            this.wsClient = new workspaceService(this.options.workspaceURL);
            this.wsToken = token;
            this.isLoggedIn = true;
            this.render();
            return this;
		},

		loggedOut: function(e, args) {
            this.isLoggedIn = false;
            this.render();
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
