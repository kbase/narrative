/**
 * Widget to display a table of data objects from a kbase workspace.
 *
 * Options:
 *    ws_id - the name of the workspace to show in this widget
 *    loadingImage - an image to show in the middle of the widget while loading data
 *    notLoggedInMsg - a string to put in the middle of the widget when not logged in.
 */
(function( $, undefined ) {

	$.KBWidget({
        name: "kbaseWorkspaceDataWidget", 
        parent: "kbaseWidget",
		version: "1.0.0",
		ws_client: null,
		table: null,
        tableData: [],
        $loginMessage: null,
        $errorMessage: null,
        $loading: null,
        isLoggedIn: false,
        ws_auth: null,
		options: {
			loadingImage: "ajax-loader.gif",
			notLoggedInMsg: "Please log in to view a workspace.",
            container: null,
            ws_id: null
		},
        // Constants
        WS_NAME_KEY: 'ws_name', // workspace name, in notebook metadata
        WS_META_KEY: 'ws_meta', // workspace meta (dict), in notebook metadata

        init: function(options) {
			this._super(options);
            this.ws_id = options.ws_id;
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
                    var opts = {workspace: that.ws_id, auth: that.ws_auth};
                    that.ws_client.list_workspace_objects(opts,
                        function(results) {
                            //console.log("Results: " + results);
                            that.updateResults(results);
                            that.createTable();
                        },
                        function(err) {
                            console.error("getting objects for workspace " + that.ws_id, err);
                            that.$loading.hide();
                            that.$errorMessage.show();
                            /* XXX: put junk in there
                            results = [ ];
                            for (var i=0; i < 5; i++) {
                                results.push(['luke' + i, 'Genome']);
                                results.push(['leia' + i, 'Model']);
                                results.push(['anakin' + i, 'Genome']);
                                results.push(['amidala' + i, 'Model']);
                            }
                            that.updateResults(results);
                            that.createTable();
                            */
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
         * Sets this.ws_id to name of workspace.
         * Also puts this into Notebook metadata.
         *
         * @returns this
         */
        setWs: function(set_cb) {
            console.debug("setWs.begin");
            if (this.ws_id != null) {
                console.debug("setWs.end already-set ws_id=" + this.ws_id);
                set_cb();
                return;
            }
            var name = null;
            // Get workspace name from metadata, or create new
            var nb = IPython.notebook;
            var md = nb.metadata;
            if (md.hasOwnProperty(this.WS_NAME_KEY)) {
                // use existing name from notebook metadata
                name = md[this.WS_NAME_KEY];
            }
            else {
                // use "home" workspace
                name = md[this.WS_NAME_KEY] = this.getHomeWorkspace();
            }
            console.debug("Ensuring workspace", name);
            this.ensureWorkspace(name,
                function() { set_cb(); },
                function(err) {
                    console.error("Cannot get/create workspace: " + name, err);
                });
            this.ws_id = name;
            return this;
        },

        getHomeWorkspace: function() {
            var _fn = "getHomeWorkspace."
            var user = "hdresden";
            if (this.ws_auth != null) {
                var un = this.ws_auth.match(/un=[\w_]+|/);
                user = un[0].substr(3, un[0].length - 3);
                console.debug(_fn + "extract user_name=" + user);
            }
            else {
                console.warn(_fn + "auth-not-set user_name=" + user);
            }
            return user + "_home";
        },

        /**
         * Ensure that workspace `name` exists, by trying to
         * create it. The provided errorCallback will only be called
         * if the call to create the workspace failed for some reason
         * _other_ than the prior existence of the workspace.
         */
        ensureWorkspace: function(name, _callback, _errorCallback) {
            var _fn = "ensureWorkspace.";
            var params = {auth: this.ws_auth, workspace: name};
            console.debug(_fn + "create name=" + name);
            return this.ws_client.create_workspace(params, _callback, function(result) {
                var error_text = result.error.message;
                if (error_text.indexOf("exists") >= 0) {
                    // The error message will have 'exists' if the workspace already exists.
                    // XXX: String checks are fragile, but we have no error type codes.
                    return _callback(result); // stay calm and carry on
                }
                else {
                    // Something other than workspace already existing;
                    // pass to user-provided error handler.
                    console.warn(_fn + "failed");
                    return _errorCallback(result);
                }
            });
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

		loggedIn: function(client, token) {
            console.debug("WorkspaceData.loggedIn");
            this.ws_client = client, this.ws_auth = token;
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
