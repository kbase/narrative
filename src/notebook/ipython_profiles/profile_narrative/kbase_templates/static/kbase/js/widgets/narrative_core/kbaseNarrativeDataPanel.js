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
                                        loadingImage: this.options.loadingImage,
                                        parentControlPanel: this
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

            // initialize the importer
            this.dataImporter();
            
            if (this.ws_name)
                this.trigger('workspaceUpdated.Narrative', this.ws_name);

            this.dataImporter();

            this.addButton($('<button>')
                           .addClass('btn btn-xs btn-default')
                           .append('<span class="fa fa-arrow-right"></span>')
                           .click($.proxy(function(event) {
                               this.trigger('hideGalleryPanelOverlay.Narrative');
                               this.trigger('toggleSidePanelOverlay.Narrative', this.$overlayPanel);
                           }, this)));
            
            return this;
        },
        
        addButtonToControlPanel: function($btn) {
            this.addButton($btn);
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


        

        buildTabs: function(tabs, isOuter) {
            var $header = $('<div>');
            var $body = $('<div>');

            for (var i=0; i<tabs.length; i++) {
                var tab = tabs[i];
                $header.append($('<div>')
                               .addClass('kb-side-header')
                               .css('width', (100/tabs.length)+'%')
                               .append(tab.tabName));
                $body.append($('<div>')
                             .addClass('kb-side-tab')
                             .append(tab.content));
            }

            $header.find('div').click($.proxy(function(event) {
                event.preventDefault();
                event.stopPropagation();
                var $headerDiv = $(event.currentTarget);

                if (!$headerDiv.hasClass('active')) {
                    var idx = $headerDiv.index();
                    $header.find('div').removeClass('active');
                    $headerDiv.addClass('active');
                    $body.find('div.kb-side-tab').removeClass('active');
                    $body.find('div:nth-child(' + (idx+1) + ').kb-side-tab').addClass('active');
                    if (isOuter)
                        this.hideOverlay();
                }
            }, this));

            $header.find('div:first-child').addClass('active');
            $body.find('div:first-child.kb-side-tab').addClass('active');

            return {
                header: $header,
                body: $body
            };
        },

        /**
         * Renders the data importer panel
         * I'm throwing this here because I have no idea how to
         * bind a sidepanel to a specific widget, since all the other panels "inherit" these widgets.
         */
        dataImporter: function() {
            var maxObjFetch = 300000;

            var narWSName;
            $(document).on('setWorkspaceName.Narrative', function(e, info){
                narWSName = info.wsId;
            })

            var self = this;
            var user = $("#signin-button").kbaseLogin('session', 'user_id');  // TODO: use 
            
            // models
            var myData = [], sharedData = [];

            var myWorkspaces = [], sharedWorkspaces = [];

            // model for selected objects to import
            var mineSelected = [], sharedSelected = [];

            var types = ["KBaseGenomes.Genome",
                         "KBaseSearch.GenomeSet",
                         "KBaseGenomes.Pangenome",
                         "KBaseGenomes.GenomeComparison",
                         "KBaseGenomes.GenomeDomainData",
                         "GenomeComparison.ProteomeComparison",
                         "KBaseGenomes.ContigSet",
                         "KBaseAssembly.AssemblyInput",
                         "KBaseRegulation.Regulome",
                         "KBaseTrees.MSA",
                         "KBaseTrees.Tree",
                         "KBaseFBA.FBAModel",
                         "KBaseFBA.ModelTemplate",
                         "KBaseFBA.PromConstraint",
                         "KBaseBiochem.Media",
                         "KBaseFBA.FBA",
                         "KBasePhenotypes.PhenotypeSet",
                         "KBasePhenotypes.PhenotypeSimulationSet",
                         "KBaseFBA.ReactionSensitivityAnalysis",
                         "KBaseGenomes.MetagenomeAnnotation",
                         "Communities.SequenceFile",
                         "KBaseExpression.ExpressionSeries",
                         "KBaseExpression.ExpressionSample"
                         ];

            // tab panels
            var minePanel = $('<div class="kb-import-content kb-import-mine">'),
                sharedPanel = $('<div class="kb-import-content kb-import-shared">'),
                publicPanel = $('<div class="kb-import-content kb-import-public">'),
                importPanel = $('<div class="kb-import-content kb-import-import">'),
                examplePanel = $('<div class="kb-import-content">');
                
            // add tabs
            var $tabs = this.buildTabs([
                    {tabName: '<small>My Data</small>', content: minePanel},
                    {tabName: '<small>Shared With Me</small>', content: sharedPanel},
                    {tabName: '<small>Public</small>', content: publicPanel},
                    {tabName: '<small>Example</small>', content: examplePanel},
                    {tabName: '<small>Import</small>', content: importPanel},
                ]);
            
            
            // hack to keep search on top
            var $mineScrollPanel = $('<div>').css({'overflow-x':'hidden','overflow-y':'auto','height':'430px'});
            minePanel.append($mineScrollPanel);
            var $sharedScrollPanel = $('<div>').css({'overflow-x':'hidden','overflow-y':'auto','height':'430px'});
            sharedPanel.append($sharedScrollPanel);
            
            // Setup the panels that are defined by widgets
            publicPanel.kbaseNarrativeSidePublicTab({});
            importPanel.kbaseNarrativeSideImportTab({});
            examplePanel.kbaseNarrativeExampleDataTab({});

            
            var body = $('<div>');
            var footer = $('<div>');
            body.addClass('kb-side-panel');
            body.append($tabs.header, $tabs.body);

            // It is silly to invoke a new object for each widget
            var auth = {token: $("#signin-button").kbaseLogin('session', 'token')}
            var ws = new Workspace(this.options.workspaceURL, auth);

            // add footer status container and buttons
            var importStatus = $('<div class="pull-left kb-import-status">');
            footer.append(importStatus)
            var btn = $('<button class="btn btn-primary pull-right" disabled>Add to Narrative</button>');
            var closeBtn = $('<button class="btn btn-default pull-right">Close</button>');

            closeBtn.click(function() {
                self.trigger('hideSidePanelOverlay.Narrative');
            })
            footer.append(btn, closeBtn);

            // start with my data, then fetch other data
            // this is because data sets can be large and
            // makes things more fluid
            minePanel.loading();
            sharedPanel.loading();
            updateView('mine').done(function() {
                updateView('shared')
            });

            // events for changing tabs
            $($tabs.header.find('.kb-side-header')).click(function() {
                // reset selected models when changing tabs, if that's what is wanted
                if ($(this).index() == 0)
                    mineSelected = [], btn.show();
                else if ($(this).index() == 1)
                    sharedSelected = [], btn.show();
                else
                    btn.hide();

                // reset checkboxs... for any tabs.
                var checkboxes = body.find('.kb-import-checkbox');
                checkboxes.removeClass('fa-check-square-o')
                          .addClass('fa-square-o');
                btn.prop('disabled', true);
            })

            var narrativeNameLookup={};

            this.$overlayPanel = $('<div>').append(body).append(footer);

            function updateView(view) {
                var p;
                if (view == 'mine') p = getMyWS();
                else if (view == 'shared') p = getSharedWS();

                return $.when(p).done(function(workspaces) {
                    if (view == 'mine') prom = getMyData(workspaces);
                    else if (view == 'shared') prom = getSharedData(workspaces);
                    $.when(prom).done(function() {
                        if (view == 'mine') {
                            minePanel.rmLoading();
                            addMyFilters();
                        } else if(view == 'shared') {
                            sharedPanel.rmLoading();
                            addSharedFilters();
                        }
                    });
                });
            }

            // function used to update my data list
            function getMyData(workspaces, type, ws_name) {
                var params = {};
                if (!ws_name) {
                    var ws_ids = [], obj_count = 0;
                    for (var i in workspaces) {
                        ws_ids.push(workspaces[i].id);
                        obj_count = workspaces[i].count + obj_count;
                    }

                    params.ids = ws_ids;
                } else
                    params.workspaces = [ws_name];

                if (type) params.type = type;

                if (obj_count > maxObjFetch)
                    console.error("user's object count for owned workspaces was", obj_count);

                //console.log('total owned data is', obj_count)

                var req_count = Math.ceil(obj_count/10000);

                var proms = [];
                proms.push( ws.list_objects(params) );
                for (var i=1; i < req_count; i++) {
                    params.skip = 10000 * i;
                    proms.push( ws.list_objects(params) );
                }

                var p = ws.list_objects(params);
                return $.when(p).then(function(d) {
                    // update model
                    myData = [].concat.apply([], arguments);
                    render(myData, $mineScrollPanel, mineSelected);
                });
            }


            // function used to update shared with me data list
            function getSharedData(workspaces, type, ws_name) {
                var params = {};
                if (!ws_name) {
                    var ws_ids = [], obj_count = 0;
                    for (var i in workspaces) {
                        ws_ids.push(workspaces[i].id);
                        obj_count = workspaces[i].count + obj_count;
                    }

                    params.ids = ws_ids;
                } else
                    params.workspaces = [ws_name];

                if (type) params.type = type;

                if (obj_count > maxObjFetch)
                    console.error("user's object count for shared workspaces was", obj_count);

                //console.log('total shared data', obj_count);

                var req_count = Math.ceil(obj_count/10000);

                var proms = [];
                proms.push( ws.list_objects(params) );
                for (var i=1; i < req_count; i++) {
                    params.skip = 10000 * i;
                    proms.push( ws.list_objects(params) );
                }

                return $.when.apply($, proms).then(function() {
                    // update model
                    sharedData = [].concat.apply([], arguments);
                    render(sharedData, $sharedScrollPanel, sharedSelected);
                })
            }

            // This function takes data to render and
            // a container to put data in.
            // It produces a scrollable dataset
            function render(data, container, selected, template) {
                var start = 0, end = 9;

                // remove items from only current container being rendered
                container.find('.kb-import-items').remove();

                if (data.length == 0){
                    container.append('<div class="kb-import-items text-muted">No data found</div>');
                    return
                } else if (data.length-1 < end)
                    end = data.length;

                var rows = buildMyRows(data, start, end, template);
                container.append(rows);
                events(container, selected);

                // infinite scroll
                var currentPos = end;
                container.unbind('scroll');
                container.on('scroll', function() {
                    if($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) {
                        currentPos = currentPos+end;
                        var rows = buildMyRows(data, currentPos, end, template);
                        container.append(rows);
                    }
                    events(container, selected);
                });
            }

            function getMyWS() {
                return ws.list_workspace_info({owners: [user]})
                        .then(function(d) {
                            var workspaces = [];
                            for (var i in d) {
                                 if (d[i][8].is_temporary) {
                                    if (d[i][8].is_temporary === 'true') { continue; }
                                }
                                var displayName = d[i][1];
                                if (d[i][8].narrative_nice_name) {
                                    displayName = d[i][8].narrative_nice_name;
                                } else {
                                    continue; // skip corrupted narratives
                                }
                                // todo: should skip temporary narratives
                                workspaces.push({id: d[i][0],
                                                 name: d[i][1],
                                                 displayName: displayName,
                                                 count: d[i][4]});
                                narrativeNameLookup[d[i][1]] = displayName;
                            }

                            // add to model for filter
                            myWorkspaces = workspaces;
                            return workspaces;
                        })
            }

            function getSharedWS() {
                return ws.list_workspace_info({excludeGlobal: 1})
                        .then(function(d) {
                            var workspaces = [];
                            for (var i in d) {
                                // skip owned workspaced
                                if (d[i][2] == user) {
                                    continue;
                                }
                                if (d[i][8].is_temporary) {
                                    if (d[i][8].is_temporary === 'true') { continue; }
                                }
                                var displayName = d[i][1];
                                if (d[i][8].narrative_nice_name) {
                                    displayName = d[i][8].narrative_nice_name;
                                } else {
                                    continue; // skip corrupted narratives
                                }
                                workspaces.push({id: d[i][0],
                                                 name: d[i][1],
                                                 displayName:displayName,
                                                 count: d[i][4]});
                                narrativeNameLookup[d[i][1]] = displayName;
                            }

                            // add to model for filter
                            sharedWorkspaces = workspaces;
                            return workspaces;
                        })
            }

            function typeList(data) {
                var types = [];

                for (var i in data) {
                    var mod_type = data[i][2].split('-')[0];
                    // update model for types dropdown
                    if (types.indexOf(mod_type) == -1) types.push(mod_type);
                }
                return types;
            }

            function copyObjects(objs, nar_ws_name) {
                importStatus.html('Adding <i>'+objs.length+'</i> objects to narrative...');

                var proms = [];
                for (var i in objs) {
                    var ref = objs[i].ref;
                    var name = objs[i].name;
                    console.log('copying ', ref, 'to', nar_ws_name);
                    proms.push( ws.copy_object({to: {workspace: nar_ws_name, name: name},
                                                from: {ref: ref} }) );
                }
                return proms;
            }


            function events(panel, selected) {
                panel.find('.kb-import-item').unbind('click');
                panel.find('.kb-import-item').click(function(){
                    var item = $(this);
                    var ref = item.data('ref').replace(/\./g, '/');
                    var name = item.data('obj-name');

                    var checkbox = $(this).find('.kb-import-checkbox');
                    checkbox.toggleClass('fa-check-square-o')
                            .toggleClass('fa-square-o');

                    // update model for selected items
                    if (checkbox.hasClass('fa-check-square-o') ) {
                        selected.push({ref: ref, name: name});
                    }
                    else {
                        for (var i=0; i<selected.length; i++) {
                            if (selected[i].ref == ref)
                                selected.splice(i, 1);
                        }
                    }

                    // disable/enable button
                    if (selected.length > 0) btn.prop('disabled', false);
                    else btn.prop('disabled', true);

                    // import items on button click
                    btn.unbind('click');
                    btn.click(function() {
                        if (selected.length == 0) return;

                        //uncheck all checkboxes, disable add button
                        $('.kb-import-checkbox').removeClass('fa-check-square-o', false);
                        $('.kb-import-checkbox').addClass('fa-square-o', false);
                        $(this).prop('disabled', true);

                        var proms = copyObjects(selected, narWSName);
                        $.when.apply($, proms).done(function(data) {
                            importStatus.html('');
                            var status = $('<span class="text-success">done.</span>');
                            importStatus.append(status);
                            status.delay(1000).fadeOut();

                            // update sidebar data list
                            self.trigger('updateDataList.Narrative');
                        });

                        selected = [];

                        // um... reset events until my rendering issues are solved
                        events(panel, selected)
                    });
                });

                panel.find('.kb-import-item').unbind('hover');
                panel.find('.kb-import-item').hover(function() {
                    $(this).find('hr').css('visibility', 'hidden');
                    $(this).prev('.kb-import-item').find('hr').css('visibility', 'hidden');
                    $(this).find('.kb-import-checkbox').css('opacity', '.8');
                }, function() {
                    $(this).find('hr').css('visibility', 'visible');
                    $(this).prev('.kb-import-item').find('hr').css('visibility', 'visible');
                    $(this).find('.kb-import-checkbox').css('opacity', '.4');
                })

                // prevent checking when clicking link
                panel.find('.kb-import-item a').unbind('click');
                panel.find('.kb-import-item a').click(function(e) {
                    e.stopPropagation();
                })

            }

            function filterData(data, f) {
                if (data.length == 0) return [];

                var filteredData = [];
                // add each item to view
                for (var i=0; i<data.length; i< i++) {
                    var obj = data[i];

                    var mod_type = obj[2].split('-')[0],
                        ws = obj[7],
                        name = obj[1];
                    var kind = mod_type.split('.')[1];

                    // filter conditions
                    if (f.query && name.toLowerCase().indexOf(f.query.toLowerCase()) == -1)
                        continue;
                    if (f.type && f.type.split('.')[1] != kind)
                        continue;
                    if (f.ws && f.ws != ws)
                        continue;


                    filteredData.push(obj);

                }
                return filteredData;
            }


            function buildMyRows(data, start, end, template) {

                // add each set of items to container to be added to DOM
                var rows = $('<div class="kb-import-items">');

                for (var i=start; i< (start+end); i++) {
                    var obj = data[i];

                    var mod_type = obj[2].split('-')[0];
                    var item = {id: obj[0],
                                name: obj[1],
                                mod_type: mod_type,
                                version: obj[4],
                                kind: mod_type.split('.')[1],
                                module: mod_type.split('.')[0],
                                wsID: obj[6],
                                ws: obj[7],
                                relativeTime: kb.ui.relativeTime( Date.parse(obj[3]) ) }

                    if (item.module=='KBaseNarrative') {
                        continue;
                    }
                    if (template)
                        var item = template(item);
                    else
                        var item = rowTemplate(item);

                    rows.append(item);
                }

                return rows;
            }


            function addMyFilters() {
                //var types = typeList(myData);
                var wsList = myWorkspaces;

                // possible filters via input
                var type, ws, query;

                // create workspace filter
                var wsInput = $('<select class="form-control kb-import-filter">');
                wsInput.append('<option>All narratives...</option>');
                for (var i=1; i < wsList.length-1; i++) {
                    wsInput.append('<option data-id="'+[i].id+'" data-name="'+wsList[i].name+'">'+
                                          wsList[i].displayName+
                                   '</option>');
                }
                var wsFilter = $('<div class="col-sm-4">').append(wsInput);

                // event for type dropdown
                wsInput.change(function() {
                    ws = $(this).children('option:selected').data('name');

                    // request again with filted type
                    minePanel.find('.kb-import-items').remove();
                    minePanel.loading();
                    getMyData(myWorkspaces, type, ws).done(function() {
                        minePanel.rmLoading();
                    })
                })

                // create type filter
                var typeInput = $('<select class="form-control kb-import-filter">');
                typeInput.append('<option>All types...</option>');
                for (var i=0; i < types.length; i++) {
                    typeInput.append('<option data-type="'+types[i]+'">'+
                                          types[i].split('.')[1]+
                                     '</option>');
                }
                var typeFilter = $('<div class="col-sm-3">').append(typeInput);

                // event for type dropdown
                typeInput.change(function() {
                    type = $(this).children('option:selected').data('type');

                    // request again with filted type
                    minePanel.find('.kb-import-items').remove();
                    minePanel.loading();
                    getMyData(myWorkspaces, type, ws).done(function() {
                        minePanel.rmLoading();
                    })
                })


                // create filter (search)
                var filterInput = $('<input type="text" class="form-control kb-import-search" placeholder="Filter data">');
                var searchFilter = $('<div class="col-sm-4">').append(filterInput);

                // event for filter (search)
                filterInput.keyup(function(e){
                    query = $(this).val();

                    var filtered = filterData(myData, {type: type, ws:ws, query:query})
                    render(filtered, $mineScrollPanel, mineSelected);
                });


                // add search, type, ws filter to dom
                var row = $('<div class="row">').append(searchFilter, typeFilter, wsFilter);
                minePanel.prepend(row);
            }

            function addSharedFilters() {
                //var types = typeList(sharedData);
                var wsList = sharedWorkspaces

                // possible filters via input
                var type, ws, query;

                // create workspace filter
                var wsInput = $('<select class="form-control kb-import-filter">');
                wsInput.append('<option>All narratives...</option>');
                for (var i=1; i < wsList.length-1; i++) {
                    wsInput.append('<option data-id="'+wsList[i].id+'" data-name="'+wsList[i].name+'">'+
                                          wsList[i].displayName+
                                    '</option>');
                }
                var wsFilter = $('<div class="col-sm-4">').append(wsInput);

                // event for type dropdown
                wsInput.change(function() {
                    ws = $(this).children('option:selected').data('name');

                    // request again with filted type
                    sharedPanel.find('.kb-import-items').remove();
                    sharedPanel.loading();
                    getSharedData(sharedWorkspaces, type, ws).done(function() {
                        sharedPanel.rmLoading();
                    })
                })


                // create type filter
                var typeInput = $('<select class="form-control kb-import-filter">');
                typeInput.append('<option>All types...</option>');
                for (var i=0; i < types.length; i++) {
                    typeInput.append('<option data-type="'+types[i]+'">'+
                                          types[i].split('.')[1]+
                                     '</option>');
                }
                var typeFilter = $('<div class="col-sm-3">').append(typeInput);

                // event for type dropdown
                typeInput.change(function() {
                    type = $(this).children('option:selected').data('type');

                    // request again with filted type
                    sharedPanel.find('.kb-import-items').remove();
                    sharedPanel.loading();
                    getSharedData(sharedWorkspaces, type, ws).done(function() {
                        sharedPanel.rmLoading();
                    })
                })


                // create filter (search)
                var filterInput = $('<input type="text" class="form-control kb-import-search" placeholder="Filter objects">');
                var searchFilter = $('<div class="col-sm-4">').append(filterInput);

                // event for filter (search)
                filterInput.keyup(function(e){
                    query = $(this).val();

                    var filtered = filterData(sharedData, {type: type, ws:ws, query:query})
                    render(filtered, $sharedScrollPanel, sharedSelected);
                });

                // add search, type, ws filter to dom
                var row = $('<div class="row">').append(searchFilter, typeFilter, wsFilter);
                sharedPanel.prepend(row);
            }



            function rowTemplate(obj) {
                var item = $('<div class="kb-import-item">')
                                .data('ref', obj.wsID+'.'+obj.id)
                                .data('obj-name', obj.name);
                item.append('<i class="fa fa-square-o pull-left kb-import-checkbox">');
                item.append('<a class="h4" href="'+
                                objURL(obj.module, obj.kind, obj.ws, obj.name)+
                                '" target="_blank">'+obj.name+'</a>'+
                            '<span class="kb-data-list-version">v'+obj.version+'</span>');

                item.append('<br>');

                item.append('<div class="kb-import-info">'+
                                '<span>TYPE</span><br>'+
                                '<b>'+obj.kind+'</b>'+
                            '</div>');
                var narName = obj.ws;
                if (narrativeNameLookup[obj.ws]) {
                    narName = narrativeNameLookup[obj.ws];
                }
                item.append('<div class="kb-import-info">'+
                                '<span>NARRATIVE</span><br>'+
                                '<b>'+narName+'<b>'+   //<a class="" href="'+wsURL(obj.ws)+'">'
                            '</div>');
                item.append('<div class="kb-import-info">'+
                                '<span>LAST MODIFIED</span><br>'+
                                '<b>'+obj.relativeTime+'</b>'+
                            '</div>');
                item.append('<br><hr>')

                return item;
            }

            function publicTemplate(obj) {
                var item = $('<div class="kb-import-item">')
                                .data('ref', obj.wsID+'.'+obj.id)
                                .data('obj-name', obj.name);
                item.append('<i class="fa fa-square-o pull-left kb-import-checkbox">');
                item.append('<a class="h4" href="'+
                                objURL(obj.module, obj.kind, obj.ws, obj.name)+
                                '" target="_blank">'+obj.name+'</a>'+
                            '<span class="kb-data-list-version">v'+obj.version+'</span>');

                item.append('<br>');

                item.append('<div class="kb-import-info">'+
                                '<span>TYPE</span><br>'+
                                '<b>'+obj.kind+'</b>'+
                            '</div>');
                var narName = obj.ws;
                if (narrativeNameLookup[obj.ws]) {
                    narName = narrativeNameLookup[obj.ws];
                }

                item.append('<div class="kb-import-info">'+
                                '<span>LAST MODIFIED</span><br>'+
                                '<b>'+obj.relativeTime+'</b>'+
                            '</div>');
                item.append('<br><hr>')

                return item;
            }



            function objURL(module, type, ws, name) {
                var mapping = window.kbconfig.landing_page_map;
                if (mapping[module])
                    return self.options.landingPageURL+mapping[module][type]+'/'+ws+'/'+name;
                else
                    console.error('could not find a landing page mapping for', module);
            }

            function wsURL(ws) {
                return self.options.landingPageURL+'ws/'+ws;
            }


            function publicView() {
                var publicList = [{type: 'Genomes', ws: 'pubSEEDGenomes'},
                                  {type: 'Media', ws: 'KBaseMedia'},
                                  {type: 'Models', ws: 'KBasePublicModelsV4'},
                                  {type: 'RNA Seqs', ws: 'KBasePublicRNASeq'}];
                var selected = publicList[0];

                // get initial public data;
                ws.get_workspace_info({workspace: selected.ws})
                  .done(function(d){
                      getPublicData(d, publicTemplate);
                  })

                // filter for public objects
                var wsInput = $('<select class="form-control kb-import-filter">');
                for (var i=0; i < publicList.length; i++) {
                    wsInput.append('<option data-type="'+publicList[i].type+
                                         '" data-name="'+publicList[i].ws+'">'+
                                          publicList[i].type+
                                   '</option>');
                }
                var wsFilter = $('<div class="col-sm-4">').append(wsInput);

                // search filter
                var filterInput = $('<input type="text" class="form-control kb-import-search" placeholder="Filter '+
                                    selected.type+'">');
                var searchFilter = $('<div class="col-sm-4">').append(filterInput);

                // event for filter (search)
                filterInput.keyup(function(e){
                    query = $(this).val();

                    var filtered = filterData(publicData, {query:query})
                    render(filtered, publicPanel, publicSelected);
                });

                var row = $('<div class="row">').append(searchFilter, wsFilter);
                publicPanel.append(row);


                // event for type (workspace) dropdown
                wsInput.change(function() {
                    var active = $(this).children('option:selected');
                    var type = active.data('type'),
                        workspace = active.data('name');

                    filterInput.attr('placeholder', 'Filter '+type);

                    // request again with filted type
                    publicPanel.find('.kb-import-items').remove();
                    publicPanel.loading();

                    ws.get_workspace_info({workspace: workspace})
                      .done(function(d){
                            getPublicData(d, publicTemplate).done(function() {
                                publicPanel.rmLoading();
                            })
                      })
                });
            }
        }
    });

})( jQuery );
