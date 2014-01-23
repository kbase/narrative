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
        name: "kbaseWorkspaceDataDeluxe", 
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        wsClient: null,
        table: null,
        tableData: [],
        $loginMessage: null,
        $errorMessage: null,
        $loading: null,
        isLoggedIn: false,
//        authToken: null,
        // The set of all data currently loaded into the widget
        loadedData: {},
        options: {
            loadingImage: "static/kbase/images/ajax-loader.gif",
            notLoggedInMsg: "Please log in to view a workspace.",
            workspaceURL: "http://140.221.84.209:7058", // "http://kbase.us/services/ws",
            container: null,
        },
        // Constants
        WS_NAME_KEY: 'ws_name', // workspace name, in notebook metadata
        WS_META_KEY: 'ws_meta', // workspace meta (dict), in notebook metadata

        init: function(options) {
            this._super(options);
            this.wsId = options.wsId;

            $(document).on(
                'dataLoadedQuery.Narrative', $.proxy(function(e, params, callback) {
                    var objList = this.getLoadedData(params);
                    console.log('caught dataLoadedQuery.Narrative');
                    console.log(objList);
                    if (callback) {
                        callback(objList);
                    }
                },
                this)
            );

            $(document).on(
                'updateData.Narrative', $.proxy(function(e) {
                    this.refresh();
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

            this.createStructure()
                .createMessages()
                .render();

            this.trigger('workspaceUpdated.Narrative', this.wsId);

            return this;
        },

        loggedInCallback: function(event, auth) {
            this.authToken = auth;
            this.wsClient = new Workspace(this.options.workspaceURL, this.authToken);
            this.isLoggedIn = true;
            this.refresh();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.authToken = null;
            this.wsClient = null;
            this.isLoggedIn = false;
            this.refresh();
            return this;
        },

        /**
         * Create the overall apparatus for the widget.
         * Makes the header, table, etc. DOM elements.
         * @returns this
         * @private
         */
        createStructure: function() {
            // header bar.
            this.$elem.append($('<div>')
                              .addClass('kb-function-header')
                              .append('Data'));

            // encapsulating data panel - all the data-related stuff goes in here.
            // this way, it can all be hidden easily.
            this.$dataPanel = $('<div id="data-tabs">');
            this.$elem.append(this.$dataPanel);

            // a loading panel that just has a spinning gif sitting in the middle.
            this.$loadingPanel = $('<div>')
                                 .addClass('kb-data-loading')
                                 .append('<img src="' + this.options.loadingImage + '">')
                                 .hide();
            this.$elem.append(this.$loadingPanel);

            // The error panel should overlap everything.
            this.$errorPanel = $('<div>')
                               .addClass('kb-error')
                               .hide();
            this.$elem.append(this.$errorPanel);

            // Contains all of a user's data
            // XXX: Initially just data from the current workspace.
            this.$myDataDiv = $('<div id="my-data">');
            this.$myDataTable = $('<table cellpadding="0" cellspacing="0" border="0" class="table kb-data-table">');
            this.$myDataDiv.append(this.$myDataTable);

            // Contains all data in the current narrative.
            this.$narrativeDiv = $('<div id="narrative-data">');
            this.$narrativeDataTable = $('<table cellpadding="0" cellspacing="0" border="0" class="table kb-data-table">');
            this.$narrativeDiv.append(this.$narrativeDataTable);

            // Put these into tabs.
            this.$dataPanel.kbaseTabs(
                {
                    tabs : [
                        {
                            tab : 'My Workspace Data',       //name of the tab
                            content : this.$myDataDiv,       //jquery object to stuff into the content
                        },
                        {
                            tab : 'Narrative',
                            content : this.$narrativeDiv,
                        },
                    ],
                }
            );

            // Initialize the datatables.
            this.$myDataTable.dataTable({
                sScrollX: '100%',
                iDisplayLength: -1,
                bPaginate: false,
                oLanguage: {
                    sZeroRecords: '<div style="text-align: center">No data found. Click <a href="http://kbase.us" target="_new">Here</a> to upload or use the search bar above.</div>',
                },
                aoColumns: [
                    { "sTitle": "Workspace", bVisible: false},
                    { "sTitle": "ID" },
                    { "sTitle": "Type", bVisible: false },
                ],
                aoColumnDefs: [
                    { 'bSortable': false, 'aTargets': [ 0 ] },
                    {
                        mRender: function(data, type, row) {
                            // console.log(data + " - " + type + " - " + row);
                            // var $div = $('<div>')
                            //            .append(data)
                            //            .append($('<span>')
                            //                    .addClass('kb-function-help')
                            //                    .append('?')
                            //                    .click(function(event) { console.debug('clicked function link!'); }));
                            // return $div;
                            return data + 
                                   "<span class='glyphicon glyphicon-question-sign kb-function-help' " + 
                                   "data-ws='" + row[7] + "' " +
                                   "data-id='" + row[1] + "' " + 
                                   "style='margin-top: -3px'></span>";
                        },
                        aTargets: [1]
                    },
                ],
                bInfo: false,
                bLengthChange: false,
                bPaginate: false,
                bAutoWidth: true,
                bScrollCollapse: true,
                sScrollY: '240px',
            });

            this.$narrativeDataTable.dataTable({
                sScrollX: '100%',
                iDisplayLength: -1,
                bPaginate: false,
                oLanguage: {
                    sZeroRecords: '<div style="text-align: center">You haven\'t used any data in this narrative yet.</div>',
                },
                aoColumns: [
                    { "sTitle": "ID" },
                    { "sTitle": "Type", bVisible: false },
                ],
                aoColumnDefs: [
                    { 'bSortable': false, 'aTargets': [ 0 ] },
                    {
                        mRender: function(data, type, row) {
                            return data + "<span class='glyphicon glyphicon-question-sign kb-function-help' style='margin-top: -3px'></span>";
                        },
                        aTargets: [1]
                    },
                ],
                bInfo: false,
                bLengthChange: false,
                bPaginate: false,
                bAutoWidth: true,
                bScrollCollapse: true,
                sScrollY: '270px'
            });

            this.$infoModal = $('<div>')
                              .addClass('modal fade')
                              .append($('<div>')
                                      .addClass('modal-dialog')
                                      .append($('<div>')
                                              .addClass('modal-content')
                                              .append($('<div>')
                                                      .addClass('modal-header')
                                                      .append($('<button>')
                                                              .attr({
                                                                'type' : 'button',
                                                                'class' : 'close',
                                                                'data-dismiss' : 'modal',
                                                                'aria-hidden' : 'true'
                                                              })
                                                              .append('&times;')
                                                              )
                                                      .append($('<h3>')
                                                              .addClass('modal-title'))
                                                      )
                                              .append($('<div>')
                                                      .addClass('modal-body'))
                                              .append($('<div>')
                                                      .addClass('modal-footer'))
                                              )
                                     );

            this.$elem.append(this.$infoModal);

            return this;

        },

        /**
         * Create the message element.
         * @returns this
         */
        createMessages: function() {
            this.$loginMessage = $('<span>')
                .text(this.options.notLoggedInMsg);
            this.$loadingMessage = $('<div style="text-align:center">').append($('<img src="' + this.options.loadingImage + '">'));
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
         * Should reload all data without destroying stuff.
         * Should.
         */
        refresh: function() {
            if (!this.wsClient) return;
            this.dbg("workspaceDataDeluxe.refresh");

            this.showLoadingPanel();
            // Refresh the workspace client to work with the current token.
//            this.wsClient = new Workspace(this.workspaceURL, this.authToken);

            this.wsClient.list_objects( 
                {
                    workspaces : [this.wsId],
                }, 
                $.proxy(function(list) {
                    this.loadedData = {};
                    for (var i=0; i<list.length; i++) {
                        var type = list[i][2];
                        if (!this.loadedData[type])
                            this.loadedData[type] = [];
                        this.loadedData[type].push(list[i]);
                    }

                    this.$myDataTable.fnClearTable();
                    this.$myDataTable.fnAddData(list);
                    this.$myDataTable.find('.kb-function-help').click(
                        $.proxy(function(event) {
                            var ws = $(event.target).attr('data-ws');
                            var id = $(event.target).attr('data-id');
                            this.showInfoModal(ws, id);
                        }, 
                        this)
                    );
                    this.trigger('dataUpdated.Narrative');
                    this.showDataPanel();

                }, this), 
                $.proxy(function(error) {
                    this.showError(error);
                }, this)
            );
        },

        showInfoModal: function(workspace, id) {
            this.$infoModal.find('.modal-title').html(id);
            this.$infoModal.find('.modal-body').empty().append(this.$loadingMessage);
            this.$infoModal.modal();

    // funcdef get_object_info(list<ObjectIdentity> object_ids,
    //     boolean includeMetadata) returns (list<object_info> info);

    // typedef structure {
    //     ws_name workspace;
    //     ws_id wsid;
    //     obj_name name;
    //     obj_id objid;
    //     obj_ver ver;
    //     obj_ref ref;
    // } ObjectIdentity;
            var addRow = function(a, b) {
                return "<tr><td><b>" + a + "</b></td><td>" + b + "</td></tr>";
            };

            var prettyModDate = function(timestamp) {
                var format = function(x) {
                    if (x < 10)
                        x = '0' + x;
                    return x;
                };

                var d = new Date(timestamp);
                var hours = format(d.getHours());
                // var meridian = "am";
                // if (hours >= 12) {
                //     hours -= 12;
                //     meridian = "pm";
                // }
                // if (hours === 0)
                //     hours = 12;

                var minutes = format(d.getMinutes());
                var seconds = format(d.getSeconds());
                var month = d.getMonth()+1;
                var day = format(d.getDate());
                var year = d.getFullYear();

                return month + "/" + day + "/" + year + ", " + hours + ":" + minutes + ":" + seconds;
            };

            var obj = {
                'workspace' : workspace,
                'name' : id, 
            };

            // Fetch the workspace object.
            this.wsClient.get_object_info([obj], 1, 
                $.proxy(function(info) {

                    // Simple properties panel for the object.
                    var $propPanel = $('<div>')
                                     .append($('<table>')
                                             .addClass('table table-bordered table-striped')
                                             .append(addRow('ID', info[0][0]))
                                             .append(addRow('Name', info[0][1]))
                                             .append(addRow('Type', info[0][2]))
                                             .append(addRow('Save Date', prettyModDate(info[0][3])))
                                             .append(addRow('Version', info[0][4]))
                                             .append(addRow('Saved By', info[0][5]))
                                             .append(addRow('Workspace ID', info[0][6]))
                                             .append(addRow('Workspace Name', info[0][7]))
                                             .append(addRow('Checksum', info[0][8]))
                                             .append(addRow('Size (B)', info[0][9]))
                                            );

                    // Parse the user metadata field.
                    var s = info[0][10];
                    if (typeof s != 'string') {
                        s = JSON.stringify(s, undefined, 2);
                        s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        s = s.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
                            function (match) {
                                var cls = 'number';
                                if (/^"/.test(match)) {
                                    if (/:$/.test(match)) {
                                        cls = 'key';
                                    } else {
                                        cls = 'string';
                                    }
                                } else if (/true|false/.test(match)) {
                                    cls = 'boolean';
                                } else if (/null/.test(match)) {
                                    cls = 'null';
                                }
                                return '<span class="' + cls + '">' + match + '</span>';
                            }
                        );
                    }
                    var $metadataPanel = $('<div>').append(($('<pre>').append(s)));

                    // fetch the typespec.
                    this.wsClient.get_type_info(info[0][2], 
                        $.proxy(function(type) {
                            var s = type;
                            if (typeof s != 'string') {
                                s = JSON.stringify(s, undefined, 2);
                                s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                s = s.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
                                    function (match) {
                                        var cls = 'number';
                                        if (/^"/.test(match)) {
                                            if (/:$/.test(match)) {
                                                cls = 'key';
                                            } else {
                                                cls = 'string';
                                            }
                                        } else if (/true|false/.test(match)) {
                                            cls = 'boolean';
                                        } else if (/null/.test(match)) {
                                            cls = 'null';
                                        }
                                        return '<span class="' + cls + '">' + match + '</span>';
                                    }
                                );
                            }
                            var $typePanel = $('<div>')
                                             .append($('<pre>')
                                                     .append(s)
                                                     .css({'overflow-y' : 'scroll', 'max-height' : '350px'})

                                                );
                            var $infoAccordion = $('<div>');
                            this.$infoModal.find('.modal-body').empty().append($infoAccordion);
                            $infoAccordion.kbaseAccordion(
                                { 
                                    elements: 
                                    [
                                        { 'title' : 'Properties', 'body' : $propPanel }, 
                                        { 'title' : 'Metadata', 'body' : $metadataPanel },
                                        { 'title' : 'Type Info', 'body' : $typePanel }
                                    ]
                                }
                            );

                            var $buttonFooter = $('<div>')
                                                .append($('<button>')
                                                        .attr({
                                                            'type' : 'button',
                                                            'class' : 'btn btn-primary',
                                                            'data-dismiss' : 'modal'
                                                        })
                                                        .append('Close'));

                            this.$infoModal.find('.modal-footer').empty().append($buttonFooter);

                            // this.$infoModal
                            //                           .append($('<button>')
                            //                                   .attr({
                            //                                     'type' : 'button',
                            //                                     'class' : 'btn btn-primary',
                            //                                     'data-dismiss' : 'modal',
                            //                                   })
                            //                                   .append('Close'))
                                                      
                        }, this),

                        $.proxy(function(error) {
                            console.debug(error);
                        }, this)
                    );

                }, this),

                $.proxy(function(error) {
                    this.$infoModal.find('.modal-body').empty().append(this.buildWorkspaceErrorPanel(error));
                }, this)
            );
        },

        /**
         * Returns a jQuery object containing information about the given error that's been passed from the workspace.
         */
        buildWorkspaceErrorPanel: function(error) {
            var $errorPanel = $('<div>');
            var $errorHeader = $('<div>')
                               .addClass('alert alert-danger')
                               .append('<b>Sorry, an error occurred while loading object data.</b><br>Please contact the KBase team at <a href="mailto:help@kbase.us?subject=Narrative%20data%20loading%20error">help@kbase.us</a> with the information below.');

            $errorPanel.append($errorHeader);

            // If it's a string, just dump the string.
            if (typeof error === 'string') {
                $errorPanel.append($('<div>').append(error));
            }

            // If it's an object, expect an error object as returned by the execute_reply callback from the IPython kernel.
            else if (typeof error === 'object') {
                var $details = $('<div>');
                $details.append($('<div>').append('<b>Code:</b> ' + error.error.code))
                        .append($('<div>').append('<b>Message:</b> ' + error.error.message));

                var $tracebackDiv = $('<div>')
                                 .addClass('kb-function-error-traceback')
                                 .append(error.error.error);
                // for (var i=0; i<error.traceback.length; i++) {
                //     $tracebackDiv.append(error.traceback[i] + "<br>");
                // }

                var $tracebackPanel = $('<div>');
                var tracebackAccordion = [{'title' : 'Details', 'body' : $tracebackDiv}];

                $errorPanel.append($details);
                //                 .append($tracebackPanel);
                // $tracebackPanel.kbaseAccordion({ elements : tracebackAccordion });
            }

            return $errorPanel;
        },

        /* Convert object metadata from list to object */
        // _meta2obj: function(m) {
        //     var md;
        //     if (m[10] != undefined && m[10].length > 0) {
        //         eval("md = " + m[10] + ";");
        //     }
        //     return {
        //         'id': m[0], // an object_id
        //         'type': m[1], //an object_type
        //         'moddate': m[2].replace('T',' '), // a timestamp
        //         'instance': m[3], // instance int
        //         'command': m[4], // command string
        //         'lastmodifier': m[5], // a username string
        //         'owner': m[6], // a username string
        //         'workspace': m[7], // a workspace_id string
        //         'ref': m[8], // a workspace_ref string
        //         'chsum': m[9], // a string
        //         'metadata': md // an object
        //     };
        // },

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

//         addVisualizationButton: function(data) {
//             var oid = data.id, oinst = data.instance;
//             var $footer = $('#kb-obj .modal-footer');
//             var $btn = $footer.find('button.kb-network');
//             $btn.show();
//             // add new button/binding
//             var self = this;
//             $btn.click(function(e) {
//                 // Figure out the viz function for the data type.
//                 // If it doesn't exist throw an error/warning and stop here.
//                 // Later-- have it autogen/insert some kind of table for unregistered data types.
//                 // Or maybe just insert the metadata?

//                 var type = data.type;
//                 type = type.trim().replace(/\s+/g, "_");

//                 console.debug('making viz for ' + type);
//                 var typeVizFunction = "_add" + type + "Visualization";
//                 if (!self[typeVizFunction])
//                     typeVizFunction = "_addDefaultVisualization";

// //                console.debug("creating vis. for object: " + oid + "." + oinst);
//                 var cell = IPython.notebook.insert_cell_at_bottom('markdown');
//                 // put div inside cell with an addr
//                 var eid = self._uuidgen();
//                 var content = "<div id='" + eid + "'></div>";
//                 cell.set_text(content);
//                 // re-render cell to make <div> appear
//                 cell.rendered = false;
//                 cell.render();
//                 // slap network into div by addr
//                 var $target = $('#' + eid);
//                 $target.css({'margin': '-10px'});

//                 self[typeVizFunction](data, $target);

//                 // $target.ForceDirectedNetwork({
//                 //     workspaceID: self.ws_id + "." + oid + "#" + oinst,
//                 //     token: self.ws_auth,
//                 // });
//             });
//         },

        // _addNetworksVisualization: function(data, $target) {
        //     var oid = data.id;
        //     var oinst = data.instance;
        //     // var workspaceID = self.ws_id + "." + oid + "#" + oinst;
        //     // var token = self.ws_auth;
        //     $target.ForceDirectedNetwork({
        //         workspaceID: this.ws_id + "." + oid + "#" + oinst,
        //         token: this.ws_auth,
        //     });

        // },

        // _addGenomeVisualization: function(data, $target) {
        //     var tableRow = function(a, b) {
        //         return $("<tr>")
        //                .append("<td>" + a + "</td>")
        //                .append("<td>" + b + "</td>");
        //     };

        //     var calcGC = function(gc, total) {
        //         if (gc > 1)
        //             gc = gc/total;
        //         return (100*gc).toFixed(2);
        //     };

        //     var $metaTable = $("<table>")
        //                      .addClass("table table-striped table-bordered")
        //                      .css({"margin-left":"auto", "margin-right":"auto", "width":"100%"})
        //                      .append(tableRow("<b>ID</b>", "<b>" + data.id + "</b>"))
        //                      .append(tableRow("Scientific Name", data.metadata.scientific_name))
        //                      .append(tableRow("Size", data.metadata.size + " bp"))
        //                      .append(tableRow("GC Content", calcGC(data.metadata.gc, data.metadata.size) + "%"))
        //                      .append(tableRow("Number Features", data.metadata.number_features))
        //                      .append(tableRow("Workspace", data.workspace));

        //     $target.append("<h3>Genome</h3>")
        //            .append($metaTable);
        // },

        // _addMediaVisualization: function(data, $target) {
        //     $target.kbaseMediaEditorNarrative({
        //         ws: this.ws_id,
        //         auth: this.ws_auth,
        //         id: data.id,
        //     });
        // },

        // _addModelVisualization: function(data, $target) {
        //     var loading = $("<div>")
        //                   .addClass("loading")
        //                   .append("<img src='" + this.options.loadingImage + "' />Loading...");
        //     $target.append(loading);

        //     var fba = new fbaModelServices('http://kbase.us/services/fba_model_services');
        //     var modelAJAX = fba.get_models_async(
        //         {
        //             models: [data.id], 
        //             workspaces: [this.ws_id], 
        //             auth: this.ws_auth
        //         },
        //         function(data) {
        //             $target.find(".loading").remove();
        //             $target.kbaseModelTabs({ modelsData: data });
        //         });
        // },

        // _addFBAVisualization: function(data, $target) {
        //     var loading = $("<div>")
        //                   .addClass("loading")
        //                   .append("<img src='" + this.options.loadingImage + "' />Loading...");
        //     $target.append(loading);

        //     var fba = new fbaModelServices('http://kbase.us/services/fba_model_services');
        //     var modelAJAX = fba.get_fbas_async(
        //         {
        //             fbas: [data.id], 
        //             workspaces: [this.ws_id], 
        //             auth: this.ws_auth
        //         },
        //         function(data) {
        //             $target.find(".loading").remove();
        //             $target.kbaseFbaTabsNarrative({ fbaData: data });
        //         });
        // },

        // // _addContigSetVisualization: function(data, $target) {

        // // },

        // // Just adds a simple table with ID, datatype, owner, and ws location for now.
        // // Maybe something fancier later.
        // _addDefaultVisualization: function(data, $target) {
        //     var $metaTable = $("<table>")
        //                      .addClass("table table-striped table-bordered")
        //                      .css({"margin-left" : "auto", "margin-right" : "auto"});

        //     var makeRow = function(a, b) {
        //         var row = $("<tr>")
        //                   .append("<td>" + a + "</td>")
        //                   .append("<td>" + b + "</td>");

        //         return row;
        //     };

        //     console.log(data);

        //     $metaTable.append(makeRow("ID", data.id))
        //               .append(makeRow("Type", data.type))
        //               .append(makeRow("Owner", data.owner))
        //               .append(makeRow("Workspace", data.workspace));

        //     $target.append("<h3>Data Object</h3>(No visualization available)")
        //            .append($metaTable);

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
            // if (!this.isLoggedIn) {
            //     this.clearTable();
            //     this.$loginMessage.show();
            // }
//             else {
// //                this.$loading.show();
//                 var that = this;

//                 this.setWs(function() {
//                     var opts = {workspace: that.ws_id, auth: that.ws_auth};
//                     that.ws_client.list_workspace_objects(opts,
//                         function(results) {
//                             that.updateResults(results);
//                             that.createTable();
//                         },
//                         function(err) {
//                             that.$loading.hide();
//                             that.$errorMessage.show();
//                         }
//                     )
// //                    that.$loading.hide();
//                 });
//             }
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
//         updateResults: function(results) {
//             /* Store the current set of loaded metadata as:
//              * { 
//              *    type1 : [ [metadata1], [metadata2], [metadata3], ... ],
//              *    type2 : [ [metadata4], [metadata5], [metadata6], ... ]
//              * }
//              */
//             this.loadedData = {};
//             for (var i=0; i<results.length; i++) {
//                 var type = results[i][1];
//                 if (!this.loadedData[type])
//                     this.loadedData[type] = [];
//                 this.loadedData[type].push(results[i]);
//             }
// //            console.log(this.loadedData);

//             var mdstring = '';
//             $.each(IPython.notebook.metadata, function(key, val) {
//                 mdstring = mdstring + key + "=" + val + "\n";
//             });
// //            console.log('notebook metadata = ' + mdstring);
//             // just columns shown
//             this.tableData = [ ];
//             // all data from table, keyed by object name + type
//             this.table_meta = { }; // *all* data from table
//             this.table_meta_versions = {}; /* all versions of selected objects, empty for now */
//             // Extract selected columns from full result set
//             var i1 = this.NAME_IDX, i2 = this.TYPE_IDX;
//             for (var i=0; i < results.length; i++) {
//                 var name = results[i][i1], type = results[i][i2];
//                 this.tableData.push([name, type]);
//                 this.table_meta[this._item_key(name, type)] = results[i];
//             }

//             this.trigger('dataUpdated.Narrative');
//         },

        /**
         * Get key for one row in the object table.
         *
         * @param name (string): object name
         * @param type (string): object type
         * @return (string) key
         * @private
         */
        // _item_key: function(name, type) {

        //     return name + '/' + type;
        // },

        clearTable: function() {
            if (this.table) {
                this.table.fnDestroy();
                this.table = null;
            }
            return this;
        },

        showLoadingPanel: function() {
            this.$dataPanel.hide();
            this.$errorPanel.hide();
            this.$loadingPanel.show();
        },

        showDataPanel: function() {
            this.$loadingPanel.hide();
            this.$errorPanel.hide();
            this.$dataPanel.show();
        },

        /**
         * Shows an error text message on top of the panel. All other pieces are hidden.
         * @param {string} error - the text of the error message
         * @private
         */
        showError: function(error) {
            var $errorHeader = $('<div>')
                               .addClass('alert alert-danger')
                               .append('<b>Sorry, an error occurred while loading data.</b><br>Please contact the KBase team at <a href="mailto:help@kbase.us?subject=Narrative%20data%20loading%20error">help@kbase.us</a> with the information below.');

            this.$errorPanel.empty();
            this.$errorPanel.append($errorHeader);

            // If it's a string, just dump the string.
            if (typeof error === 'string') {
                this.$errorPanel.append($('<div>').append(error));
            }

            // If it's an object, expect an error object as returned by the execute_reply callback from the IPython kernel.
            else if (typeof error === 'object') {
                console.debug(error);
                var $details = $('<div>');
                $details.append($('<div>').append('<b>Code:</b> ' + error.error.code))
                        .append($('<div>').append('<b>Message:</b> ' + error.error.message));

                var $tracebackDiv = $('<div>')
                                 .addClass('kb-function-error-traceback')
                                 .append(error.error.error);
                // for (var i=0; i<error.traceback.length; i++) {
                //     $tracebackDiv.append(error.traceback[i] + "<br>");
                // }

                var $tracebackPanel = $('<div>');
                var tracebackAccordion = [{'title' : 'Details', 'body' : $tracebackDiv}];

                this.$errorPanel.append($details);
                //                 .append($tracebackPanel);
                // $tracebackPanel.kbaseAccordion({ elements : tracebackAccordion });
            }

            this.$dataPanel.hide();
            this.$loadingPanel.hide();
            this.$errorPanel.show();
        },
    });

})( jQuery );
