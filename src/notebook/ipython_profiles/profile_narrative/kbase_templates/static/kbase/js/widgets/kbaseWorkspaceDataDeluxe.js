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
            wsBrowserURL: "http://140.221.85.168/landing-pages/#/ws/",
            landingPageURL: "http://140.221.85.168/landing-pages/#/",
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

            $(document).on(
                'dataInfoClicked.Narrative', $.proxy(function(e, workspace, id) {
                    this.showInfoModal(workspace, id);
                }, 
                this)
            );

            this.createStructure()
                .createMessages();

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
            // this.$myDataTable = $('<table cellpadding="0" cellspacing="0" border="0" class="table kb-data-table">');
            // this.$myDataSelect = $('<select>')
            //                      .addClass('form-control')
            //                      .css({'width' : '95%'});
            // this.$myDataSearch = $('<input>')
            //                      .attr({
            //                         'type' : 'text',
            //                         'class' : 'form-control',
            //                         'style' : 'width:95%',
            //                         'placeholder' : 'Search',
            //                      });
            // this.$myDataDiv.append($('<div>').append(this.$myDataSelect))
            //                .append($('<div>').append(this.$myDataSearch))
            //                .append(this.$myDataTable);

            // this.$myDataSelect.change($.proxy(function(event) {
            //     var filterValue = '';
            //     this.$myDataSelect.find('option:selected').each(function(){ filterValue = $( this ).val(); });
            //     console.log(filterValue);
            //     this.$myDataTable.fnFilter(filterValue, 2);
            // }, this));

            // this.$myDataSearch.keyup($.proxy(function(event) {
            //     var value = this.$myDataSearch.val();
            //     this.$myDataTable.fnFilter(value, 1);
            // }, this));

            // Contains all data in the current narrative.
            this.$narrativeDiv = $('<div id="narrative-data">');
            this.$narrativeDataTable = $('<table cellpadding="0" cellspacing="0" border="0" class="table kb-data-table">');
