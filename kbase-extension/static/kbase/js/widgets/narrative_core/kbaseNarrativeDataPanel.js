/*global define*/
/*jslint white: true*/
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
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @author Dan Gunter <dkgunter@lbl.gov>
 * @public
 */
define(['jquery',
        'underscore',
        'bluebird',
        'narrativeConfig',
        'util/timeFormat',
        'kbwidget',
        'kbaseNarrative',
        'kbaseNarrativeControlPanel',
        'kbaseNarrativeDataList',
        'kbaseNarrativeSidePublicTab',
        'kbaseNarrativeSideImportTab',
        'kbaseNarrativeExampleDataTab'],
function($,
         _,
         Promise,
         Config,
         TimeFormat) {
    'use strict';
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
            loadingImage: Config.get('loading_gif'),
            notLoggedInMsg: "Please log in to view a workspace.",
            workspaceURL: Config.url('workspace'),
            lp_url: Config.url('landing_pages'), 
            container: null,
            ws_name: null,
        },
        ws_name: null,
        // Constants
        WS_NAME_KEY: 'ws_name', // workspace name, in notebook metadata
        WS_META_KEY: 'ws_meta', // workspace meta (dict), in notebook metadata
        token: null,
        dataListWidget: null,
        $myDataHeader: null,
        myDataTempNarrativeMsg: 'Warning! This Narrative is temporary (untitled). '+
            'Data of temporary Narratives is not visible on this tab. Please change '+
            'the name of the Narrative to make it permanent.',

        renderedTabs: [false, false, false, false, false],

        init: function(options) {
            this._super(options);
            var self = this;
            
            if (Jupyter && Jupyter.narrative) {
                this.ws_name = Jupyter.narrative.getWorkspaceName();
            }

            var icons = Config.get('icons');
            this.data_icons = icons.data;
            this.icon_colors = icons.colors;

            var $dataList = $('<div>');
            this.body().append($dataList);
            this.dataListWidget = 
                $dataList.kbaseNarrativeDataList(
                    {
                        ws_name: this.ws_name,
                        parentControlPanel: this,
                        slideTime: this.slideTime
                    }
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
                    this.dataListWidget.refresh();
                },
                this)
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

            $(document).on(
                'sidePanelOverlayShown.Narrative', function(e) {
                    // find the index of what tab is being shown.
                    if (this.$overlayPanel.is(':visible')) {
                        var idx = $('.kb-side-overlay-container').find('.kb-side-header.active').index();
                        console.log('UPDATING DATA PANEL RENDERING');
                        this.updateSlideoutRendering(idx);
                    }
                }.bind(this)
            );

            $(document).on()

            this.$slideoutBtn = $('<button>')
                .addClass('btn btn-xs btn-default')
                .tooltip({
                    title: 'Hide / Show data browser', 
                    container: 'body', 
                    delay: { 
                        show: Config.get('tooltip').showDelay, 
                        hide: Config.get('tooltip').hideDelay 
                    }
                })
                .append('<span class="fa fa-arrow-right"></span>')
                .click(function(event) {
                    this.$slideoutBtn.tooltip('hide');
                    this.trigger('hideGalleryPanelOverlay.Narrative');
                    this.trigger('toggleSidePanelOverlay.Narrative', this.$overlayPanel);
                }.bind(this));

            this.addButton(this.$slideoutBtn);
            
            return this;
        },

        setListHeight: function(height, animate) {
            if(this.dataListWidget) {
                this.dataListWidget.setListHeight(height, animate);
            }
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
            this.token = auth.token;
            this.wsClient = new Workspace(this.options.workspaceURL, auth);
            this.isLoggedIn = true;
            if (this.ws_name) {
                this.importerThing = this.dataImporter(this.ws_name);
                this.renderFn = [
                    function() {
                        this.importerThing.updateView('mine', this.ws_name);
                    }.bind(this),
                    function() {
                        this.importerThing.updateView('shared', this.ws_name);
                    }.bind(this),
                    function() {
                        this.publicTab.render();
                    }.bind(this),
                    function() {
                        this.exampleTab.getExampleDataAndRender();
                    }.bind(this),
                    function() {
                    }.bind(this)
                ];
            } else {
                //console.error("ws_name is not defined");
            }
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

                    this.updateSlideoutRendering(idx);
                }
            }, this));

            $header.find('div:first-child').addClass('active');
            $body.find('div:first-child.kb-side-tab').addClass('active');

            return {
                header: $header,
                body: $body
            };
        },

        updateSlideoutRendering: function(panelIdx) {
            if (!this.renderedTabs[panelIdx]) {
                this.renderFn[panelIdx]();
                this.renderedTabs[panelIdx] = true;
            }
        },

        /**
         * Renders the data importer panel
         * I'm throwing this here because I have no idea how to
         * bind a sidepanel to a specific widget, since all the other panels "inherit" these widgets.
         */
        dataImporter: function(narWSName) {
            var self = this;
            var maxObjFetch = 100000;

            var self = this;
            var user = $("#signin-button").kbaseLogin('session', 'user_id');
            if (!user) {
                console.error("NarrativeDataPanel: user is not defined, parsing token instead...");
                var tokenParts = this.token.split("|");
                for (var i in tokenParts) {
                    var keyValue = tokenParts[i].split("=");
                    if (keyValue.length == 2 && keyValue[0] === "un")
                        user = keyValue[1];
                }
            }

            // models
            var myData = [],
                sharedData = [];

            var myWorkspaces = [], 
                sharedWorkspaces = [];

            // model for selected objects to import
            var mineSelected = [], 
                sharedSelected = [];

            var types = ["KBaseGenomes.Genome",
                         "KBaseGenomes.GenomeAnnotation",
                         "KBaseSearch.GenomeSet",
                         "KBaseGenomes.Pangenome",
                         "KBaseGeneDomains.DomainAnnotation",
                         "KBaseGenomes.GenomeComparison",
                         "KBaseGenomes.GenomeDomainData",
                         "GenomeComparison.ProteomeComparison",
                         "KBaseGenomes.ContigSet",
                         "KBaseGenomes.Assembly",
                         "KBaseAssembly.SingleEndLibrary",
                         "KBaseAssembly.PairedEndLibrary",
                         "KBaseAssembly.AssemblyInput",
                         "KBaseAssembly.AssemblyReport",
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
                         "KBaseExpression.ExpressionSeries",
                         "KBaseExpression.ExpressionSample",
                         "Communities.Metagenome",
                         "Communities.SequenceFile",
                         "Communities.Collection",
                         "Communities.FunctionalMatrix",
                         "Communities.FunctionalProfile",
                         "Communities.Heatmap",
                         "Communities.PCoA",
                         "Communities.TaxonomicMatrix",
                         "Communities.TaxonomicProfile",
                         "KBaseFeatureValues.ExpressionMatrix",
                         "KBaseFeatureValues.FeatureClusters",
                         "KBaseFeatureValues.EstimateKResult",
                         "KBaseCollections.FeatureSet",
                         ];

            types.sort(function(a,b){
                var aName = a.split('.')[1].toUpperCase();
                var bName = b.split('.')[1].toUpperCase();
                if (aName < bName) return -1; // sort by name
                if (aName > bName) return 1;
                return 0;
            });

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


            // (Bill - 1/29/2016)
            // Gotta keep this stuff separate for now. Should be factored into 3 widgets:
            // a parent that maintains structure and data calls, and children that
            // extend the data calls with different options.
            //
            // Honestly, no time. This is ugly, but we have to triage to get to the end of the sprint...
            var $mineMessageHeader = $('<div>').addClass('alert alert-warning alert-dismissable')
                                               .append($('<button>')
                                                       .attr({'type': 'button',
                                                              'aria-label': 'close',
                                                       })
                                                       .addClass('close')
                                                       .append($('<span aria-hidden="true">&times;</span>'))
                                                       .click(function() {
                                                          $mineMessageHeader.slideUp(400);
                                                       }))
                                               .append($('<span id="kb-data-panel-msg">'))
                                               .hide();
            var $mineContentPanel = $('<div>');
            var mineLoadingDiv = createLoadingDiv();
            var $mineFilterRow = $('<div class="row">');
            var $mineScrollPanel = $('<div>').css({'overflow-x':'hidden','height':'550px','overflow-y': 'auto'});
            minePanel.append(mineLoadingDiv.loader)
                     .append($mineContentPanel
                             .append($mineFilterRow)
                             .append($mineMessageHeader)
                             .append($mineScrollPanel));
            setLoading('mine', true);

            var $sharedMessageHeader = $('<div>').addClass('alert alert-warning alert-dismissable').hide();
            var $sharedContentPanel = $('<div>');
            var sharedLoadingDiv = createLoadingDiv();
            var $sharedFilterRow = $('<div class="row">');
            var $sharedScrollPanel = $('<div>').css({'overflow-x': 'hidden', 'height': '550px', 'overflow-y': 'auto'});
            sharedPanel.append(sharedLoadingDiv.loader)
                       .append($sharedContentPanel
                               .append($sharedFilterRow)
                               .append($sharedMessageHeader)
                               .append($sharedScrollPanel));
            setLoading('shared', true);

            var body = $('<div>');
            var footer = $('<div>');
            body.addClass('kb-side-panel');
            body.append($tabs.header, $tabs.body);

            // add footer status container and buttons
            var importStatus = $('<div class="pull-left kb-import-status">');
            footer.append(importStatus);
            var btn = $('<button class="btn btn-primary pull-right" disabled>Add to Narrative</button>').css({'margin':'10px'});
            var closeBtn = $('<button class="kb-default-btn pull-right">Close</button>').css({'margin':'10px'});


            function createLoadingDiv () {
                var minValue = 5;
                var $progressBar = $('<div>')
                                   .addClass('progress-bar progress-bar-striped active')
                                   .attr({
                                    'role': 'progressbar',
                                    'aria-valuenow': minValue,
                                    'aria-valuemin': '0',
                                    'aria-valuemax': '100',
                                   })
                                   .css({
                                    'width': minValue + '%',
                                    'transition': 'none'
                                   });

                var $loadingDiv = $('<div>')
                                  .addClass('row')
                                  .css({margin:'15px', 'margin-left':'35px', 'height':'550px'})
                                  .append($('<div class="progress">').append($progressBar))
                                  .hide();

                var setValue = function(value) {
                    if (value >= minValue) {
                        $progressBar.css('width', value + '%')
                                    .attr('aria-valuenow', value);
                    }
                }

                var reset = function() {
                    setValue(minValue);
                }

                return {
                    loader: $loadingDiv,
                    progressBar: $progressBar,
                    setValue: setValue,
                    reset: reset
                };
            }

            // Setup the panels that are defined by widgets
            // minePanel.kbaseNarrativeMyDataTab({ws_name: this.ws_name});
            // sharedPanel.kbaseNarrativeSharedDataTab({ws_name: this.ws_name});

            this.publicTab = publicPanel.kbaseNarrativeSidePublicTab({$importStatus:importStatus, ws_name: this.ws_name});
            this.importTab = importPanel.kbaseNarrativeSideImportTab({ws_name: this.ws_name});
            this.exampleTab = examplePanel.kbaseNarrativeExampleDataTab({$importStatus:importStatus, ws_name: this.ws_name});

            // It is silly to invoke a new object for each widget
            var auth = {token: $("#signin-button").kbaseLogin('session', 'token')};
            var ws = new Workspace(this.options.workspaceURL, auth);

            closeBtn.click(function() {
                self.trigger('hideSidePanelOverlay.Narrative');
            });
            footer.append(closeBtn);

            // start with my data, then fetch other data
            // this is because data sets can be large and
            // makes things more fluid

            var narrativeNameLookup={};
            this.$overlayPanel = body.append(footer);

            var self = this;
            function cleanupData(data, view) {
                return Promise.try(function() {
                    // data = [].concat.apply([], data);
                    data.sort(function(a, b) {
                        if (a[3] > b[3]) return -1;
                        return 1;
                    });
                    return data;
                });
            }

            function getAndRenderData(view, workspaces, type, specWs, ignoreWs, nameFilter) {
                return getData(view, workspaces, type, specWs, ignoreWs, nameFilter)
                .then(function(data) {
                    return cleanupData(data, view);
                })
                .then(function(data) {
                    if (view === 'mine') {
                        myData = data;
                        render(view, myData, $mineScrollPanel, mineSelected);
                    }
                    else {
                        sharedData = data;
                        render(view, sharedData, $sharedScrollPanel, sharedSelected);
                    }
                })
                .catch(function(error) {
                    console.error("ERROR while rendering data...", error);
                });
            }

            function updateView(view, ignoreWs) {
                getWorkspaces(view, ignoreWs)
                .then(function(workspaces) {
                    if (view === 'mine')
                        myWorkspaces = workspaces;
                    else
                        sharedWorkspaces = workspaces;
                    return getAndRenderData(view, workspaces, undefined, undefined, ignoreWs, undefined);
                })
                .then(function() {
                    if (view === 'mine')
                        addFilters(view, myWorkspaces, myData, $mineScrollPanel, $mineFilterRow);
                    else
                        addFilters(view, sharedWorkspaces, sharedData, $sharedScrollPanel, $sharedFilterRow);
                })
                .catch(function(error) {
                    console.log('ERROR ', error);
                });
            }

            function getWorkspaces(view, ignoreWs) {
                var getWsInfoParams = {};
                if (view === 'mine') 
                    getWsInfoParams.owners = [user];
                else
                    getWsInfoParams.excludeGlobal = 1;

                return Promise.resolve(ws.list_workspace_info(getWsInfoParams))
                .then(function(d) {
                    var workspaces = [];
                    var legacyItems = []; // {id:..., name:..., count:...}

                    for (var i in d) {
                        if ((view === 'shared' && d[i][2] === user) ||
                            (ignoreWs && d[i][1] === ignoreWs))
                            continue;

                        // check if current or temporary ws - skip if so.
                        var isLegacy = false;
                        if (d[i][8].is_temporary && 
                            d[i][8].is_temporary === 'true') {
                            if (d[i][1] === ignoreWs) {
                                self.currentWsIsTemp();
                            }
                            continue;
                        }
                        var displayName = d[i][1];
                        if (d[i][8].narrative && 
                            d[i][8].narrative_nice_name) {
                            displayName = d[i][8].narrative_nice_name;
                        }
                        else if (d[i][8].show_in_narrative_data_panel &&
                                 d[i][8].show_in_narrative_data_panel === '1') {
                            displayName = '(data only) ' + displayName;
                        }
                        else {
                            displayName = 'Legacy (' + displayName + ')';
                            legacyItems.push({
                                id: d[i][0],
                                name: d[i][1],
                                count: d[i][4]
                            });
                            isLegacy = true;
                        }
                        if (!isLegacy) {
                            workspaces.push({
                                id: d[i][0],
                                name: d[i][1],
                                displayName: displayName,
                                count: d[i][4]
                            });
                        }

                        narrativeNameLookup[d[i][1]] = displayName;
                    }
                    workspaces.sort(function(a, b) {
                        // don't really care if they're equal...
                        if (a.displayName.toUpperCase() < b.displayName.toUpperCase()) return -1;
                        return 1;
                    });
                    if (legacyItems.length > 0) {
                        workspaces.push({id: -1, name: '#legacy#', displayName: 'Legacy (old version)', count: 0, legacy: legacyItems});
                    }
                    return workspaces;
                }.bind(this));
            }

            /**
             * Returns a set of data.
             * Either uses all workspaces in workspaces array, 
             * or just the one named wsName.
             * Also returns only data of the given type, if not undefined
             */
            function getData(view, workspaces, type, wsName, ignoreWs, nameFilter) {
                if (workspaces.length === 0) {
                    return Promise.try(function() {
                        return [];
                    });
                }
                var params = { includeMetadata: 1 },
                    wsIds = [],
                    objCount = 0,
                    maxObjCount = 0;

                // first pass, get set of wsids and their counts
                var wsIdsToCounts = [];
                for (var i=0; i<workspaces.length; i++) {
                    var thisWs = workspaces[i];

                    if ((wsName && workspaces[i].name !== wsName) ||
                        (ignoreWs && workspaces[i].name === ignoreWs))
                        continue;
                    // go through the list and add all workspaces to the params
                    if (thisWs.id > 0 && thisWs.count > 0) {
                        wsIdsToCounts.push({id: thisWs.id, count: thisWs.count});
                    }
                    // go through the legacy list and add those, too
                    else if (thisWs.legacy) {
                        for (var n=0; n<thisWs.legacy.length; n++) {
                            var w = thisWs.legacy[n];
                            if (w.count > 0) {
                                wsIdsToCounts.push({id: w.id, count: w.count});
                            }
                        }
                    }
                }

                if (wsIdsToCounts.length === 0) {
                    return Promise.try(function() {
                        return [];
                    });
                }

                // sort wsids by their counts in ascending order
                wsIdsToCounts.sort(function(a, b) {
                    return a.count - b.count;
                });

                var newParamSet = function(start) {
                    var param = {
                        includeMetadata: 1,
                        ids: []
                    };
                    if (start.type)
                        param.type = start.type;
                    if (start.id)
                        param.ids.push(start.id);
                    return param;
                }

                // Construct all data requests below.
                // This grabs everything into the client for now,
                // until we have some server-side searching.
                var paramsList = [],
                    curParam = newParamSet({type: type}),
                    curTotal = 0,
                    maxRequest = 10000,
                    totalFetch = 0;

                // Set up all possible requests. We'll break out of 
                // the request loop in below
                for (var i=0; i<wsIdsToCounts.length; i++) {
                    var thisWs = wsIdsToCounts[i];
                    totalFetch += thisWs.count;

                    // if there's room in the request for this
                    // ws, put it there, and boost the total
                    if (curTotal + thisWs.count < maxRequest) {
                        curParam.ids.push(thisWs.id);
                        curTotal += thisWs.count;
                    }
                    // if there isn't room, but ws isn't gonna
                    // blow over another request size, then
                    // finish this request and start a new one with
                    // this ws
                    else if (thisWs.count < maxRequest) {
                        paramsList.push(curParam);
                        curParam = newParamSet({type: type, id: thisWs.id});
                        curTotal = thisWs.count;
                    }
                    // if there isn't room because that's one big
                    // honker of a workspace, then it gets its
                    // own set of requests. Yes, this is probably
                    // kinda inefficient. Don't care.
                    else if (thisWs.count > maxRequest) {
                        for (var j=0; j<thisWs.count; j+=maxRequest) {
                            var newParam = newParamSet({type: type, id: thisWs.id});
                            newParam.minObjectID = j+1;
                            newParam.maxObjectID = j+maxRequest;
                            paramsList.push(newParam);
                        }
                    }
                }
                // at the tail end, push that last completed param set
                if (curParam.ids.length > 0)
                    paramsList.push(curParam);

                if (objCount > maxObjFetch)
                    console.error("User's object count for owned workspaces was", objCount);

                var headerMessage = '';
                var requestCounter = 0;
                return Promise.reduce(paramsList, function (dataList, param) {
                    requestCounter++;
                    var progress = Math.floor(requestCounter / paramsList.length * 100);
                    updateProgress(view, progress);
                    if (dataList.length >= maxObjFetch) {
                        return Promise.try(function() {
                            return dataList;
                            updateProgress(view, 100);
                        });
                    }
                    else {
                        return Promise.resolve(ws.list_objects(param))
                            .then(function (data) {
                                // filter out Narrative objects.
                                for (var i=0; i<data.length && dataList.length<maxObjFetch; i++) {
                                    if (data[i][2].startsWith('KBaseNarrative'))
                                        continue;
                                    else
                                        dataList.push(data[i]);
                                }
                                return dataList;
                            }
                        );
                    }
                }, []);
            }

            // This function takes data to render and
            // a container to put data in.
            // It produces a scrollable dataset
            function render(view, data, container, selected, template) {
                var setDataIconTrigger = $._data($(document)[0], "events")["setDataIcon"];
                if (setDataIconTrigger) {
                    renderOnIconsReady(view, data, container, selected, template);
                } else {
                    setTimeout(function(){
                        renderOnIconsReady(view, data, container, selected, template);
                    }, 100);
                }
            }
            
            function renderOnIconsReady(view, data, container, selected, template) {
                var headerMessage = '';
                if (data.length >= maxObjFetch) {
                    headerMessage = "You have access to over <b>" + maxObjFetch + "</b> data objects, so we're only showing a sample. Please use the Types or Narratives selectors above to filter.";
                }
                setHeaderMessage(view, headerMessage);

                var start = 0, numRows = 30;

                // remove items from only current container being rendered
                container.empty();

                if (data.length == 0) {
                    container.append($('<div>').addClass("kb-data-list-type").css({margin:'15px', 'margin-left':'35px'}).append('No data found'));
                    setLoading(view, false);
                    return;
                }

                var rows = buildMyRows(data, start, numRows, template);
                container.append(rows);
                events(container, selected);

                if (rows.children().length==0) {
                    container.append($('<div>').addClass("kb-data-list-type").css({margin:'15px', 'margin-left':'35px'}).append('No data found'));
                    setLoading(view, false);
                    return;
                }

                // infinite scroll
                var currentPos = numRows;
                container.unbind('scroll');
                container.on('scroll', function() {
                    if($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight && currentPos < data.length) {
                        var rows = buildMyRows(data, currentPos, numRows, template);
                        container.append(rows);
                        currentPos += numRows;
                    }
                    events(container, selected);
                });
                setLoading(view, false);
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
                panel.find('.kb-import-item').click(function() {
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
                        events(panel, selected);
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
                });

                // prevent checking when clicking link
                panel.find('.kb-import-item a').unbind('click');
                panel.find('.kb-import-item a').click(function(e) {
                    e.stopPropagation();
                });

            }

            function filterData(data, f) {
                if (data.length == 0) return [];
                
                // if we're at our limit for what to load,
                // then the filter should go against list_objects.
                // send the filter there and re-render.
                // ...actually, that won't work because it only 
                // returns names. no-op for now.

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


            function buildMyRows(data, start, numRows, template) {
                // add each set of items to container to be added to DOM
                var rows = $('<div class="kb-import-items">');

                for (var i=start; i<Math.min(start+numRows, data.length); i++) {
                    var obj = data[i];
                    // some logic is not right
                    // if (!obj) {
                    //     continue;
                    // }
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
                                relativeTime: TimeFormat.getTimeStampStr(obj[3])} //use the same one as in data list for consistencey  kb.ui.relativeTime( Date.parse(obj[3]) ) }

                    // if (item.module=='KBaseNarrative') {
                    //     continue;
                    // }
                    if (template)
                        var item = template(item);
                    else
                        var item = rowTemplate(item);

                    rows.append(item);
                }
                return rows;
            }

            function addFilters(view, workspaces, data, container, filterContainer) {
                var wsList = workspaces;
                // possible filter inputs
                var type, ws, query;

                // create filter (search)
                var filterInput = $('<input type="text" class="form-control kb-import-search" placeholder="Search data...">');
                var searchFilter = $('<div class="col-sm-4">').append(filterInput);

                // create workspace filter
                var wsInput = $('<select class="form-control kb-import-filter">');
                wsInput.append('<option>All Narratives...</option>');
                for (var i=0; i < wsList.length; i++) {
                    wsInput.append('<option data-id="'+[i].id+'" data-name="'+wsList[i].name+'">'+
                                          wsList[i].displayName+
                                   '</option>');
                }
                var wsFilter = $('<div class="col-sm-4">').append(wsInput);

                // event for ws dropdown
                wsInput.change(function() {
                    ws = $(this).children('option:selected').data('name');
                    filterInput.val('');
                    // request again with filted type
                    setLoading(view, true);

                    getAndRenderData(view, workspaces, type, ws);
                });

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
                    setLoading(view, true);
                    getAndRenderData(view, workspaces, type, ws);
                });

                // event for filter (search)
                filterInput.keyup(function(e) {
                    query = $(this).val();
                    setLoading(view, true);
                    var dataToFilter = sharedData;
                    if (view === 'mine') 
                        dataToFilter = myData;
                    var filtered = filterData(dataToFilter, {type: type, ws:ws, query:query})
                    render(view, filtered, container, []);
                });

                var $refreshBtnDiv = $('<div>').addClass('col-sm-1').css({'text-align':'center'}).append(
                                        $('<button>')
                                            .css({'margin-top':'12px'})
                                            .addClass('btn btn-xs btn-default')
                                            .click(function(event) {
                                                container.empty();
                                                setLoading(view, true);
                                                updateView(view);
                                            })
                                            .append($('<span>')
                                                .addClass('glyphicon glyphicon-refresh')));
                filterContainer.empty()
                               .append(searchFilter, typeFilter, wsFilter, $refreshBtnDiv);
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

                var $date = $('<span>').addClass("kb-data-list-date").append(TimeFormat.getTimeStampStr(object_info[3]));
                var $byUser = $('<span>').addClass("kb-data-list-edit-by");
                if (object_info[5] !== self.my_user_id) {
                    $byUser.append(' by '+object_info[5])
                        .click(function(e) {
                            e.stopPropagation();
                            window.open(Config.url('profile_page') + object_info[5]);
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
                                            window.open('/#objgraphview/'+object_info[7]+'/'+object_info[1]);
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

            function setHeaderMessage(view, message) {
                var messageHeader = $sharedMessageHeader;
                if (view === 'mine') {
                    messageHeader = $mineMessageHeader;
                }
                if (message) {
                    messageHeader.find('#kb-data-panel-msg').html(message);
                    messageHeader.show();
                }
                else {
                    messageHeader.hide();
                }
            }

            function updateProgress(view, progress) {
                if (view === 'mine')
                    mineLoadingDiv.setValue(progress);
                else
                    sharedLoadingDiv.setValue(progress);
            }

            // the existing .loading() .rmLoading() puts the loading icon in the wrong place
            function setLoading(view, show) {
                var container = $sharedContentPanel,
                    loader = sharedLoadingDiv;
                if (view === 'mine') {
                    container = $mineContentPanel;
                    loader = mineLoadingDiv;
                }

                if (show) {
                    container.hide();
                    loader.loader.show();
                }
                else {
                    loader.loader.hide();
                    loader.reset();
                    container.show();
                }
            }

            function objURL(module, type, ws, name) {
                return self.options.lp_url+ws+'/'+name;
            }

            return {
                updateView: updateView
            };
        },

        currentWsIsTemp: function() {
            this.$myDataHeader.empty();
            this.$myDataHeader.css({'color': '#777', 'margin': '10px 10px 0px 10px'});
            this.$myDataHeader.append(this.myDataTempNarrativeMsg);
        }

    });

});
