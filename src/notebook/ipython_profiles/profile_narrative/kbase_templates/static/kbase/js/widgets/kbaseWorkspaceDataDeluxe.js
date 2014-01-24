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

            this.$infoModalLoadingPanel = $('<div>')
                                 .addClass('kb-data-loading')
                                 .append('<img src="' + this.options.loadingImage + '">')
                                 .hide();

            // The error panel should overlap everything.
            this.$errorPanel = $('<div>')
                               .addClass('kb-error')
                               .hide();
            this.$elem.append(this.$errorPanel);

            // Contains all of a user's data
            // XXX: Initially just data from the current workspace.
            this.$myDataDiv = $('<div id="my-data">');

            // Contains all data in the current narrative.
            this.$narrativeDiv = $('<div id="narrative-data">');

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
            this.$narrativeDiv.kbaseNarrativeDataTable();

            // separate so it can be hidden
            this.$infoModalPanel = $('<div>');

            // the properties table
            this.$infoModalPropTable = $('<table>')
                                       .addClass('table table-bordered table-striped');
            // the metadata div
            this.$metadataDiv = $('<pre>');

            // the version selector
            this.$versionSelect = $('<select>')
                                  .addClass('form-control')
                                  .css({'max-width' : '80%'})
                                  .change($.proxy(function(event) {
                                      this.populateInfoModal(this.$versionSelect.find('option:selected').val()); 
                                  }, this));

            var $infoAccordion = $('<div>');

            var $footerButtons = $('<div>')
                                 .append($('<button>')
                                         .attr({
                                             'type' : 'button',
                                             'class' : 'btn btn-default',
                                             'id' : 'obj-details-btn'
                                         })
                                         .append('Object Details'))
                                 .append($('<button>')
                                         .attr({
                                             'type' : 'button',
                                             'class' : 'btn btn-default',
                                             'id' : 'obj-type-btn',
                                         })
                                         .append('Object Type Details'))
                                 .append($('<button>')
                                         .attr({
                                             'type' : 'button',
                                             'class' : 'btn btn-primary',
                                             'data-dismiss' : 'modal'
                                         })
                                         .append('Close'));

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
                                                      .addClass('modal-body')
                                                      .append(this.$infoModalLoadingPanel)
                                                      .append(this.$infoModalPanel
                                                              .append($('<div>')
                                                                      .append($('<h3>')
                                                                              .append('Properties'))
                                                                      .append(this.$infoModalPropTable))
                                                              .append($infoAccordion)
                                                              .append($('<div>')
                                                                      .append('Version: ')
                                                                      .append(this.$versionSelect))))
                                              .append($('<div>')
                                                      .addClass('modal-footer')
                                                      .append($footerButtons))));

            this.$elem.append(this.$infoModal);
            $infoAccordion.kbaseAccordion(
                {
                    elements:
                    [
                        { 'title' : 'Metadata', 'body' : $('<div>').append(this.$metadataDiv) }
                    ]
                }
            );

            return this;

        },

        /**
         * Create the message element.
         * @returns this
         */
        createMessages: function() {
            this.$loginMessage = $('<span>')
                .text(this.options.notLoggedInMsg);
            this.$loadingMessage = $('<div>')
                                   .css({'text-align': 'center'})
                                   .append($('<img>')
                                           .attr('src', this.options.loadingImage));
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
            this.$infoModalPanel.hide();
            this.$infoModalLoadingPanel.show();
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
            var obj = {
                'workspace' : workspace,
                'name' : id, 
            };

            // Fetch the workspace object.
            this.wsClient.get_object_history(obj, 
                $.proxy(function(infoList) {
                    infoList.sort(function(a, b) { return b[4]-a[4]; });
                    this.objInfoList = infoList;

                    this.$versionSelect.empty();
                    for (var i=0; i<this.objInfoList.length; i++) {
                        var verStr = this.objInfoList[i][4] + ' - ' + this.prettyTimestamp(this.objInfoList[i][3]);
                        if (i === 0)
                            verStr += ' (most recent)';
                        this.$versionSelect.append($('<option>')
                                                   .attr('value', i)
                                                   .append(verStr));
                    }

                    this.populateInfoModal(i);

                    this.$infoModalLoadingPanel.hide();
                    this.$infoModalPanel.show();
                }, this),

                $.proxy(function(error) {
                    var $errorPanel = this.buildWorkspaceErrorPanel("Sorry, an error occurred while loading object data", error);
                    this.$infoModal.find('.modal-body').empty().append($errorPanel);
                }, this)
            );
        },

        populateInfoModal: function(versionIndex) {
            if (!versionIndex || versionIndex < 0 || versionIndex >= this.objInfoList.length)
                versionIndex = 0;

            var info = this.objInfoList[versionIndex];

            var addRow = function(a, b) {
                return "<tr><td><b>" + a + "</b></td><td>" + b + "</td></tr>";
            };


            this.$infoModalPropTable.empty()
                                    .append(addRow('ID', info[0]))
                                    .append(addRow('Name', info[1]))
                                    .append(addRow('Type', info[2]))
                                    .append(addRow('Save Date', this.prettyTimestamp(info[3])))
                                    .append(addRow('Version', info[4]))
                                    .append(addRow('Saved By', info[5]))
                                    .append(addRow('Workspace ID', info[6]))
                                    .append(addRow('Workspace Name', info[7]))
                                    .append(addRow('Checksum', info[8]))
                                    .append(addRow('Size (B)', info[9]));

            // Parse the user metadata field.
            var metadataJson = this.prettyJson(info[10]);
            if (metadataJson === "{}")
                metadataJson = "No metadata found for this object.";
            this.$metadataDiv.empty().append(metadataJson);

            var dataType = info[2];
            var workspace = info[7];
            var id = info[1];
            var landingPage = this.options.landingPageURL + dataType + '/' + workspace + '/' + id;
            var specPage = this.options.landingPageURL + 'spec/type/' + dataType;

            this.$infoModal.find('.modal-footer > div > button#obj-type-btn').off('click').click(function(event) { window.open(specPage); });
            this.$infoModal.find('.modal-footer > div > button#obj-details-btn').off('click').click(function(event) { window.open(landingPage); });


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

        prettyJson: function(s) {
            if (typeof s != 'string') {
                s = JSON.stringify(s, undefined, 2);
            }
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
            return s;
        },

        prettyTimestamp: function(timestamp) {
            var format = function(x) {
                if (x < 10)
                    x = '0' + x;
                return x;
            };

            var d = new Date(timestamp);
            var hours = format(d.getHours());

            var minutes = format(d.getMinutes());
            var seconds = format(d.getSeconds());
            var month = d.getMonth()+1;
            var day = format(d.getDate());
            var year = d.getFullYear();

            return month + "/" + day + "/" + year + ", " + hours + ":" + minutes + ":" + seconds;
        },



    });

})( jQuery );