//            this.$narrativeDiv.append('<div ><select style="width:100%"><option>All Types</option></select></div>');
//            this.$narrativeDiv.append('<div ><input style="width:100%" type="text" value="search"></input></div>');
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

            this.$myDataDiv.kbaseNarrativeDataTable();


            // Initialize the datatables.
            // this.$myDataTable.dataTable({
            //     sScrollX: '100%',
            //     iDisplayLength: -1,
            //     bPaginate: false,
            //     oLanguage: {
            //         sZeroRecords: '<div style="text-align: center">No data found. Click <a href="http://kbase.us" target="_new">Here</a> to upload or use the search bar above.</div>',
            //     },
            //     aoColumns: [
            //         { "sTitle": "Workspace", bVisible: false},
            //         { "sTitle": "ID" },
            //         { "sTitle": "Type", bVisible: false },
            //     ],
            //     aoColumnDefs: [
            //         { 'bSortable': false, 'aTargets': [ 0 ] },
            //         {
            //             mRender: function(data, type, row) {
            //                 return data + 
            //                        "<span class='glyphicon glyphicon-question-sign kb-function-help' " + 
            //                        "data-ws='" + row[7] + "' " +
            //                        "data-id='" + row[1] + "' " + 
            //                        "style='margin-top: -3px'></span>";
            //             },
            //             aTargets: [1]
            //         },
            //     ],
            //     bInfo: false,
            //     bLengthChange: false,
            //     bPaginate: false,
            //     bAutoWidth: true,
            //     bScrollCollapse: true,
            //     sScrollY: '240px',
            // });

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

            this.showLoadingPanel();
            // Refresh the workspace client to work with the current token.

            this.wsClient.list_objects( 
                {
                    workspaces : [this.wsId],
                }, 
                $.proxy(function(list) {
                    // first, go through the list and pull out Narrative objects.
                    // otherwise it's a little recursive. Including a Narrative within its narrative 
                    // would give me nightmares.

                    this.loadedData = {};
                    for (var i=0; i<list.length; i++) {
                        var type = list[i][2];
                        if (type.indexOf('KBaseNarrative.Narrative') !== -1) {
                            list.splice(i, 1);
                            i--;
                        }
                        else {
                            if (!this.loadedData[type])
                                this.loadedData[type] = [];
                            this.loadedData[type].push(list[i]);
                        }
                    }

                    this.$myDataDiv.kbaseNarrativeDataTable('setData', this.loadedData);

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
//                                        { 'title' : 'Type Info', 'body' : $typePanel }
                                    ]
                                }
                            );

                            var dataType = info[0][2];
                            var landingPage = this.options.landingPageURL + dataType + '/' + workspace + '/' + id;

                            var specPage = this.options.landingPageURL + 'spec/type/' + dataType;

                            var $buttonFooter = $('<div>')
                                                .append($('<button>')
                                                        .attr({
                                                            'type' : 'button',
                                                            'class' : 'btn btn-default',
                                                        })
                                                        .append('Object Details')
                                                        .click(function(event) {
                                                            window.open(landingPage);
                                                        }))
                                                .append($('<button>')
                                                        .attr({
                                                            'type' : 'button',
                                                            'class' : 'btn btn-default',
                                                        })
                                                        .append('Object Type Details')
                                                        .click(function(event) {
                                                            window.open(specPage);
                                                        }))
                                                .append($('<button>')
                                                        .attr({
                                                            'type' : 'button',
                                                            'class' : 'btn btn-primary',
                                                            'data-dismiss' : 'modal'
                                                        })
                                                        .append('Close'));

                            this.$infoModal.find('.modal-footer').empty().append($buttonFooter);
                                                      
                        }, this),

                        $.proxy(function(error) {
                            console.debug(error);
                        }, this)
                    );

                }, this),

                $.proxy(function(error) {
                    var $errorPanel = this.buildWorkspaceErrorPanel("Sorry, an error occurred while loading object data", error);
                    this.$infoModal.find('.modal-body').empty().append($errorPanel);
                }, this)
            );
        },

        /**
         * Returns a jQuery object containing information about the given error that's been passed from the workspace.
         */
        buildWorkspaceErrorPanel: function(msg, error) {
            var $errorPanel = $('<div>');
            var $errorHeader = $('<div>')
                               .addClass('alert alert-danger')
                               .append('<b>' + msg + '</b><br>Please contact the KBase team at <a href="mailto:help@kbase.us?subject=Narrative%20data%20loading%20error">help@kbase.us</a> with the information below.');

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

        // infoPanel: function(name, type, callback) {
        //     console.debug("infoPanel.begin");
        //     // Load history for this obj
        //     var key = this._item_key(name, type);
        //     var meta = this._meta2obj(this.table_meta[key]);
        //     var opts = {workspace: this.ws_id, auth: this.ws_auth, id: meta.id, type: meta.type};
        //     //console.debug("get history, opts=",opts);
        //     var self = this;
        //     this.ws_client.object_history(opts,
        //         function (results) {
        //             var $elem = $('#kb-obj');
        //             $elem.find(".modal-title").text(name);
        //             var objlist = _.map(results, self._meta2obj);
        //             var versions = _.map(objlist, function(m) {
        //                     return [m.instance, m.moddate, m.lastmodifier]; 
        //             });
        //             self.infoTable(versions, objlist);
        //             callback($elem);
        //         },
        //         function () {
        //             alert("Failed to get info for '" + name + "'");
        //         }
        //     );
        // },

        // infoTable : function(data, objlist) {
        //     console.debug("infotable for objects",objlist);
        //     var t = $('#kb-obj .kb-table table').dataTable();
        //     t.fnDestroy();
        //     t.dataTable({
        //         aaData: data,
        //         aoColumns : [
        //             { sTitle: 'Version', sWidth: "8em", bSortable: true, },
        //             { sTitle: 'Date', sWidth: "15em", bSortable: true },
        //             { sTitle: 'User', sWidth: "20em", bSortable: false }
        //         ],
        //         aaSorting: [[0, 'desc']],
        //         bAutoWidth: false,
        //         bFilter: false,
        //         bInfo: false,
        //         bLengthChange: false,
        //         bPaginate: true,
        //         iDisplayLength: 5,
        //         sPaginationType: "bootstrap"                
        //     });
        //     // Add click handler for rows
        //     var self = this;
        //     var _tr = "#kb-obj .kb-table tbody tr";
        //     var $rows = $(_tr); 
        //     $rows.on("mouseover", function( e ) {
        //         if ( $(this).hasClass('row_selected') ) {
        //             $(this).removeClass('row_selected');
        //         }
        //         else {
        //             t.$('tr.row_selected').removeClass('row_selected');
        //             $(this).addClass('row_selected');
        //         }
        //     });
        //     var get_selected = function(tbl) {
        //         return tbl.$('tr.row_selected');
        //     }

        //     $rows.on("click", function( e ) {
        //         if ( $(this).hasClass('row_selected') ) {
        //             var row = $(this)[0];
        //             var version = row.children[0].textContent * 1;
        //             // pick out instance that matches version
        //             var info = _.reduce(objlist, function(memo, val) {
        //                 return val.instance == version ? val : memo;
        //             }, null);
        //             // populate and show description
        //             if (info != null) {
        //                 self.descriptionPanel($("#kb-obj table.kb-info"), info);
        //             }
        //             else {
        //                 // XXX: internal error
        //                 alert("Object version " + version + " not found!");
        //             }
        //         }
        //     });
        //     // Auto-select first row
        //     $(_tr + ':first-of-type').mouseover().click();
        // },

        // descriptionPanel: function($elem, data) {
        //     console.log("Populate descriptionPanel desc=",data);
        //     var $footer = $('#kb-obj .modal-footer');
        //     // remove old button bindings
        //     $('#kb-obj .modal-footer button.btn').unbind();
        //     $('#kb-obj .modal-footer button.btn').hide();
        //     var self = this;
        //     var body = $elem.find('tbody');
        //     body.empty();
        //     $.each(data, function(key, value) {
        //         if (key != 'metadata') {
        //             var tr = body.append($('<tr>'));    
        //             tr.append($('<td>').text(key));
        //             tr.append($('<td>').text(value));
        //         }
        //     });
        //     // Add metadata, if there is any
        //     var $meta_elem = $('#kb-obj table.kb-metainfo');
        //     var body = $meta_elem.find('tbody')
        //     body.empty();
        //     console.debug("Metadata:", data.metadata);
        //     if (data.metadata !== undefined && Object.keys(data.metadata).length > 0) {
        //         $.each(data.metadata, function(key, value) {
        //             console.debug("MD key=" + key + ", value=",value);
        //             // expect keys with '_' to mark sub-sections
        //             if (key.substr(0,1) == '_') {
        //                 var pfx = key.substr(1, key.length);
        //                 console.debug("Prefix: " + pfx);
        //                 $.each(value, function(key2, value2) {
        //                     var tr = body.append($('<tr>'));    
        //                     // key
        //                     var td = $('<td>');
        //                     var $prefix = $('<span>').addClass("text-muted").text(pfx + " ");
        //                     td.append($prefix);
        //                     td.append($('<span>').text(key2));
        //                     tr.append(td);
        //                     // value
        //                     tr.append($('<td>').text(value2));
        //                 });
        //             }
        //             else {
        //                 var tr = body.append($('<tr>'));    
        //                 tr.append($('<td>').text(key));
        //                 tr.append($('<td>').text(value));                        
        //             }
        //         });
        //     }
        //     else {
        //         body.append($('<tr>')).append($('<td>').text("No metadata"));
        //     }
        //     // XXX: hack! add button for viz if network
        //     if (data.type == 'Networks') {
        //         this.addNetworkVisualization(data);
        //     }
        //     else {
        //         body.append($('<tr>')).append($('<td>').text("No metadata"));
        //     }
        //     // XXX: hack! add button for viz if network
        //     // (slightly less of a hack now? --Bill)
        //     this.addVisualizationButton(data);
        // },

        // _uuidgen: function() {
        //     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        //         var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        //         return v.toString(16);});
        //  },

        // /**
        //  * Render the widget.
        //  * This fetches the list of data sets for the workspace.
        //  *
        //  * @returns this
        //  */
        // render: function() {
            
        //     return this;
        // },

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
            this.$errorPanel = this.buildWorkspaceErrorPanel("Sorry, an error occurred while loading data.", error);


            this.$dataPanel.hide();
            this.$loadingPanel.hide();
            this.$errorPanel.show();
        },
    });

})( jQuery );
