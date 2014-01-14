/**
 * Widget to display a table of data objects from a kbase workspace.
 *
 * Options:
 *    ws_id - the name of the workspace to show in this widget
 *    loadingImage - an image to show in the middle of the widget while loading data
 *    notLoggedInMsg - a string to put in the middle of the widget when not logged in.
 *
 * Triggers events:
 * dataUpdated.Narrative - when the loaded data table gets updated.
 * workspaceUpdated.Narrative - when the current workspace ID gets updated
 */
(function( $, undefined ) {

    $.KBWidget({
        name: "kbaseWorkspaceData", 
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        ws_client: null,
        table: null,
        tableData: [],
        $loginMessage: null,
        $errorMessage: null,
        $loading: null,
        isLoggedIn: false,
        ws_auth: null,
        // The set of all data currently loaded into the widget
        loadedData: {},
        options: {
            loadingImage: "static/kbase/images/ajax-loader.gif",
            notLoggedInMsg: "Please log in to view a workspace.",
            workspaceURL: "http://kbase.us/services/workspace",
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

            $(document).on(
                'dataLoadedQuery.Narrative', $.proxy(function(e, params, callback) {
                    var objList = this.getLoadedData(params);
                    if (callback) {
                        callback(objList);
                    }
                },
                this)
            );

            $(document).on(
                'updateData.Narrative', $.proxy(function(e) {
                    this.render();
                },
                this )
            );

            $(document).on(
                'workspaceQuery.Narrative', $.proxy(function(e, callback) {
                    if (callback) {
                        callback(this.ws_id);
                    }
                }, 
                this)
            );

            return this;
        },

        loggedInCallback: function(event, auth) {
            this.ws_auth = auth.token;
            this.ws_client = new workspaceService(this.options.workspaceURL);
            this.isLoggedIn = true;
            this.render();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.ws_auth = null;
            this.isLoggedIn = false;
            this.render();
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

            //filter out the narrative and workspace meta files
            var result_data = [];
            $.each(this.tableData, function( index, obj ) {

                if ((obj[1] != "Narrative") && (obj[1] != "workspace_meta")) {
                    result_data.push(obj);
                }
            });
            //this.tableData = result_data;
            this.table = $elem.dataTable( {
                aaData : result_data,
                aoColumns : [
                    /* Name */{
                      sTitle: 'Name',
                      bSortable: true,
                      bSearchable: true
                              },
                    /*Type */  {
                        sTitle: 'Type',
                        bSortable: true,
                        bSearchable: true
                    }, 
                ],
                aoColumnDefs: [
                        {
                            "bVisible": false, 
                            "aTargets": [ 1 ] 
                        },
                        {                            
                             mRender: function ( data, type, row ) {
                                return data + "<span class='kb-function-help'>?</span>";
                            },
                            "aTargets": [ 0 ] 
                        }
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
            var oTable = this.table;
            /* indices of displayed columns in result array */
            this.NAME_IDX = 0;
            this.TYPE_IDX = 1;
            // Add click handler for rows
            var self = this;
            $("#kb-ws .kb-table tbody tr").on("mouseover", function( e ) {
                if ( $(this).hasClass('row_selected') ) {
                    $(this).removeClass('row_selected');
                }
                else {
                    $elem.$('tr.row_selected').removeClass('row_selected');
                    $(this).addClass('row_selected');
                }
            });
            var get_selected = function(tbl) {
                return tbl.$('tr.row_selected');
            }
            $("#kb-ws .kb-table tbody tr").on("click", function( e ) {
                if ( $(this).hasClass('row_selected') ) {
                    var aPos = oTable.fnGetPosition( this );
                    var aData = oTable.fnGetData( aPos );
                    var type = aData[1];

                    console.log(this);
                    var row = $(this)[0];
                    //console.debug("obj",$(this));
                    var name = row.children[0].textContent;
                    //var type = row.children[1].textContent;
                    // populate and show info panel
                    //self.infoPanel(name, type, function(info) {
                    //    info.modal();
                    //});
                }
            });
            $("#kb-ws .kb-table tbody tr span").on("click", function( e ) {
                //if ( $(this).hasClass('row_selected') ) {
                    var row = $(this).parent().parent();
                    var aPos = oTable.fnGetPosition( $(row)[0] );
                    // Get the data array for this row
                    var aData = oTable.fnGetData( aPos );
                    var type = aData[1];

                    //console.debug("obj",$(this));
                    var name = $(row).children()[0].textContent;
                    //var type = $(row).children()[1].textContent;
                    // populate and show info panel
                    var name2 = name.replace("?","");

                    self.infoPanel(name2, type, function(info) {
                        info.modal();
                    });
                //}
            });
            return this;
        },

        /* Convert object metadata from list to object */
        _meta2obj: function(m) {
            var md;
            if (m[10] != undefined && m[10].length > 0) {
                eval("md = " + m[10] + ";");
            }
            return {
                'id': m[0], // an object_id
                'type': m[1], //an object_type
                'moddate': m[2].replace('T',' '), // a timestamp
                'instance': m[3], // instance int
                'command': m[4], // command string
                'lastmodifier': m[5], // a username string
                'owner': m[6], // a username string
                'workspace': m[7], // a workspace_id string
                'ref': m[8], // a workspace_ref string
                'chsum': m[9], // a string
                'metadata': md // an object
            };
        },

        infoPanel: function(name, type, callback) {
            console.debug("infoPanel.begin");
            // Load history for this obj
            var key = this._item_key(name, type);
            var meta = this._meta2obj(this.table_meta[key]);
            var opts = {workspace: this.ws_id, auth: this.ws_auth, id: meta.id, type: meta.type};
            //console.debug("get history, opts=",opts);
            var self = this;
            this.ws_client.object_history(opts,
                function (results) {
                    var $elem = $('#kb-obj');
                    $elem.find(".modal-title").text(name);
                    var objlist = _.map(results, self._meta2obj);
                    var versions = _.map(objlist, function(m) {
                            return [m.instance, m.moddate, m.lastmodifier]; 
                    });
                    self.infoTable(versions, objlist);
                    callback($elem);
                },
                function () {
                    alert("Failed to get info for '" + name + "'");
                }
            );
        },

        infoTable : function(data, objlist) {
            console.debug("infotable for objects",objlist);
            var t = $('#kb-obj .kb-table table').dataTable();
            t.fnDestroy();
            t.dataTable({
                aaData: data,
                aoColumns : [
                    { sTitle: 'Version', sWidth: "8em", bSortable: true, },
                    { sTitle: 'Date', sWidth: "15em", bSortable: true },
                    { sTitle: 'User', sWidth: "20em", bSortable: false }
                ],
                aaSorting: [[0, 'desc']],
                bAutoWidth: false,
                bFilter: false,
                bInfo: false,
                bLengthChange: false,
                bPaginate: true,
                iDisplayLength: 5,
                sPaginationType: "bootstrap"                
            });
            // Add click handler for rows
            var self = this;
            var _tr = "#kb-obj .kb-table tbody tr";
            var $rows = $(_tr); 
            $rows.on("mouseover", function( e ) {
                if ( $(this).hasClass('row_selected') ) {
                    $(this).removeClass('row_selected');
                }
                else {
                    t.$('tr.row_selected').removeClass('row_selected');
                    $(this).addClass('row_selected');
                }
            });
            var get_selected = function(tbl) {
                return tbl.$('tr.row_selected');
            }

            $rows.on("click", function( e ) {
                if ( $(this).hasClass('row_selected') ) {
                    var row = $(this)[0];
                    var version = row.children[0].textContent * 1;
                    // pick out instance that matches version
                    var info = _.reduce(objlist, function(memo, val) {
                        return val.instance == version ? val : memo;
                    }, null);
                    // populate and show description
                    if (info != null) {
                        self.descriptionPanel($("#kb-obj table.kb-info"), info);
                    }
                    else {
                        // XXX: internal error
                        alert("Object version " + version + " not found!");
                    }
                }
            });
            // Auto-select first row
            $(_tr + ':first-of-type').mouseover().click();
        },

        descriptionPanel: function($elem, data) {
            console.log("Populate descriptionPanel desc=",data);
            var $footer = $('#kb-obj .modal-footer');
            // remove old button bindings
            $('#kb-obj .modal-footer button.btn').unbind();
            $('#kb-obj .modal-footer button.btn').hide();
            var self = this;
            var body = $elem.find('tbody');
            body.empty();
            $.each(data, function(key, value) {
                if (key != 'metadata') {
                    var tr = body.append($('<tr>'));    
                    tr.append($('<td>').text(key));
                    tr.append($('<td>').text(value));
                }
            });
            // Add metadata, if there is any
            var $meta_elem = $('#kb-obj table.kb-metainfo');
            var body = $meta_elem.find('tbody')
            body.empty();
            console.debug("Metadata:", data.metadata);
            if (data.metadata !== undefined && Object.keys(data.metadata).length > 0) {
                $.each(data.metadata, function(key, value) {
                    console.debug("MD key=" + key + ", value=",value);
                    // expect keys with '_' to mark sub-sections
                    if (key.substr(0,1) == '_') {
                        var pfx = key.substr(1, key.length);
                        console.debug("Prefix: " + pfx);
                        $.each(value, function(key2, value2) {
                            var tr = body.append($('<tr>'));    
                            // key
                            var td = $('<td>');
                            var $prefix = $('<span>').addClass("text-muted").text(pfx + " ");
                            td.append($prefix);
                            td.append($('<span>').text(key2));
                            tr.append(td);
                            // value
                            tr.append($('<td>').text(value2));
                        });
                    }
                    else {
                        var tr = body.append($('<tr>'));    
                        tr.append($('<td>').text(key));
                        tr.append($('<td>').text(value));                        
                    }
                });
            }
            else {
                body.append($('<tr>')).append($('<td>').text("No metadata"));
            }
            // XXX: hack! add button for viz if network
            if (data.type == 'Networks') {
                this.addNetworkVisualization(data);
            }
            else {
                body.append($('<tr>')).append($('<td>').text("No metadata"));
            }
            // XXX: hack! add button for viz if network
            // (slightly less of a hack now? --Bill)
            this.addVisualizationButton(data);


            // if (data.type === 'Networks') {
            //     this.addNetworkVisualization(data);
            // }


        },

        addVisualizationButton: function(data) {
            var oid = data.id, oinst = data.instance;
            var $footer = $('#kb-obj .modal-footer');
            var $btn = $footer.find('button.kb-network');
            $btn.show();
            // add new button/binding
            var self = this;
            $btn.click(function(e) {
                // Figure out the viz function for the data type.
                // If it doesn't exist throw an error/warning and stop here.
                // Later-- have it autogen/insert some kind of table for unregistered data types.
                // Or maybe just insert the metadata?

                var type = data.type;
                type = type.trim().replace(/\s+/g, "_");

                console.debug('making viz for ' + type);
                var typeVizFunction = "_add" + type + "Visualization";
                if (!self[typeVizFunction])
                    typeVizFunction = "_addDefaultVisualization";

//                console.debug("creating vis. for object: " + oid + "." + oinst);
                var cell = IPython.notebook.insert_cell_at_bottom('markdown');
                // put div inside cell with an addr
                var eid = self._uuidgen();
                var content = "<div id='" + eid + "'></div>";
                cell.set_text(content);
                // re-render cell to make <div> appear
                cell.rendered = false;
                cell.render();
                // slap network into div by addr
                var $target = $('#' + eid);
                $target.css({'margin': '-10px'});

                self[typeVizFunction](data, $target);

                // $target.ForceDirectedNetwork({
                //     workspaceID: self.ws_id + "." + oid + "#" + oinst,
                //     token: self.ws_auth,
                // });
            });
        },

        _addNetworksVisualization: function(data, $target) {
            var oid = data.id;
            var oinst = data.instance;
            // var workspaceID = self.ws_id + "." + oid + "#" + oinst;
            // var token = self.ws_auth;
            $target.ForceDirectedNetwork({
                workspaceID: this.ws_id + "." + oid + "#" + oinst,
                token: this.ws_auth,
            });

        },

        _addGenomeVisualization: function(data, $target) {
            var tableRow = function(a, b) {
                return $("<tr>")
                       .append("<td>" + a + "</td>")
                       .append("<td>" + b + "</td>");
            };

            var calcGC = function(gc, total) {
                if (gc > 1)
                    gc = gc/total;
                return (100*gc).toFixed(2);
            };

            var $metaTable = $("<table>")
                             .addClass("table table-striped table-bordered")
                             .css({"margin-left":"auto", "margin-right":"auto", "width":"100%"})
                             .append(tableRow("<b>ID</b>", "<b>" + data.id + "</b>"))
                             .append(tableRow("Scientific Name", data.metadata.scientific_name))
                             .append(tableRow("Size", data.metadata.size + " bp"))
                             .append(tableRow("GC Content", calcGC(data.metadata.gc, data.metadata.size) + "%"))
                             .append(tableRow("Number Features", data.metadata.number_features))
                             .append(tableRow("Workspace", data.workspace));

            $target.append("<h3>Genome</h3>")
                   .append($metaTable);
        },

        _addMediaVisualization: function(data, $target) {
            $target.kbaseMediaEditorNarrative({
                ws: this.ws_id,
                auth: this.ws_auth,
                id: data.id,
            });
        },

        _addModelVisualization: function(data, $target) {
            var loading = $("<div>")
                          .addClass("loading")
                          .append("<img src='" + this.options.loadingImage + "' />Loading...");
            $target.append(loading);

            var fba = new fbaModelServices('http://kbase.us/services/fba_model_services');
            var modelAJAX = fba.get_models_async(
                {
                    models: [data.id], 
                    workspaces: [this.ws_id], 
                    auth: this.ws_auth
                },
                function(data) {
                    $target.find(".loading").remove();
                    $target.kbaseModelTabs({ modelsData: data });
                });
        },

        _addFBAVisualization: function(data, $target) {
            var loading = $("<div>")
                          .addClass("loading")
                          .append("<img src='" + this.options.loadingImage + "' />Loading...");
            $target.append(loading);

            var fba = new fbaModelServices('http://kbase.us/services/fba_model_services');
            var modelAJAX = fba.get_fbas_async(
                {
                    fbas: [data.id], 
                    workspaces: [this.ws_id], 
                    auth: this.ws_auth
                },
                function(data) {
                    $target.find(".loading").remove();
                    $target.kbaseFbaTabsNarrative({ fbaData: data });
                });
        },

        // _addContigSetVisualization: function(data, $target) {

        // },

        // Just adds a simple table with ID, datatype, owner, and ws location for now.
        // Maybe something fancier later.
        _addDefaultVisualization: function(data, $target) {
            var $metaTable = $("<table>")
                             .addClass("table table-striped table-bordered")
                             .css({"margin-left" : "auto", "margin-right" : "auto"});

            var makeRow = function(a, b) {
                var row = $("<tr>")
                          .append("<td>" + a + "</td>")
                          .append("<td>" + b + "</td>");

                return row;
            };

            console.log(data);

            $metaTable.append(makeRow("ID", data.id))
                      .append(makeRow("Type", data.type))
                      .append(makeRow("Owner", data.owner))
                      .append(makeRow("Workspace", data.workspace));

            $target.append("<h3>Data Object</h3>(No visualization available)")
                   .append($metaTable);

        },

        // _addNetworkVisualization: function(data) {
        //     var oid = data.id, oinst = data.instance;
        //     var $footer = $('#kb-obj .modal-footer');
        //     var $btn = $footer.find('button.kb-network');
        //     $btn.show();
        //     // add new button/binding
        //     var self = this;
        //     $btn.click(function(e) {
        //         console.debug("creating vis. for object: " + oid + "." + oinst);
        //         var cell = IPython.notebook.insert_cell_at_bottom('markdown');
        //         // put div inside cell with an addr
        //         var eid = self._uuidgen();
        //         var content = "<div id='" + eid + "'></div>";
        //         cell.set_text(content);
        //         // re-render cell to make <div> appear
        //         cell.rendered = false;
        //         cell.render();
        //         // slap network into div by addr
        //         var $target = $('#' + eid);
        //         $target.css({'margin': '-10px'});
        //         $target.ForceDirectedNetwork({
        //             workspaceID: self.ws_id + "." + oid + "#" + oinst,
        //             token: self.ws_auth,
        //         });
        //     });
        // },

        _uuidgen: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);});
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
                            that.updateResults(results);
                            that.createTable();
                        },
                        function(err) {
                            console.error("getting objects for workspace " + that.ws_id, err);
                            that.$loading.hide();
                            that.$errorMessage.show();
                        }
                    )
                    that.$loading.hide();
                });
            }
            return this;
        },

        /**
         * Returns the set of currently loaded data objects from the workspace.
         * These are returned as ______
         *
         * If 'type' is a string, then it returns only objects matching that
         * object type (this is case-sensitive!).
         * 
         * If 'type' is an array, then it returns only objects matching all of
         * those types.
         *
         * Returns data like this:
         * { 
         *   type1 : [ [metadata1], [metadata2], ... ],
         *   type2 : [ [metadata3], [metadata4], ... ]
         * }
         * @returns a list of data objects
         */
        getLoadedData: function(type) {
            if (!type || type.length === 0)
                return this.loadedData;

            var dataSet = {};
            if (typeof type === 'string') {
                type = [type];
            }
            if (Object.prototype.toString.call(type) === '[object Array]') {
                for (var i=0; i<type.length; i++) {
                    var dataType = type[i];
                    if (this.loadedData[dataType])
                        dataSet[dataType] = this.loadedData[dataType];
                }
            }

            return dataSet;
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
            this.trigger('workspaceUpdated.Narrative', this.ws_id);
            // Set the title of the UI element showing the data
            //$('#kb-wsname').text(name);
            
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
            /* Store the current set of loaded metadata as:
             * { 
             *    type1 : [ [metadata1], [metadata2], [metadata3], ... ],
             *    type2 : [ [metadata4], [metadata5], [metadata6], ... ]
             * }
             */
            this.loadedData = {};
            for (var i=0; i<results.length; i++) {
                var type = results[i][1];
                if (!this.loadedData[type])
                    this.loadedData[type] = [];
                this.loadedData[type].push(results[i]);
            }
//            console.log(this.loadedData);

            var mdstring = '';
            $.each(IPython.notebook.metadata, function(key, val) {
                mdstring = mdstring + key + "=" + val + "\n";
            });
//            console.log('notebook metadata = ' + mdstring);
            // just columns shown
            this.tableData = [ ];
            // all data from table, keyed by object name + type
            this.table_meta = { }; // *all* data from table
            this.table_meta_versions = {}; /* all versions of selected objects, empty for now */
            // Extract selected columns from full result set
            var i1 = this.NAME_IDX, i2 = this.TYPE_IDX;
            for (var i=0; i < results.length; i++) {
                var name = results[i][i1], type = results[i][i2];
                this.tableData.push([name, type]);
                this.table_meta[this._item_key(name, type)] = results[i];
            }

            this.trigger('dataUpdated.Narrative');
        },

        /**
         * Get key for one row in the object table.
         *
         * @param name (string): object name
         * @param type (string): object type
         * @return (string) key
         * @private
         */
        _item_key: function(name, type) {

            return name + '/' + type;
        },

        // loggedIn: function(client, token) {
  //           console.debug("WorkspaceData.loggedIn");
  //           this.ws_client = new workspaceService(this.options.workspaceURL);
  //           this.ws_auth = token;
  //           this.isLoggedIn = true;
  //           this.render();
  //           return this;
        // },

        // loggedOut: function(e, args) {
  //           this.isLoggedIn = false;
  //           this.render();
  //           return this;
  //       },

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
