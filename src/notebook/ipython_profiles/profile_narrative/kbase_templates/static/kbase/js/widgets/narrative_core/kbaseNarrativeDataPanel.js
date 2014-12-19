/**
 * Widget to display a table of data objects from a kbase workspace.
 *
 * TODO: Re-enable "readonly" mode by following instructions in isReadonlyWorkspace()
 *       (dan g. 10/30/2014)
 *
 * Options:
 *    wsId - the name of the workspace to show in this widget
 *    loadingImage - an image to show in the middle of the widget while loading data
 *    notLoggedInMsg - a string to put in the middle of the widget when not logged in.
 *
 * Triggers events:
 * dataUpdated.Narrative - when the loaded data table gets updated.
 * workspaceUpdated.Narrative - when the current workspace ID gets updated
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @author Dan Gunter <dkgunter@lbl.gov>
 * @public
 */
(function( $, undefined ) {

    $.KBWidget({
        name: "kbaseNarrativeDataPanel", 
        parent: "kbaseNarrativeControlPanel",
        version: "1.0.0",
        wsClient: null,
        table: null,
        tableData: [],
        $loginMessage: null,
        $errorMessage: null,
        $loading: null,
        isLoggedIn: false,
        narrWs: null, /* see setNarrWS */
        // The set of all data currently loaded into the widget
        loadedData: {},
        options: {
            title: 'Data',
            loadingImage: "static/kbase/images/ajax-loader.gif",
            notLoggedInMsg: "Please log in to view a workspace.",
            workspaceURL: "https://kbase.us/services/ws",
            wsBrowserURL: "/functional-site/#/ws/",
            landingPageURL: "/functional-site/#/",
            uploaderURL: "//kbase.us/services/docs/uploader/uploader.html",
            defaultLandingPage: "/functional-site/#/ws/json/", // ws_name/obj_name
            container: null,
            ws_name: null,
        },
        ws_name: null,
        // Constants
        WS_NAME_KEY: 'ws_name', // workspace name, in notebook metadata
        WS_META_KEY: 'ws_meta', // workspace meta (dict), in notebook metadata

        
        dataListWidget: null,
        
        init: function(options) {
            this._super(options);

            if (this.options.wsId) {
                this.ws_name = options.wsId;
                this.options.ws_name = options.wsId;
            }
            if (this.options.ws_name) {
                this.ws_name = options.ws_name;
            }

            if (window.kbconfig && window.kbconfig.urls) {
                this.options.uploaderURL = window.kbconfig.urls.uploader;
                this.options.workspaceURL = window.kbconfig.urls.workspace;
                this.options.wsBrowserURL = window.kbconfig.urls.ws_browser;
                this.options.landingPageURL = window.kbconfig.urls.landing_pages;
            }
            
            var $dataList = $('<div>');
            this.body().append($dataList);
            this.dataListWidget = $dataList["kbaseNarrativeDataList"](
                                    {
                                        ws_name: this.ws_name,
                                        ws_url: this.options.workspaceURL,
                                        loadingImage: this.options.loadingImage
                                    });
            
            $(document).on(
                'setWorkspaceName.Narrative', $.proxy(function(e, info) {
                    console.log('data panel -- setting ws to ' + info.wsId);
                    this.ws_name = info.wsId;
                    this.narrWs = info.narrController;
                    this.dataListWidget.setWorkspace(this.ws_name);
                }, this)
            );
            
            /**
             * This should be triggered if something wants to know what data is loaded from the current workspace
             */
            $(document).on(
                'dataLoadedQuery.Narrative', $.proxy(function(e, params, ignoreVersion, callback) {
                    var obj_data = this.dataListWidget.getObjData(params,ignoreVersion);
                    if (callback) {
                        callback(obj_data);
                    }
                },
                this)
            );
            
            
            /**
             * This should be triggered when something updates the available data in either the narrative or
             * in the workspace.
             */
            $(document).on(
                'updateData.Narrative', $.proxy(function(e) {
                    //this.refresh();
                    this.dataListWidget.refresh();
                },
                this )
            );
            
            /**
             * This should be triggered when something wants to know what workspace this widget is currently linked to.
             */
            $(document).on(
                'workspaceQuery.Narrative', $.proxy(function(e, callback) {
                    if (callback) {
                        callback(this.ws_name);
                    }
                }, 
                this)
            );
            
            this.landingPageMap = window.kbconfig.landing_page_map;
            /**
             * Get the landing page map.
             * First, try getting it from /functional-site/landing_page_map.json.
             * If that fails, try /static/kbase/js/widgets/landing_page_map.json.
             
            $.ajax({
                url: '/functional-site/landing_page_map.json',
                async: true,
                dataType: 'json',
                success: $.proxy(function(response) {
                    this.landingPageMap = response;
                }, this),
                error: $.proxy(function(error) {
                    this.dbg("Unable to get standard landing page map, looking for backup...");
                    $.ajax({
                        url: '/static/kbase/js/widgets/landing_page_map.json',
                        async: true,
                        dataType: 'json',
                        success: $.proxy(function(response) {
                            this.landingPageMap = response;
                        }, this),
                        error: $.proxy(function(error) {
                            this.dbg("Unable to get any landing page map! Landing pages mapping unavailable...");
                            this.landingPageMap = null;
                        }, this)
                    })
                }, this)
            });*/
            
            if (this.ws_name)
                this.trigger('workspaceUpdated.Narrative', this.ws_name);

            this.addButton($('<button>')
                           .addClass('btn btn-xs btn-default')
                           .append('<span class="glyphicon glyphicon-play"></span>')
                           .click($.proxy(function(event) {
                               this.trigger('hideGalleryPanelOverlay.Narrative');
                               this.trigger('toggleSidePanelOverlay.Narrative');
                           }, this)));
            
            return this;
            
            
            
            /**
             * This should be triggered whenever something clicks on a data info button (or just
             * wants the info modal to appear).
             */
            $(document).on(
                'dataInfoClicked.Narrative', $.proxy(function(e, workspace, id) {
                    this.showInfoModal(workspace, id);
                }, 
                this)
            );

            $(document).on(
                'updateNarrativeDataTab.Narrative', $.proxy(function(e) {
                    this.refreshNarrativeTab();
                },
                this)
            );


            this.createStructure()
                .createMessages();


            return this;
        },

        /**
         * @method loggedInCallback
         * This is associated with the login widget (through the kbaseAuthenticatedWidget parent) and
         * is triggered when a login event occurs.
         * It associates the new auth token with this widget and refreshes the data panel.
         * @private
         */
        loggedInCallback: function(event, auth) {
            this.wsClient = new Workspace(this.options.workspaceURL, auth);
            this.isLoggedIn = true;
            this.refresh();
            return this;
        },

        /**
         * @method loggedOutCallback
         * Like the loggedInCallback, this is triggered during a logout event (through the login widget).
         * It throws away the auth token and workspace client, and refreshes the widget
         * @private
         */
        loggedOutCallback: function(event, auth) {
            this.wsClient = null;
            this.isLoggedIn = false;
            this.refresh();
            return this;
        },

        setWorkspace: function(ws_name) {
            this.ws_name = ws_name;
            this.refresh();
        },

        /**
         * Set the narrative workspace (parent) into the data widget
         * so it can call back to it about information discovered
         * from the workspace, e.g. permissions to objects in the
         * narrative for read-only mode.
         *
         * @param obj kbaseNarrativeWorkspace instance
         */
        setNarrWs: function(obj) {
            this.narrWs = obj;
        },

        /**
         * Test if this narrative is in a workspace that this user is not
         * able to modify.
         *
         * XXX: 
         * XXX: DISABLED! To re-enable see TODO: comment below
         * XXX:
         */
        isReadonlyWorkspace: function (ws_client, ws_name, callback) {
            var workspace_id = {workspace: ws_name};
            ws_client.get_workspace_info(workspace_id,
                // success callback
                $.proxy(function(info) {
                    var ro = false;
                    // TODO: re-enable by uncommenting the next 3 lines
                    // var perms = info[5];
                    // console.debug("workspace perms = ",perms);
                    // ro = (perms != 'a' && perms != 'w');
                    console.info("WS(" + ws_name + ") read-only: " + ro);
                    callback(ro);
                }, this),
                // error callback
                $.proxy(function(obj) {
                    console.debug("isReadonlyWorkspace: error!", obj);
                    callback(false);
                }, this)
            );
        },

        /**
         * @method createStructure
         * Create the overall apparatus for the widget.
         * Makes the header, table, etc. DOM elements.
         * @returns this
         * @private
         */
        createStructure: function() {
            /*********** OUTER STRUCTURE ***********/

            /**
             * The outer structure is now a Bootstrap Panel.
             * So it's got a panel-heading (just the blue Data part and refresh button)
             * a panel-body - everything else
             * - no footer
             */

            // header bar.
            // var $headerDiv = $('<div>')
            //                   .append('Data')
            //                   .append($('<button>')
            //                           .addClass('btn btn-xs btn-default kb-ws-refresh-btn')
            //                           .css({'margin-top': '-4px',
            //                                 'margin-right': '4px'})
            //                           .click($.proxy(function(event) { this.refresh(); }, this))
            //                           .append($('<span>')
            //                                   .addClass('glyphicon glyphicon-refresh')));

            var $refreshBtn = $('<button>')
                              .addClass('btn btn-xs btn-default')
                              .click($.proxy(function(event) { this.refresh(); }, this))
                              .append($('<span>')
                                      .addClass('glyphicon glyphicon-refresh'));

            // encapsulating data panel - all the data-related stuff goes in here.
            // this way, it can all be hidden easily.
            this.$dataPanel = $('<div id="data-tabs">');

            // a loading panel that just has a spinning gif sitting in the middle.
            this.$loadingPanel = $('<div>')
                                 .addClass('kb-data-loading')
                                 .append('<img src="' + this.options.loadingImage + '">')
                                 .append($('<div>')
                                         .attr('id', 'message'))
                                 .hide();

            // Something similar for the info modal
            this.$infoModalLoadingPanel = $('<div>')
                                 .addClass('kb-data-loading')
                                 .append('<img src="' + this.options.loadingImage + '">')
                                 .hide();

            // this just sits outside and gets crammed into the info modal if necessary.
            this.$infoModalError = $('<div>').hide();

            // The error panel should overlap everything.
            this.$errorPanel = $('<div>')
                               .addClass('kb-error')
                               .hide();

            this.addButton($refreshBtn);

            this.body().append($('<div>')
                               .addClass('kb-narr-panel-body')
                               .append(this.$dataPanel)
                               .append(this.$loadingPanel)
                               .append(this.$errorPanel));

            // this.$elem.append($('<div>')
            //                   .addClass('panel panel-primary kb-data-main-panel')
            //                   .append($('<div>')
            //                           .addClass('panel-heading')
            //                           .append($('<div>')
            //                                   .addClass('panel-title')
            //                                   .css({'text-align': 'center'})
            //                                   .append($headerDiv)))
            //                   .append($('<div>')
            //                           .addClass('panel-body kb-narr-panel-body')
            //                           .append(this.$dataPanel)
            //                           .append(this.$loadingPanel)
            //                           .append(this.$errorPanel)));
            


            /*********** MAIN DATA TABLES ***********/
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
                            tab: 'My Workspace Data',
//                            tab : 'My Workspace Data&nbsp;&nbsp;&nbsp;<span data-toggle="tooltip" class="glyphicon glyphicon-new-window ws-link"></span>',       //name of the tab
                            content : this.$myDataDiv,       //jquery object to stuff into the content
                            active: true
                        },
                        {
                            tab : 'Narrative',
                            content : this.$narrativeDiv,
                        },
                    ],
                }
            );

            //add the click event to open the workspace from the workspace link in the
            //'My Workspace Data' tab
            $that = this;
            this.$dataPanel.find("#data-tabs .ws-link").bind('click',
                function (e) {
                    var url = $that.options.wsBrowserURL + "/objtable/" + $that.wsId;
                    window.open(url,'_blank');
                }   
            );

            //add the tooltip to the workspace list
            this.$dataPanel.find("#data-tabs .ws-link").tooltip({
                title: "Open this workspace in a new window.",
                placement: "bottom"
            });

            this.$dataPanel.find('a').on('click', 
                $.proxy(function() {
                    setTimeout($.proxy(function() {
                        this.$myDataDiv.kbaseNarrativeDataTable('poke');
                        this.$narrativeDiv.kbaseNarrativeDataTable('poke');
                    }, this), 0);
                }, this)
            );
            this.$myDataDiv.kbaseNarrativeDataTable({ noDataText: 'No data found! Click <a href="' + this.options.uploaderURL + '" target="_new">here</a> to upload.'});
            this.$narrativeDiv.kbaseNarrativeDataTable({ noDataText: 'No data used in this Narrative yet!'});




            /************ OBJECT DETAILS MODAL *************/
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
                                  .change($.proxy(function(event) {
                                      this.populateInfoModal(this.$versionSelect.find('option:selected').val()); 
                                  }, this));

            var $infoAccordion = $('<div>');

            // The footer should have 3 buttons - a link to the type spec, object landing page, and a close button.
            var $footerButtons = $('<div>')
                                 .append($('<button>')
                                         .attr({
                                             'type' : 'button',
                                             'class' : 'btn btn-default',
                                             'id' : 'obj-details-btn',
                                         })
                                         .append('View Landing Page'))
                                         .tooltip()
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

            // The overall info modal structure.
            // Thanks, Bootstrap!
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
                                                      .append(this.$infoModalError)
                                                      .append(this.$infoModalLoadingPanel)
                                                      .append(this.$infoModalPanel
                                                              .append($('<div>')
                                                                      .append($('<h3>')
                                                                              .append('Properties'))
                                                                      .append(this.$infoModalPropTable))
                                                              .append($infoAccordion)
                                                              .append($('<form class="form-inline">')
                                                                      .append('Version: ')
                                                                      .append(this.$versionSelect))))
                                              .append($('<div>')
                                                      .addClass('modal-footer')
                                                      .append($footerButtons))));

            // Add behaviors
            // XXX: Nothing here yet
            this.$infoAccordion.on('click', function() {
              console.debug("I pity the fool who clicks on infoModal!");
            });

            // Appending this to body since the left panels are now fixed.
            $('body').append(this.$infoModal);
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
         * @method createMessages
         * Create the message elements.
         * @returns this
         * @private
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
         * @method refresh
         * This reloads any data that this panel should display.
         * It uses the existing workspace client to fetch data from workspaces and populates the
         * panel. It then fetches anything that's a part of the narrative (using the Narrative's metadata)
         * and displays that.
         *
         * @public
         */
        refresh: function() {
            
            this.dataListWidget.refresh();
            
            return;
            console.debug("kbWS.refresh.start");
            if (this.wsClient && this.wsId) {
                console.debug("kbWS.refresh.test-for-readonly");
                this.isReadonlyWorkspace(this.wsClient, this.wsId, 
                    $.proxy(function(ro) {
                        if (ro) {
                            // hide in readonly mode
                            this.deactivateDataPanel();
                            // tell parent to hide as well
                            this.narrWs.activateReadonlyMode();
                        }
                        else {
                            this.narrWs.activateReadwriteMode();
                        }
                        $('#main-container').show();
                        // now show connections-- once it works!
                        // this.narrWs.show_connections();
                    }, this));
            }

            if (!this.wsClient) {
                this.showLoadingMessage("Unable to load workspace data!<br>No user credentials found!");
                console.debug("kbWS.refresh.end msg=no-client");
                return;
            }
            else if (!this.wsId) {
                console.debug("kbWS.refresh.end msg=no-wsId");
            }

            this.showLoadingMessage("Loading workspace data...");

            this.refreshWorkspaceTab();
            this.refreshNarrativeTab();
        },

        refreshWorkspaceTab: function() {
            // Fetch data from the current workspace.
            this.wsClient.list_objects({
                    workspaces : [this.wsId],
                },
                $.proxy(function(list) {
                    // first, go through the list and pull out Narrative objects.
                    // otherwise it's a little recursive. Including a Narrative within its narrative 
                    // would give me nightmares.

                    this.loadedData = {};
                    var renderedData = {};
                    for (var i=0; i<list.length; i++) {
                        var type = list[i][2];

                        if (type.indexOf('KBaseNarrative') == 0) {
                            list.splice(i, 1);
                            i--;
                        }
                        else {
                            // type = KBaseBlahblah.Blah-v#.#
                            var parsedType = /^(\S+)-/.exec(type);
                            // if it works, turn type into KBaseBlahblah.Blah w/o the version.
                            if (parsedType && parsedType[1])
                                type = parsedType[1];

                            if (!this.loadedData[type]) {
                                this.loadedData[type] = [];
                                renderedData[type] = [];
                            }
                            this.loadedData[type].push(list[i]);
                            renderedData[type].push([list[i][7], list[i][1], type]);
                        }
                    }

                    this.$myDataDiv.kbaseNarrativeDataTable('setData', renderedData);

                    this.trigger('dataUpdated.Narrative');
                    this.showDataPanel();
                    this.$myDataDiv.kbaseNarrativeDataTable('poke');
                    this.$narrativeDiv.kbaseNarrativeDataTable('poke');

                }, this), 
                $.proxy(function(error) {
                    this.showError(error);
                }, this)
            );
        },

        refreshNarrativeTab: function() {
            // Fetch dependent data from the narrative
            // The main Narrative javascript keeps the IPython.notebook.metadata.data_dependencies up to date.
            // So grab our list of deps from there!

            // XXX: Currently a mashup of old and new. Update to only the new later.
            if (IPython.notebook) {
                var narrData = IPython.notebook.metadata.data_dependencies;
                var dataList = {};
                var lookupList = [];

                if (narrData) {
                    // format things to be how we want them.
                    $.each(narrData, $.proxy(function(idx, val) {
                        val = val.split(/\s+/);
                        var type = val[0];

                        var ws = "";
                        var name = "";

                        if (val.length === 1) {
                            lookupList.push(val[0]);
                        }

                        else {
                            // if there's a forward slash, it'll be ws/name
                            if (val[1].indexOf('/') !== -1) {
                                var arr = val[1].split('/');
                                ws = arr[0];
                                name = arr[1];
                            }
                            else if (/ws\.(\d+)\.obj\.(\d+)/.exec(val[1])) {
                                var qualId = /ws\.(\d+)\.obj\.(\d+)/.exec(val[1]);
                                if (qualId.length === 3) {
                                    ws = qualId[1];
                                    name = qualId[2];
                                }
                            }
                            // otherwise-otherwise, it'll be just name, and we provide the workspace
                            else {
                                ws = this.wsId;
                                name = val[1];
                            }
                            if (!dataList[type])
                                dataList[type] = [];

                            // Workaround for dealing with the occasional blank name.
                            if (name) {
                                name = name.trim();
                                if (name.length > 0)
                                    dataList[type].push([ws, name, type]);
                            }
                        }
                    }, this));
                }

                // XXX: part of the hack above.
                // lookupList is a list of object refs to be fetched from the workspace.
                if (lookupList.length > 0) {
                    var idList = [];
                    // Make the ObjectIdentity list to pass to the workspace client
                    for (var i=0; i<lookupList.length; i++) {
                        idList.push({'ref': lookupList[i]});
                    }
                    // Fetch the info
                    this.wsClient.get_object_info(idList, 0, $.proxy(
                        function(objInfo) {
                            var dataList = {};
                            // Parse out the info we want to put in the data table.
                            for (var i=0; i<objInfo.length; i++) {
                                if (!dataList[objInfo[i][2]])
                                    dataList[objInfo[i][2]] = [];
                                dataList[objInfo[i][2]].push([objInfo[i][6], objInfo[i][1], objInfo[i][2]]);
                            }
                            // ...and put it there!
                            this.$narrativeDiv.kbaseNarrativeDataTable('setData', dataList);
                        }, this)
                    );
                }
                else {
                    this.$narrativeDiv.kbaseNarrativeDataTable('setData', dataList);
                }
            }
        },

        /**
         * @method showInfoModal
         * Populates and shows an informative modal window with metadata about the given object.
         * This has links out to the landing pages for that object, as well.
         * @param {String} workspace - the NAME (not id) of the workspace for the given object.
         * @param {String} id - the NAME (not numerical id... I know.) of the object to display.
         * @private
         */
        showInfoModal: function(workspace, id) {
            this.$infoModal.find('.modal-title').html(id);
            this.$infoModalPanel.hide();
            this.$infoModalError.hide();
            this.$infoModalLoadingPanel.show();
            this.$infoModal.modal();


            var obj = {};
            // if workspace is all numeric, assume its a workspace id, not a name.
            if (/^\d+$/.exec(workspace))
                obj['wsid'] = workspace;
            else
                obj['workspace'] = workspace;

            // same for the id
            if (/^\d+$/.exec(id))
                obj['objid'] = id;
            else
                obj['name'] = id;

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
                    this.$infoModal.find('.modal-footer .btn-default').show();
                }, this),

                $.proxy(function(error) {
                    this.$infoModalError.empty().append(this.buildWorkspaceErrorPanel("Sorry, an error occurred while loading object data", error));
                    this.$infoModalLoadingPanel.hide();
                    this.$infoModalPanel.hide();
                    this.$infoModal.find('.modal-footer .btn-default').hide();
                    this.$infoModalError.show();
                }, this)
            );
        },

        /**
         * @method populateInfoModal
         * Populates the info modal with currently loaded metadata from the given version index.
         * This assumes this.objInfoList has a metadata array at versionIndex.
         * It currently doesn't catch errors very well.
         * @param {Integer} versionIndex - the index of the metadata version to show.
         * @private
         */
        populateInfoModal: function(versionIndex) {
            if (!versionIndex || versionIndex < 0 || versionIndex >= this.objInfoList.length)
                versionIndex = 0;

            var info = this.objInfoList[versionIndex];

            // A simple table row builder for two elements. The first column is bold.
            var addRow = function(a, b) {
                return "<tr><td><b>" + a + "</b></td><td>" + b + "</td></tr>";
            };

            /* Fill in the property table */
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

            // Set up the typespec page.
            var specPage = this.options.landingPageURL + 'spec/type/' + dataType;
            this.$infoModal.find('.modal-footer > div > button#obj-type-btn').off('click').click(function(event) { window.open(specPage); });

            // Figure out the landingPageType. e.g. KBaseGenomes.Genome-1.0 should go to /genomes/
            var landingPageType = null;
            if (this.landingPageMap !== null) {
                var parsedType = /^(\S+)\.(\S+)-/.exec(dataType);
                if (parsedType) {
                    // module = idx 1, type = idx 2
                    if (this.landingPageMap[parsedType[1]] && this.landingPageMap[parsedType[1]][parsedType[2]]) {
                        landingPageType = this.landingPageMap[parsedType[1]][parsedType[2]];
                    }
                }
            }

            var detailsBtn = this.$infoModal.find('.modal-footer > div > button#obj-details-btn');
            detailsBtn.off('click');
            // If we don't havea a landingPageType (it's still null), then we don't have a landing page for that
            // object. Remove the clicky function and add a tooltip.
            var landingPage = this.options.defaultLandingPage + workspace + '/' + id;
            if (landingPageType) {
                landingPage = this.options.landingPageURL + landingPageType + '/' + encodeURIComponent(workspace) + '/' + encodeURIComponent(id);
            }
            detailsBtn.click(function(event) { window.open(landingPage); });
            detailsBtn.html("View Landing Page");
            // else {
            //     detailsBtn.html("Landing Page Unavailable");
            // }

        },

        /**
         * Returns a jQuery div object containing information about the given error that's been passed from the workspace.
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

                var $tracebackPanel = $('<div>');
                var tracebackAccordion = [{'title' : 'Details', 'body' : $tracebackDiv}];

                $errorPanel.append($details);
            }

            return $errorPanel;
        },

        /**
         * Returns the set of currently loaded data objects from the workspace.
         * These are returned as described below.
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
        getLoadedData: function(type, ignoreVersion) {
            if (this.dataListWidget) {
                return this.dataListWidget.getObjData(params,ignoreVersion);
            } else {
                return {};
            }
            
        },

        /**
         * Shows the loading panel and hides all others
         * @private
         */
        showLoadingMessage: function(message) {
            this.$loadingPanel.find('#message').empty();
            if (message)
                this.$loadingPanel.find('#message').html(message);
            this.$dataPanel.hide();
            this.$errorPanel.hide();
            this.$loadingPanel.show();
        },

        /**
         * Shows the full-size data panel and hides all others.
         * @private
         */
        showDataPanel: function() {
            this.$loadingPanel.hide();
            this.$errorPanel.hide();
            this.$dataPanel.show();
        },

        /**
         * Shows data panel, but does not allow clicks on it.
         *
         * @param error
         */
        deactivateDataPanel: function() {
            this.$loadingPanel.find('#message').empty();
            this.$loadingPanel.hide();
            this.$errorPanel.hide();
            //this.$dataPanel.find('a').off();
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

        /**
         * @method prettyJson
         * Prettifies a JSON string or object into a nicely formatted, colorized block.
         * @param {String|Object} s - either a JSON string or a Javascript object
         * @return {String} a prettified JSON string with some nice HTML color tags.
         * @private
         */
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

        /**
         * Formats a given timestamp to look pretty.
         * Takes any timestamp that the Javascript Date object can handle, and 
         * returns it formatted as: MM/DD/YYYY, HH:MM:SS (in 24-hour time)
         * @param {String} timestamp - the timestamp string
         * @returns a formatted timestamp
         * @private
         */
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
