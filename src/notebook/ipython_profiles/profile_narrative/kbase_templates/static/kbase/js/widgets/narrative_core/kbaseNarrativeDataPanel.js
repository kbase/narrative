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
            landing_page_url: "/functional-site/#/", // !! always include trailing slash
            lp_url: "/functional-site/#/dataview/",
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
                this.options.workspaceURL = window.kbconfig.urls.workspace;
                this.options.wsBrowserURL = window.kbconfig.urls.ws_browser;
                this.options.landingPageURL = window.kbconfig.urls.landing_pages;
                if (window.kbconfig.urls.landing_pages) {
                    this.options.lp_url = window.kbconfig.urls.landing_pages;
                }
            }
            this.data_icons = window.kbconfig.icons.data;
            this.icon_colors = window.kbconfig.icons.colors;

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

            // initialize the importer
            this.dataImporter();

            if (this.ws_name)
                this.trigger('workspaceUpdated.Narrative', this.ws_name);

            this.dataImporter();

            this.addButton($('<button>')
                           .addClass('btn btn-xs btn-default')
                           .tooltip({title:'Hide / Show data browser', 'container':'body', delay: { "show": 400, "hide": 50 }})
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
            if (this.ws_name)
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
            this.ws_name = null;
            // this.refresh();
            return this;
        },

        setWorkspace: function(ws_name) {
            this.ws_name = ws_name;
            if (this.wsClient)
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
//            this.dataListWidget.refresh();
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
            var self = this;
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

            var $mineFilterRow = $('<div class="row">');
            minePanel.append($mineFilterRow);
            var $mineScrollPanel = $('<div>').css({'overflow-x':'hidden','overflow-y':'auto','height':'550px'});
            setLoading($mineScrollPanel);
            minePanel.append($mineScrollPanel);

            var $sharedFilterRow = $('<div class="row">');
            sharedPanel.append($sharedFilterRow);
            var $sharedScrollPanel = $('<div>').css({'overflow-x':'hidden','overflow-y':'auto','height':'550px'});
            setLoading($sharedScrollPanel);
            sharedPanel.append($sharedScrollPanel);

            var body = $('<div>');
            var footer = $('<div>');
            body.addClass('kb-side-panel');
            body.append($tabs.header, $tabs.body);

            // add footer status container and buttons
            var importStatus = $('<div class="pull-left kb-import-status">');
            footer.append(importStatus)
            var btn = $('<button class="btn btn-primary pull-right" disabled>Add to Narrative</button>').css({'margin':'10px'});
            var closeBtn = $('<button class="kb-default-btn pull-right">Close</button>').css({'margin':'10px'});

            // Setup the panels that are defined by widgets
            publicPanel.kbaseNarrativeSidePublicTab({$importStatus:importStatus});
            importPanel.kbaseNarrativeSideImportTab({});
            examplePanel.kbaseNarrativeExampleDataTab({$importStatus:importStatus});

            // It is silly to invoke a new object for each widget
            var auth = {token: $("#signin-button").kbaseLogin('session', 'token')}
            var ws = new Workspace(this.options.workspaceURL, auth);


            closeBtn.click(function() {
                self.trigger('hideSidePanelOverlay.Narrative');
            })
            footer.append(closeBtn);

            // start with my data, then fetch other data
            // this is because data sets can be large and
            // makes things more fluid
            updateView('mine').done(function() {
                updateView('shared')
            });

            var narrativeNameLookup={};
            this.$overlayPanel = body.append(footer);

            function updateView(view) {
                var p;
                if (view == 'mine') {
                    p = getMyWS();
                } else if (view == 'shared') {
                    p = getSharedWS();
                }

                return $.when(p).done(function(workspaces) {
                    if (view == 'mine') {
                        prom = getMyData(workspaces);
                    } else if (view == 'shared') {
                        prom = getSharedData(workspaces);
                    }
                    $.when(prom).done(function() {
                        if (view == 'mine') {
                           // minePanel.detach();  // arg!! why isn't the filter bar it's own div?
                           // minePanel.append($mineScrollPanel);
                            addMyFilters();
                        } else if(view == 'shared') {
                          //  minePanel.detach();  // arg!! why isn't the filter bar it's own div?
                          //  minePanel.append($mineScrollPanel);
                            addSharedFilters();
                        }
                    });
                });
            }

            // function used to update my data list
            function getMyData(workspaces, type, ws_name) {
                if (workspaces.length==0) {
                    render([], $mineScrollPanel, {});
                    return [];
                }
                var params = {includeMetadata:1};
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
                    myData.sort(function(a,b) {
                            if (a[3] > b[3]) return -1; // sort by name
                            if (a[3] < b[3]) return 1;
                            return 0;
                        });
                    render(myData, $mineScrollPanel, mineSelected);
                });
            }


            // function used to update shared with me data list
            function getSharedData(workspaces, type, ws_name) {
                if (workspaces.length==0) {
                    render([], $sharedScrollPanel, {});
                    return null;
                }
                var params = {includeMetadata:1};
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

                    sharedData.sort(function(a,b) {
                            if (a[3] > b[3]) return -1; // sort by name
                            if (a[3] < b[3]) return 1;
                            return 0;
                        });

                    render(sharedData, $sharedScrollPanel, sharedSelected);
                })
            }

            // This function takes data to render and
            // a container to put data in.
            // It produces a scrollable dataset
            function render(data, container, selected, template) {
                var start = 0, end = 30;

                // remove items from only current container being rendered
                container.empty();

                if (data.length == 0){
                    container.append($('<div>').addClass("kb-data-list-type").css({margin:'15px', 'margin-left':'35px'}).append('No data found'));
                    return;
                } else if (data.length-1 < end)
                    end = data.length;

                var rows = buildMyRows(data, start, end, template);
                container.append(rows);
                events(container, selected);

                if (rows.children().length==0) {
                    container.append($('<div>').addClass("kb-data-list-type").css({margin:'15px', 'margin-left':'35px'}).append('No data found'));
                    return;
                }

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
                                if (d[i][8].narrative) {
                                    if (d[i][8].narrative_nice_name) {
                                        displayName = d[i][8].narrative_nice_name;
                                        // todo: should skip temporary narratives
                                        workspaces.push({id: d[i][0],
                                                         name: d[i][1],
                                                         displayName: displayName,
                                                         count: d[i][4]});
                                        narrativeNameLookup[d[i][1]] = displayName;
                                        continue;
                                    }
                                }

                                if (d[i][8].show_in_narrative_data_panel) {
                                    if(d[i][8].show_in_narrative_data_panel==='1') {
                                        displayName = "(data only) "+d[i][1];
                                        workspaces.push({id: d[i][0],
                                                     name: d[i][1],
                                                     displayName:displayName,
                                                     count: d[i][4]});
                                        narrativeNameLookup[d[i][1]] = displayName;
                                    }
                                }
                            }

                            // add to model for filter
                            myWorkspaces = workspaces;

                            // sort by name
                            myWorkspaces.sort(function(a,b) {
                                    if (a.displayName.toUpperCase() < b.displayName.toUpperCase()) return -1; // sort by name
                                    if (a.displayName.toUpperCase() > b.displayName.toUpperCase()) return 1;
                                    return 0;
                                });
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
                                if (d[i][8].narrative) {
                                    if (d[i][8].narrative_nice_name) {
                                        displayName = d[i][8].narrative_nice_name;
                                        // todo: should skip temporary narratives
                                        workspaces.push({id: d[i][0],
                                                         name: d[i][1],
                                                         displayName: displayName,
                                                         count: d[i][4]});
                                        narrativeNameLookup[d[i][1]] = displayName;
                                        continue;
                                    }
                                }

                                if (d[i][8].show_in_narrative_data_panel) {
                                    if(d[i][8].show_in_narrative_data_panel==='1') {
                                        displayName = "(data only) "+d[i][1];
                                        workspaces.push({id: d[i][0],
                                                     name: d[i][1],
                                                     displayName:displayName,
                                                     count: d[i][4]});
                                        narrativeNameLookup[d[i][1]] = displayName;
                                    }
                                }
                            }

                            // add to model for filter
                            sharedWorkspaces = workspaces;
                            sharedWorkspaces.sort(function(a,b) {
                                    if (a.displayName.toUpperCase() < b.displayName.toUpperCase()) return -1; // sort by name
                                    if (a.displayName.toUpperCase() > b.displayName.toUpperCase()) return 1;
                                    return 0;
                                });
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
                    if (f.query) {
                        //query filter
                        var query = f.query.toLowerCase();
                        if (name.toLowerCase().indexOf(query) >= 0) {
                            filteredData.push(obj);
                        } else if (kind.toLowerCase().indexOf(query)>=0) {
                            filteredData.push(obj);
                        } else if (obj[5].toLowerCase().indexOf(query)>=0) {
                            filteredData.push(obj);
                        }
                    } else if (f.type) {
                        //type filter
                        if (f.type.split('.')[1] === kind) {
                            filteredData.push(obj);
                        }
                    } else if (f.ws) {
                        // workspace filter
                        if (f.ws === ws) {
                            filteredData.push(obj);
                        }
                    } else {
                        // no filter is on, so add it
                        filteredData.push(obj);
                    }

                }
                return filteredData;
            }


            function buildMyRows(data, start, end, template) {

                // add each set of items to container to be added to DOM
                var rows = $('<div class="kb-import-items">');

                for (var i=start; i< (start+end); i++) {
                    var obj = data[i];
                    // some logic is not right
                    if (!obj) {
                        continue;
                    }
                    var mod_type = obj[2].split('-')[0];
                    var item = {id: obj[0],
                                name: obj[1],
                                mod_type: mod_type,
                                version: obj[4],
                                kind: mod_type.split('.')[1],
                                module: mod_type.split('.')[0],
                                wsID: obj[6],
                                ws: obj[7],
                                info: obj, // we need to have this all on hand!
                                relativeTime: getTimeStampStr(obj[3])} //use the same one as in data list for consistencey  kb.ui.relativeTime( Date.parse(obj[3]) ) }

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

                // create filter (search)
                var filterInput = $('<input type="text" class="form-control kb-import-search" placeholder="Search data...">');
                var searchFilter = $('<div class="col-sm-4">').append(filterInput);

                // create workspace filter
                var wsInput = $('<select class="form-control kb-import-filter">');
                wsInput.append('<option>All narratives...</option>');
                for (var i=0; i < wsList.length; i++) {
                    wsInput.append('<option data-id="'+[i].id+'" data-name="'+wsList[i].name+'">'+
                                          wsList[i].displayName+
                                   '</option>');
                }
                var wsFilter = $('<div class="col-sm-4">').append(wsInput);

                // event for type dropdown
                wsInput.change(function() {
                    ws = $(this).children('option:selected').data('name');
                    filterInput.val('');
                    // request again with filted type
                    setLoading($mineScrollPanel);
                    getMyData(myWorkspaces, type, ws);
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
                    filterInput.val('');
                    // request again with filted type
                    //minePanel.loading(); // loading puts the loading image in the wrong place..
                    setLoading($mineScrollPanel);
                    getMyData(myWorkspaces, type, ws);
                })


                // event for filter (search)
                filterInput.keyup(function(e){
                    query = $(this).val();
                    setLoading($mineScrollPanel);
                    var filtered = filterData(myData, {type: type, ws:ws, query:query})
                    render(filtered, $mineScrollPanel, mineSelected);
                });


                var $refreshBtnDiv = $('<div>').addClass('col-sm-1').css({'text-align':'center'}).append(
                                        $('<button>')
                                            .css({'margin-top':'12px'})
                                            .addClass('btn btn-xs btn-default')
                                            .click(function(event) {
                                                $mineScrollPanel.empty();
                                                setLoading($mineScrollPanel);
                                                updateView('mine').done(function() {
                                                    updateView('shared'); });
                                                })
                                            .append($('<span>')
                                                .addClass('glyphicon glyphicon-refresh')));


                // add search, type, ws filter to dom
                $mineFilterRow.empty();
                $mineFilterRow.append(searchFilter, typeFilter, wsFilter, $refreshBtnDiv);
                //minePanel.prepend(row);
            }

            function addSharedFilters() {
                //var types = typeList(sharedData);
                var wsList = sharedWorkspaces

                // possible filters via input
                var type, ws, query;

                // create filter (search)
                var filterInput = $('<input type="text" class="form-control kb-import-search" placeholder="Search data...">');
                var searchFilter = $('<div class="col-sm-4">').append(filterInput);

                // create workspace filter
                var wsInput = $('<select class="form-control kb-import-filter">');
                wsInput.append('<option>All narratives...</option>');
                for (var i=0; i < wsList.length; i++) {
                    wsInput.append('<option data-id="'+wsList[i].id+'" data-name="'+wsList[i].name+'">'+
                                          wsList[i].displayName+
                                    '</option>');
                }
                var wsFilter = $('<div class="col-sm-4">').append(wsInput);

                // event for type dropdown
                wsInput.change(function() {
                    filterInput.val('');
                    ws = $(this).children('option:selected').data('name');
                    // request again with filted type
                    setLoading($sharedScrollPanel);
                    getSharedData(sharedWorkspaces, type, ws);
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
                    filterInput.val('');

                    // request again with filted type
                    setLoading($sharedScrollPanel);
                    getSharedData(sharedWorkspaces, type, ws);
                })



                // event for filter (search)
                filterInput.keyup(function(e){
                    query = $(this).val();
                    var filtered = filterData(sharedData, {type: type, ws:ws, query:query})
                    render(filtered, $sharedScrollPanel, sharedSelected);
                });


                var $refreshBtnDiv = $('<div>').addClass('col-sm-1').append(
                                        $('<button>')
                                            .css({'margin-top':'12px'})
                                            .addClass('btn btn-xs btn-default')
                                            .click(function(event) {
                                                $sharedScrollPanel.empty();
                                                setLoading($sharedScrollPanel);
                                                updateView('shared').done(function() {
                                                    updateView('mine'); });
                                                })
                                            .append($('<span>')
                                                .addClass('glyphicon glyphicon-refresh')));

                // add search, type, ws filter to dom
                $sharedFilterRow.empty();
                $sharedFilterRow.append(searchFilter, typeFilter, wsFilter, $refreshBtnDiv);
                //sharedPanel.prepend(row);
            }

            function rowTemplate(obj) {
                var object_info = obj.info;
                // object_info:
                // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                // [9] : int size // [10] : usermeta meta
                var type_tokens = object_info[2].split('.')
                var type_module = type_tokens[0];
                var type = type_tokens[1].split('-')[0];
                var unversioned_full_type = type_module + '.' + type;
                var logo_name = "";
                var landingPageLink = self.options.lp_url + object_info[6] + '/' + object_info[1];
                var icons = self.data_icons;
                var icon = _.has(icons, type) ? icons[type] : icons['DEFAULT'];
                var $logo = $('<span>');

                var shortName = object_info[1]; var isShortened=false;
                if (shortName.length>50) {
                    shortName = shortName.substring(0,50)+'...';
                    isShortened=true;
                }
                var $name = $('<span>').addClass("kb-data-list-name").append('<a href="'+landingPageLink+'" target="_blank">'+shortName+'</a>'); // TODO: make link!!
                if (isShortened) { $name.tooltip({title:object_info[1], placement:'bottom', delay: { show: 750, hide: 0 } }); }

                var $version = $('<span>').addClass("kb-data-list-version").append('v'+object_info[4]);
                var $type = $('<span>').addClass("kb-data-list-type").append(type);

                var $date = $('<span>').addClass("kb-data-list-date").append(getTimeStampStr(object_info[3]));
                var $byUser = $('<span>').addClass("kb-data-list-edit-by");
                if (object_info[5] !== self.my_user_id) {
                    $byUser.append(' by '+object_info[5])
                        .click(function(e) {
                            e.stopPropagation();
                            window.open(self.options.landing_page_url+'people/'+object_info[5]);
                        });
                }

                var metadata = object_info[10];
                var metadataText = '';
                for(var key in metadata) {
                    if (metadata.hasOwnProperty(key)) {
                        metadataText += '<tr><th>'+ key +'</th><td>'+ metadata[key] + '</td></tr>';
                    }
                }
                if (type==='Genome') {
                    if (metadata.hasOwnProperty('Name')) {
                        $type.text(type+': '+metadata['Name']);
                    }
                }

                var narName = obj.ws;
                if (narrativeNameLookup[obj.ws]) {
                    narName = narrativeNameLookup[obj.ws];
                }
                var $narName = $('<span>').addClass("kb-data-list-narrative").append(narName);
                //var $savedByUserSpan = $('<td>').addClass('kb-data-list-username-td').append(object_info[5]);
                //this.displayRealName(object_info[5],$savedByUserSpan);

                //var typeLink = '<a href="'+this.options.landing_page_url+'spec/module/'+type_module+'" target="_blank">' +type_module+"</a>.<wbr>" +
                //                '<a href="'+this.options.landing_page_url+'spec/type/'+object_info[2]+'" target="_blank">' +(type_tokens[1].replace('-','&#8209;')) + '.' + type_tokens[2] + '</a>';
                //var $moreRow  = $('<div>').addClass("kb-data-list-more-div").hide()
                //                .append(
                //                    $('<table style="width:100%;">')
                //                        .append("<tr><th>Permament Id</th><td>" +object_info[6]+ "/" +object_info[0]+ "/" +object_info[4] + '</td></tr>')
                //                        .append("<tr><th>Full Type</th><td>"+typeLink+'</td></tr>')
                //                        .append($('<tr>').append('<th>Saved by</th>').append($savedByUserSpan))
                //                        .append(metadataText));

                //var $toggleAdvancedViewBtn = $('<span>').addClass("kb-data-list-more")//.addClass('btn btn-default btn-xs kb-data-list-more-btn')
                //    .hide()
                //    .html('<span class="fa fa-ellipsis-h" style="color:#999" aria-hidden="true"/>');
                //var toggleAdvanced = function() {
                //        if ($moreRow.is(':visible')) {
                //            $moreRow.slideUp('fast');
                //            $toggleAdvancedViewBtn.show();
                //        } else {
                //            $moreRow.slideDown('fast');
                //            $toggleAdvancedViewBtn.hide();
                //        }
                //    };

                var $btnToolbar = $('<span>').addClass('btn-toolbar pull-right').attr('role', 'toolbar').hide();
                var btnClasses = "btn btn-xs btn-default";
                var css = {'color':'#888'};
                var $openLandingPage = $('<span>')
                                        // tooltips showing behind pullout, need to fix!
                                        //.tooltip({title:'Explore data', 'container':'#'+this.mainListId})
                                        .addClass(btnClasses)
                                        .append($('<span>').addClass('fa fa-binoculars').css(css))
                                        .click(function(e) {
                                            e.stopPropagation();
                                            window.open(landingPageLink);
                                        });

                var $openProvenance = $('<span>')
                                        .addClass(btnClasses).css(css)
                                        //.tooltip({title:'View data provenance and relationships', 'container':'body'})
                                        .append($('<span>').addClass('fa fa-sitemap fa-rotate-90').css(css))
                                        .click(function(e) {
                                            e.stopPropagation();
                                            window.open(self.options.landing_page_url+'objgraphview/'+object_info[7]+'/'+object_info[1]);
                                        });
                $btnToolbar.append($openLandingPage).append($openProvenance);



                var $mainDiv  = $('<div>').addClass('kb-data-list-info').css({padding:'0px',margin:'0px'})
                                    .append($btnToolbar)
                                    .append($name).append($version).append('<br>')
                                    .append($type).append('<br>').append($narName).append('<br>').append($date).append($byUser);
                                    //.append($toggleAdvancedViewBtn)
                                    //.click(
                                    //    function() {
                                    //        toggleAdvanced();
                                    //    });


                var $addDiv =
                    $('<div>').append(
                        $('<button>').addClass('kb-primary-btn').css({'white-space':'nowrap', padding:'10px 15px'})
                            .append($('<span>').addClass('fa fa-chevron-circle-left')).append(' Add')
                            .on('click',function() { // probably should move action outside of render func, but oh well
                                $(this).attr("disabled","disabled");
                                $(this).html('<img src="'+self.options.loadingImage+'">');

                                var thisBtn = this;
                                var targetName = object_info[1];
                                //console.log(object.name + " -> " + targetName);
                                ws.copy_object({
                                    to:   {ref: self.ws_name + "/" + targetName},
                                    from: {ref: object_info[6] +   "/" + object_info[0]} },
                                    function (info) {
                                        $(thisBtn).html('Added');
                                        self.trigger('updateDataList.Narrative');
                                    },
                                    function(error) {
                                        $(thisBtn).html('Error');
                                        if (error.error && error.error.message) {
                                            if (error.error.message.indexOf('may not write to workspace')>=0) {
                                                importStatus.html($('<div>').css({'color':'#F44336','width':'500px'}).append('Error: you do not have permission to add data to this Narrative.'));
                                            } else {
                                                importStatus.html($('<div>').css({'color':'#F44336','width':'500px'}).append('Error: '+error.error.message));
                                            }
                                        } else {
                                            importStatus.html($('<div>').css({'color':'#F44336','width':'500px'}).append('Unknown error!'));
                                        }
                                        console.error(error);
                                    });

                            }));


                var $topTable = $('<table>')
                                 .css({'width':'100%','background':'#fff'})  // set background to white looks better on DnD
                                 .append($('<tr>')
                                         .append($('<td>')
                                                 .css({'width':'90px'})
                                                .append($addDiv.hide()))
                                         .append($('<td>')
                                                 .css({'width':'50px'})
                                                 .append($logo))
                                         .append($('<td>')
                                                 .append($mainDiv)));
                // set icon for data item
                $(document).trigger("setDataIcon.Narrative", {
                    elt: $logo,
                    type: type
                });

                var $row = $('<div>')
                                .css({margin:'2px',padding:'4px','margin-bottom': '5px'})
                                //.addClass('kb-data-list-obj-row')
                                .append($('<div>').addClass('kb-data-list-obj-row-main')
                                            .append($topTable))
                                //.append($moreRow)
                                // show/hide ellipses on hover, show extra info on click
                                .mouseenter(function(){
                                    //if (!$moreRow.is(':visible')) { $toggleAdvancedViewBtn.show(); }
                                    $addDiv.show();
                                    $btnToolbar.show();
                                })
                                .mouseleave(function(){
                                    //$toggleAdvancedViewBtn.hide();
                                    $addDiv.hide();
                                    $btnToolbar.hide();
                                });

                var $rowWithHr = $('<div>').data('ref', obj.wsID+'.'+obj.id)
                                .data('obj-name', obj.name)
                                    .append($('<hr>')
                                                .addClass('kb-data-list-row-hr')
                                                .css({'margin-left':'150px'}))
                                    .append($row);

                return $rowWithHr;
            }

            // the existing .loading() .rmLoading() puts the loading icon in the wrong place
            function setLoading($container) {
                $container.empty();
                $container.append($('<div>').addClass("kb-data-list-type").css({margin:'15px', 'margin-left':'35px'})
                                  .append('<img src="' + self.options.loadingImage + '">'));
            }

            function objURL(module, type, ws, name) {
                return self.options.lp_url+ws+'/'+name;
            }

            function wsURL(ws) {
                return ''; // no more links to WS Browser
            }

            var monthLookup = ["Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul", "Aug", "Sep","Oct", "Nov", "Dec"];
            // edited from: http://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
            function getTimeStampStr(objInfoTimeStamp) {
                var date = new Date(objInfoTimeStamp);
                var seconds = Math.floor((new Date() - date) / 1000);

                // f-ing safari, need to add extra ':' delimiter to parse the timestamp
                if (isNaN(seconds)) {
                    var tokens = objInfoTimeStamp.split('+');  // this is just the date without the GMT offset
                    var newTimestamp = tokens[0] + '+'+tokens[0].substr(0,2) + ":" + tokens[1].substr(2,2);
                    date = new Date(newTimestamp);
                    seconds = Math.floor((new Date() - date) / 1000);
                    if (isNaN(seconds)) {
                        // just in case that didn't work either, then parse without the timezone offset, but
                        // then just show the day and forget the fancy stuff...
                        date = new Date(tokens[0]);
                        return monthLookup[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
                    }
                }

                var interval = Math.floor(seconds / 31536000);
                if (interval > 1) {
                    return monthLookup[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
                }
                interval = Math.floor(seconds / 2592000);
                if (interval > 1) {
                    if (interval<4) {
                        return interval + " months ago";
                    } else {
                        return monthLookup[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
                    }
                }
                interval = Math.floor(seconds / 86400);
                if (interval > 1) {
                    return interval + " days ago";
                }
                interval = Math.floor(seconds / 3600);
                if (interval > 1) {
                    return interval + " hours ago";
                }
                interval = Math.floor(seconds / 60);
                if (interval > 1) {
                    return interval + " minutes ago";
                }
                return Math.floor(seconds) + " seconds ago";
            };
        },

        isCustomIcon: function (icon_list) {
            return (icon_list.length > 0 && icon_list[0].length > 4 &&
            icon_list[0].substring(0, 4) == 'icon');
        },

        logoColorLookup:function(type) {
            var code = 0;
            for (var i=0; i < type.length; code += type.charCodeAt(i++));
            return this.icon_colors[ code % this.icon_colors.length ];
        }


    });

})( jQuery );
