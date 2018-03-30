/*global define,Workspace*/
/*jslint white: true*/
/*eslint-env browser*/

/**
 * Widget to display a table of data objects from a kbase workspace.
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
define([
    'kbwidget',
    'jquery',
    'underscore',
    'bluebird',
    'narrativeConfig',
    'util/timeFormat',
    'base/js/namespace',
    'kbaseNarrative',
    'kbaseNarrativeControlPanel',
    'kbaseNarrativeDataList',
    'kbaseNarrativeSidePublicTab',
    'kbaseNarrativeSideImportTab',
    'kbaseNarrativeExampleDataTab',
    'kbaseNarrativeStagingDataTab',
    'kbase-generic-client-api',
    'util/bootstrapDialog',
    'kbase/js/widgets/narrative_core/kbaseDataCard',
    'common/runtime',
    'bootstrap'
], function (
    KBWidget,
    $,
    _,
    Promise,
    Config,
    TimeFormat,
    Jupyter,
    kbaseNarrative,
    kbaseNarrativeControlPanel,
    kbaseNarrativeDataList,
    kbaseNarrativeSidePublicTab,
    kbaseNarrativeSideImportTab,
    kbaseNarrativeExampleDataTab,
    kbaseNarrativeStagingDataTab,
    GenericClient,
    BootstrapDialog,
    kbaseDataCard,
    Runtime
) {
    'use strict';

    /*
      as a bit of trivia, in case it comes up....

      I'm pretty sure this could have a race condition which is not currently manifesting.
      It rebuilds the list of knownTypes inside the getAndRenderData, which is called when
      the filtering params are changed or the tab is changed w/o having data already.

      But the list of knownTypes is variable across panes - for example, My Data and Shared With Me
      may have different sets of types. Right now everything works just fine because the lists of types
      are refreshed at appropriate times, and the input on an inactive pane doesn't rebuild its typeInput
      field due to action on an active pane. So we're good. At least, I think we are.

      However, it's easy to come up with a scenario where a list may be properly refreshed on a given pane and
      reflects incorrect data. So in case anybody starts complaining about the list of types not matching their
      data, this is probably the cause and should be revisited. For now, I'm going to sweep it under the rug.
    */

    var knownTypes = [];

    return KBWidget({
        name: 'kbaseNarrativeDataPanel',
        parent: kbaseNarrativeControlPanel,
        version: '1.0.0',
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
            notLoggedInMsg: 'Please log in to view Narrative data.',
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
        myDataTempNarrativeMsg: 'Warning! This Narrative is temporary (untitled). ' +
            'Data of temporary Narratives is not visible on this tab. Please change ' +
            'the name of the Narrative to make it permanent.',
        renderedTabs: [false, false, false, false, false],


        init: function (options) {
            this._super(options);

            this.ws_name = Jupyter.narrative.getWorkspaceName();

            var icons = Config.get('icons');
            this.data_icons = icons.data;
            this.icon_colors = icons.colors;

            var $dataList = $('<div>');
            this.body().append($dataList);
            this.dataListWidget =
                new kbaseNarrativeDataList($dataList, {
                    ws_name: this.ws_name,
                    parentControlPanel: this,
                    slideTime: this.slideTime
                });

            /**
             * This should be triggered if something wants to know what data is loaded from the current workspace
             */
            $(document).on(
                'dataLoadedQuery.Narrative', $.proxy(function (e, params, ignoreVersion, callback) {
                    var obj_data = this.dataListWidget.getObjData(params, ignoreVersion);
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
                'updateData.Narrative', function () {
                    this.dataListWidget.refresh();
                }.bind(this)
            );

            /**
             * This should be triggered when something wants to know what workspace this widget is currently linked to.
             */
            $(document).on(
                'workspaceQuery.Narrative', function (e, callback) {
                    if (callback) {
                        callback(this.ws_name);
                    }
                }.bind(this)
            );

            $(document).on(
                'sidePanelOverlayShown.Narrative', function () {
                    // find the index of what tab is being shown.
                    if (this.$overlayPanel.is(':visible')) {
                        var idx = $('.kb-side-overlay-container').find('.kb-side-header.active').index();
                        this.updateSlideoutRendering(idx);
                    }
                }.bind(this)
            );

            $(document).on('deleteDataList.Narrative', $.proxy(function (event, data) {
                this.loadedData[data] = false;
                var className = '.' + data.split('.').join('--');
                $(className).html('');
                $(className).append($('<span>').addClass('fa fa-chevron-circle-left'))
                    .append(' Add');
            }, this));

            // note how many times we've clicked on the data browser slideout button.
            var numDataBrowserClicks = 0;

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
                .click(function () {
                    this.$slideoutBtn.children().toggleClass('fa-arrow-right fa-arrow-left');
                    this.$slideoutBtn.tooltip('hide');
                    this.trigger('hideGalleryPanelOverlay.Narrative');
                    this.trigger('toggleSidePanelOverlay.Narrative', this.$overlayPanel);

                    // NOTE - this will be missed and a widget will remain active if the panel is closed by means other than clicking this button.
                    // This should be re-visited at some point.
                    this.deactivateLastRenderedPanel();

                    //once we've clicked it 10 times, meaning we've open and shut the browser 5x, we reveal its TRUE NAME.
                    if (++numDataBrowserClicks >= 10) {
                        this.$slideoutBtn.attr('data-original-title', 'Hide / Show Slidey McSliderface');
                    }
                }.bind(this));

            this.addButton(this.$slideoutBtn);

            return this;
        },
        setReadOnlyMode: function (readOnly) {
            this.$elem.css({'height': (readOnly ? '100%' : '50%')});
            if (readOnly) {
                this.$slideoutBtn.hide();
                this.dataListWidget.$addDataButton.hide();
            } else {
                this.$slideoutBtn.show();
                this.dataListWidget.$addDataButton.show();
            }
        },
        setListHeight: function (height, animate) {
            if (this.dataListWidget) {
                this.dataListWidget.setListHeight(height, animate);
            }
        },
        addButtonToControlPanel: function ($btn) {
            this.addButton($btn);
        },
        /**
         * @method loggedInCallback
         * This is associated with the login widget (through the kbaseAuthenticatedWidget parent) and
         * is triggered when a login event occurs.
         * It associates the new auth token with this widget and refreshes the data panel.
         * @private
         */
        loggedInCallback: function (event, auth) {
            this.token = auth.token;
            this.wsClient = new Workspace(this.options.workspaceURL, auth);

            this.serviceClient = new GenericClient(Config.url('service_wizard'), auth);
            this.isLoggedIn = true;
            if (this.ws_name) {
                this.importerThing = this.dataImporter(this.ws_name);

                this.tabMapping = [
                  {
                    widget : this.importerThing,
                    render : function () {
                        this.importerThing.updateView('mine', this.ws_name);
                    }.bind(this),
                  },
                  {
                    widget : this.importerThing,
                    render : function () {
                        this.importerThing.updateView('shared', this.ws_name);
                    }.bind(this),
                  },
                  {
                    widget : this.publicTab,
                    render : function () {
                        this.publicTab.render();
                    }.bind(this),
                  },
                  {
                    widget : this.exampleTab,
                    render : function () {
                        this.exampleTab.getExampleDataAndRender();
                    }.bind(this),
                  },
                  { render : function() {} },
                ];

                if (Config.get('features').stagingDataViewer) {
                    this.tabMapping.push(
                      {
                        widget : this.stagingTab,
                        render : function () {
                            this.stagingTab.updateView();
                        }.bind(this)
                      }
                    );
                }

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
        loggedOutCallback: function (event, auth) {
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
        setNarrWs: function (obj) {
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
        refresh: function () {
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
        getLoadedData: function (type, ignoreVersion) {
            if (this.dataListWidget) {
                return this.dataListWidget.getObjData(type, ignoreVersion);
            } else {
                return {};
            }
        },

        getDataObjectByName: function(name) {
            if (this.dataListWidget) {
                return this.dataListWidget.getDataObjectByName(name);
            }
        },

        getDataObjectByRef: function(ref, asObject) {
            if (this.dataListWidget) {
                return this.dataListWidget.getDataObjectByRef(ref, asObject);
            }
        },

        buildTabs: function (tabs, isOuter) {

            var $header = $('<div style="background-color: #2196F3">');
            var $body = $('<div>');

            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                $header.append($('<div>')
                    .addClass('kb-side-header')
                    .css('width', (100 / tabs.length) + '%')
                    .append(tab.tabName));
                $body.append($('<div>')
                    .addClass('kb-side-tab')
                    .append(tab.content));
            }

            $header.find('div').click($.proxy(function (event) {
                event.preventDefault();
                event.stopPropagation();
                var $headerDiv = $(event.currentTarget);

                if (!$headerDiv.hasClass('active')) {
                    var idx = $headerDiv.index();
                    $header.find('div').removeClass('active');
                    $headerDiv.addClass('active');
                    $body.find('div.kb-side-tab').removeClass('active');
                    $body.find('div:nth-child(' + (idx + 1) + ').kb-side-tab').addClass('active');
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

        deactivateLastRenderedPanel : function() {
          if (this.$lastRenderedWidget && this.$lastRenderedWidget.deactivate) {
            this.$lastRenderedWidget.deactivate();
            this.$lastRenderedWidget = undefined;
          }
        },

        updateSlideoutRendering: function (panelIdx) {

            this.deactivateLastRenderedPanel();

            if (!this.renderedTabs[panelIdx]) {
                this.tabMapping[panelIdx].render();
                this.renderedTabs[panelIdx] = true;
            }
            var $widget = this.tabMapping[panelIdx].widget;
            if ($widget && $widget.activate) {
              $widget.activate();
            }

            this.$lastRenderedWidget = $widget;
        },
        /**
         * Renders the data importer panel
         * I'm throwing this here because I have no idea how to
         * bind a sidepanel to a specific widget, since all the other panels "inherit" these widgets.
         */
        dataImporter: function (narWSName) {
            var self = this;
            var maxObjFetch = Config.get('data_panel').ws_max_objs_to_fetch || 30000;

            var user = Jupyter.narrative.userId;

            // models
            var myData = [],
                sharedData = [];

            var myWorkspaces = [],
                sharedWorkspaces = [];

            // model for selected objects to import
            var mineSelected = [],
                sharedSelected = [];

            // tab panels
            var minePanel = $('<div class="kb-import-content kb-import-mine">'),
                sharedPanel = $('<div class="kb-import-content kb-import-shared">'),
                publicPanel = $('<div class="kb-import-content kb-import-public">'),
                // importPanel = $('<div class="kb-import-content kb-import-import">'),
                examplePanel = $('<div class="kb-import-content">'),
                stagingPanel = $('<div class="kb-import-content">');

            var tabList = [
                {tabName: '<small>My Data</small>', content: minePanel},
                {tabName: '<small>Shared With Me</small>', content: sharedPanel},
                {tabName: '<small>Public</small>', content: publicPanel},
                {tabName: '<small>Example</small>', content: examplePanel},
                // {tabName: '<small>Import</small>', content: importPanel},
            ];

            if (Config.get('features').stagingDataViewer) {
                tabList.push({tabName: '<small>Import<small>', content: stagingPanel});
            }

            // add tabs
            var $tabs = this.buildTabs(tabList);


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
                    .click(function () {
                        $mineMessageHeader.slideUp(400);
                    }))
                .append($('<span id="kb-data-panel-msg">'))
                .hide();
            var $mineContentPanel = $('<div>');
            var mineLoadingDiv = createLoadingDiv();
            var $mineFilterRow = $('<div class="row">');
            var $mineScrollPanel = $('<div>').css({'overflow-x': 'hidden', 'height': '550px', 'overflow-y': 'auto'});
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
            var btn = $('<button class="btn btn-primary pull-right" disabled>Add to Narrative</button>').css({'margin': '10px'});
            var closeBtn = $('<button class="kb-default-btn pull-right">Close</button>').css({'margin': '10px'});


            function createLoadingDiv() {
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
                    .css({margin: '15px', 'margin-left': '35px', 'height': '550px'})
                    .append($('<div class="progress">').append($progressBar))
                    .hide();

                var setValue = function (value) {
                    if (value >= minValue) {
                        $progressBar.css('width', value + '%')
                            .attr('aria-valuenow', value);
                    }
                };

                var reset = function () {
                    setValue(minValue);
                };

                return {
                    loader: $loadingDiv,
                    progressBar: $progressBar,
                    setValue: setValue,
                    reset: reset
                };
            }

            // Setup the panels that are defined by widgets
            //new kbaseNarrativeMyDataTab(minePanel, {ws_name: this.ws_name});
            //new kbaseNarrativeSharedDataTab(sharedPanel, {ws_name: this.ws_name});

            this.publicTab = new kbaseNarrativeSidePublicTab(publicPanel, {$importStatus: importStatus, ws_name: this.ws_name});
            // this.importTab = new kbaseNarrativeSideImportTab(importPanel, {ws_name: this.ws_name});
            this.exampleTab = new kbaseNarrativeExampleDataTab(examplePanel, {$importStatus: importStatus, ws_name: this.ws_name});
            if (Config.get('features').stagingDataViewer) {
                this.stagingTab = new kbaseNarrativeStagingDataTab(stagingPanel);
            }

            // It is silly to invoke a new object for each widget
            var auth = {token: Runtime.make().authToken()};
            var ws = new Workspace(this.options.workspaceURL, auth);
            var serviceClient = new GenericClient(Config.url('service_wizard'), auth);

            closeBtn.click(function () {
                self.$slideoutBtn.children().toggleClass('fa-arrow-right fa-arrow-left');
                self.trigger('hideSidePanelOverlay.Narrative');
            });
            footer.append(closeBtn);

            // start with my data, then fetch other data
            // this is because data sets can be large and
            // makes things more fluid

            var narrativeNameLookup = {};
            this.$overlayPanel = body.append(footer);

            function cleanupData(data, view) {
                return Promise.try(function () {
                    // data = [].concat.apply([], data);
                    data.sort(function (a, b) {
                        // enable this if desired - it changes the sort to be by the alphabetical type first, and then the creation date
                        /*if (
                          a[2].match(/\.([^-]+)/)[1] < b[2].match(/\.([^-]+)/)[1]
                          || (a[2].match(/\.([^-]+)/)[1] === b[2].match(/\.([^-]+)/)[1] && a[3] > b[3]))
                        */
                        if (a[3] > b[3])
                            return -1;
                        return 1;
                    });

                    return data;
                });
            }

            function getAndRenderData(view, workspaces, types, specWs, ignoreWs, nameFilter) {
                return getData(view, workspaces, types, specWs, ignoreWs, nameFilter)
                    .then(function (data) {
                        return cleanupData(data, view);
                    })
                    .then(function (data) {
                        var dataTypes = {};
                        data.forEach(function(datum) {
                          var match = datum[2].match(/([^.]+)\.([^-]+)/)
                          var module = match[1];
                          var type = match[2];
                          if (dataTypes[type] === undefined) {
                            dataTypes[type] = {};
                          }
                          dataTypes[type][module + '.' + type] = true;
                        });
                        knownTypes = dataTypes;
                        if (view === 'mine') {
                            myData = data;
                            render(view, myData, $mineScrollPanel, mineSelected);
                        } else {
                            sharedData = data;
                            render(view, sharedData, $sharedScrollPanel, sharedSelected);
                        }
                    })
                    .catch(function (error) {
                        console.error('ERROR while rendering data...', error);
                    });
            }

            function updateView(view, ignoreWs) {
                getWorkspaces(view, ignoreWs)
                    .then(function (workspaces) {
                        if (view === 'mine')
                            myWorkspaces = workspaces;
                        else
                            sharedWorkspaces = workspaces;
                        return getAndRenderData(view, workspaces, undefined, undefined, ignoreWs, undefined);
                    })
                    .then(function () {
                        if (view === 'mine')
                            addFilters(view, myWorkspaces, myData, $mineScrollPanel, $mineFilterRow);
                        else
                            addFilters(view, sharedWorkspaces, sharedData, $sharedScrollPanel, $sharedFilterRow);
                    })
                    .catch(function (error) {
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
                    .then(function (d) {
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
                            } else if (d[i][8].show_in_narrative_data_panel &&
                                d[i][8].show_in_narrative_data_panel === '1') {
                                displayName = '(data only) ' + displayName;
                            } else {
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
                        workspaces.sort(function (a, b) {
                            // don't really care if they're equal...
                            if (a.displayName.toUpperCase() < b.displayName.toUpperCase())
                                return -1;
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
            function getData(view, workspaces, types, wsName, ignoreWs, nameFilter) {
                if (workspaces.length === 0) {
                    return Promise.try(function () {
                        return [];
                    });
                }
                var params = {includeMetadata: 1},
                    wsIds = [],
                    objCount = 0,
                    maxObjCount = 0;

                // first pass, get set of wsids and their counts
                var wsIdsToCounts = [];
                for (var i = 0; i < workspaces.length; i++) {
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
                        for (var n = 0; n < thisWs.legacy.length; n++) {
                            var w = thisWs.legacy[n];
                            if (w.count > 0) {
                                wsIdsToCounts.push({id: w.id, count: w.count});
                            }
                        }
                    }
                }

                if (wsIdsToCounts.length === 0) {
                    return Promise.try(function () {
                        return [];
                    });
                }

                // sort wsids by their counts in ascending order
                wsIdsToCounts.sort(function (a, b) {
                    return a.count - b.count;
                });

                var newParamSet = function (start) {
                    var param = {
                        workspaces: []
                    };
                    if (start.type)
                        param.types = [start.type];
                    if (start.types)
                      param.types = start.types;
                    if (start.id)
                        param.workspaces.push(start.id);
                    return param;
                };

                // Construct all data requests below.
                // This grabs everything into the client for now,
                // until we have some server-side searching.
                var paramsList = [],
                    curParam = newParamSet({types: types}),
                    curTotal = 0,
                    maxRequest = Config.get('data_panel').max_single_request || 1000,
                    totalFetch = 0;

                // Set up all possible requests. We'll break out of
                // the request loop in below
                for (var i = 0; i < wsIdsToCounts.length; i++) {
                    var thisWs = wsIdsToCounts[i];
                    totalFetch += thisWs.count;

                    // if there's room in the request for this
                    // ws, put it there, and boost the total
                    if (curTotal + thisWs.count < maxRequest) {
                        curParam.workspaces.push(String(thisWs.id));
                        curTotal += thisWs.count;
                    }
                    // if there isn't room, but ws isn't gonna
                    // blow over another request size, then
                    // finish this request and start a new one with
                    // this ws
                    else if (thisWs.count < maxRequest) {
                        paramsList.push(curParam);
                        curParam = newParamSet({types: types, id: String(thisWs.id)});
                        curTotal = thisWs.count;
                    }
                    // if there isn't room because that's one big
                    // honker of a workspace, then it gets its
                    // own set of requests. Yes, this is probably
                    // kinda inefficient. Don't care.
                    else if (thisWs.count > maxRequest) {
                        for (var j = 0; j < thisWs.count; j += maxRequest) {
                            var newParam = newParamSet({types: types, id: String(thisWs.id)});
                            newParam.minObjectID = j + 1;
                            newParam.maxObjectID = j + maxRequest;
                            paramsList.push(newParam);
                        }
                    }
                }
                // at the tail end, push that last completed param set
                if (curParam.workspaces.length > 0)
                    paramsList.push(curParam);

                if (objCount > maxObjFetch)
                    console.error('User\'s object count for owned workspaces was', objCount);

                var headerMessage = '';
                var requestCounter = 0;
                return Promise.reduce(paramsList, function (dataList, param) {
                    requestCounter++;
                    var progress = Math.floor(requestCounter / paramsList.length * 100);
                    updateProgress(view, progress);
                    if (dataList.length >= maxObjFetch) {
                        return Promise.try(function () {
                            updateProgress(view, 100);
                            return dataList;
                        });
                    } else {
                        return Promise.resolve(serviceClient.sync_call(
                            'NarrativeService.list_objects_with_sets',
                            [param]
                        )).then(function (data) {
                            data = data[0]['data'];
                            // filter out Narrative objects.
                            for (var i = 0; i < data.length && dataList.length < maxObjFetch; i++) {
                                if (data[i].object_info[2].startsWith('KBaseNarrative'))
                                    continue;
                                else
                                    dataList.push(data[i].object_info);
                            }
                            return dataList;
                        });
                    }
                }, []);
            }

            // This function takes data to render and
            // a container to put data in.
            // It produces a scrollable dataset
            function render(view, data, container, selected, template) {

                var setDataIconTrigger = $._data($(document)[0], 'events')['setDataIcon'];
                if (setDataIconTrigger) {
                    renderOnIconsReady(view, data, container, selected, template);
                } else {
                    setTimeout(function () {
                        renderOnIconsReady(view, data, container, selected, template);
                    }, 100);
                }
            }
            function renderOnIconsReady(view, data, container, selected, template) {
                var headerMessage = '';
                if (data.length >= maxObjFetch) {
                    headerMessage = 'You have access to over <b>' + maxObjFetch + '</b> data objects, so we\'re only showing a sample. Please use the Types or Narratives selectors above to filter.';
                }
                setHeaderMessage(view, headerMessage);

                var start = 0, numRows = 30;

                // remove items from only current container being rendered
                container.empty();

                if (data.length == 0) {
                    container.append($('<div>').addClass('kb-data-list-type').css({margin: '15px', 'margin-left': '35px'}).append('No data found'));
                    setLoading(view, false);
                    return;
                }

                var rows = buildMyRows(data, start, numRows, template);
                container.append(rows);
                events(container, selected);

                if (rows.children().length == 0) {
                    container.append($('<div>').addClass('kb-data-list-type').css({margin: '15px', 'margin-left': '35px'}).append('No data found'));
                    setLoading(view, false);
                    return;
                }

                // infinite scroll
                var currentPos = numRows;
                container.unbind('scroll');
                container.on('scroll', function () {
                    if ($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight && currentPos < data.length) {
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
                    if (types.indexOf(mod_type) == -1)
                        types.push(mod_type);
                }
                return types;
            }

            function copyObjects(objs, nar_ws_name) {
                importStatus.html('Adding <i>' + objs.length + '</i> objects to narrative...');

                var proms = [];
                for (var i in objs) {
                    var ref = objs[i].ref;
                    var name = objs[i].name;
                    proms.push(
                        serviceClient.sync_call(
                            'NarrativeService.copy_object',
                            [{
                                ref: ref,
                                target_ws_name: nar_ws_name
                            }]
                        )
                    );
                }
                return proms;
            }


            function events(panel, selected) {
                panel.find('.kb-import-item').unbind('click');
                panel.find('.kb-import-item').click(function () {
                    var item = $(this);
                    var ref = item.data('ref').replace(/\./g, '/');
                    var name = item.data('obj-name');

                    var checkbox = $(this).find('.kb-import-checkbox');
                    checkbox.toggleClass('fa-check-square-o')
                        .toggleClass('fa-square-o');

                    // update model for selected items
                    if (checkbox.hasClass('fa-check-square-o')) {
                        selected.push({ref: ref, name: name});
                    } else {
                        for (var i = 0; i < selected.length; i++) {
                            if (selected[i].ref == ref)
                                selected.splice(i, 1);
                        }
                    }

                    // disable/enable button
                    if (selected.length > 0)
                        btn.prop('disabled', false);
                    else
                        btn.prop('disabled', true);

                    // import items on button click
                    btn.unbind('click');
                    btn.click(function () {
                        if (selected.length == 0)
                            return;

                        //uncheck all checkboxes, disable add button
                        $('.kb-import-checkbox').removeClass('fa-check-square-o', false);
                        $('.kb-import-checkbox').addClass('fa-square-o', false);
                        $(this).prop('disabled', true);

                        var proms = copyObjects(selected, narWSName);
                        $.when.apply($, proms).done(function (data) {
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
                panel.find('.kb-import-item').hover(function () {
                    $(this).find('hr').css('visibility', 'hidden');
                    $(this).prev('.kb-import-item').find('hr').css('visibility', 'hidden');
                    $(this).find('.kb-import-checkbox').css('opacity', '.8');
                }, function () {
                    $(this).find('hr').css('visibility', 'visible');
                    $(this).prev('.kb-import-item').find('hr').css('visibility', 'visible');
                    $(this).find('.kb-import-checkbox').css('opacity', '.4');
                });

                // prevent checking when clicking link
                panel.find('.kb-import-item a').unbind('click');
                panel.find('.kb-import-item a').click(function (e) {
                    e.stopPropagation();
                });

            }

            function filterData(data, f) {
                if (data.length == 0)
                    return [];

                // if we're at our limit for what to load,
                // then the filter should go against list_objects.
                // send the filter there and re-render.
                // ...actually, that won't work because it only
                // returns names. no-op for now.

                var filteredData = [];
                // add each item to view
                for (var i = 0; i < data.length; i < i++) {
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
                        } else if (kind.toLowerCase().indexOf(query) >= 0) {
                            filteredData.push(obj);
                        } else if (obj[5].toLowerCase().indexOf(query) >= 0) {
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


            function buildMyRows (data, start, numRows, template) {
                // add each set of items to container to be added to DOM
                var rows = $('<div class="kb-import-items">');
                var loadedData = {};
                $(document).trigger('dataLoadedQuery.Narrative', [
                    false, 0,
                    function (data) {
                        Object.keys(data).forEach(function (type) {
                            data[type].forEach(function (obj) {
                                var name = obj[1];
                                loadedData[name] = true;
                            });
                        });
                    }
                ]);
                for (var i = start; i < Math.min(start + numRows, data.length); i++) {
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
                        relativeTime: TimeFormat.getTimeStampStr(obj[3])}; //use the same one as in data list for consistencey  kb.ui.relativeTime( Date.parse(obj[3]) ) }

                    // if (item.module=='KBaseNarrative') {
                    //     continue;
                    // }
                    if (template){
                        item = template(item);
                    }
                    else
                        item = rowTemplate(item, loadedData);

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
                for (var i = 0; i < wsList.length; i++) {
                    wsInput.append('<option data-id="' + [i].id + '" data-name="' + wsList[i].name + '">' +
                        wsList[i].displayName +
                        '</option>');
                }
                var wsFilter = $('<div class="col-sm-4">').append(wsInput);

                // event for ws dropdown
                wsInput.change(function () {
                    ws = $(this).children('option:selected').data('name');
                    filterInput.val('');
                    // request again with filted type
                    setLoading(view, true);

                    getAndRenderData(view, workspaces, type, ws);
                });

                // create type filter
                var typeInput = $('<select class="form-control kb-import-filter">');
                typeInput.append('<option>All types...</option>');
                var typeKeys = Object.keys(knownTypes).sort();
                typeKeys.forEach( function(typeKey) {
                    typeInput.append('<option data-type="' + Object.keys(knownTypes[typeKey]).sort().join(',') + '">' +
                        typeKey +
                        '</option>');
                });
                var typeFilter = $('<div class="col-sm-3">').append(typeInput);

                // event for type dropdown
                typeInput.change(function () {
                    type = $(this).children('option:selected').data('type');
                    if (type) {
                      type = type.split(',');
                    }
                    filterInput.val('');
                    // request again with filted type
                    setLoading(view, true);
                    getAndRenderData(view, workspaces, type, ws);
                });

                // event for filter (search)
                filterInput.keyup(function (e) {
                    query = $(this).val();
                    setLoading(view, true);
                    var dataToFilter = sharedData;
                    if (view === 'mine')
                        dataToFilter = myData;
                    var filtered = filterData(dataToFilter, {type: type, ws: ws, query: query});
                    render(view, filtered, container, []);
                });

                var $refreshBtnDiv = $('<div>').addClass('col-sm-1').css({'text-align': 'center'}).append(
                    $('<button>')
                        .css({'margin-top': '12px'})
                        .addClass('btn btn-xs btn-default')
                        .click(function (event) {
                            container.empty();
                            setLoading(view, true);
                            updateView(view);
                        })
                        .append($('<span>')
                            .addClass('fa fa-refresh')));
                filterContainer.empty()
                    .append(searchFilter, typeFilter, wsFilter, $refreshBtnDiv);
            }

            function rowTemplate(obj, loadedData) {
                var object_info = obj.info;
                var landingPageLink = self.options.lp_url + object_info[6] + '/' + object_info[1];

                var metadata = object_info[10] || {};
                var metadataText = '';
                for (var key in metadata) {
                    if (metadata.hasOwnProperty(key)) {
                        metadataText += '<tr><th>' + key + '</th><td>' + metadata[key] + '</td></tr>';
                    }
                }
                var type_tokens = object_info[2].split('.');
                var type = type_tokens[1].split('-')[0];
                if (type === 'Genome' || type === 'GenomeAnnotation') {
                    if (metadata.hasOwnProperty('Name')) {
                        type = type + ': ' + metadata['Name'];
                    }
                }
                var narName = obj.ws;
                if (narrativeNameLookup[obj.ws]) {
                    narName = narrativeNameLookup[obj.ws];
                }
                var btnClasses = 'btn btn-xs btn-default';
                var $btnToolbar = $('<div>').addClass('btn-toolbar narrative-data-panel-btnToolbar');
                var $openLandingPage = $('<span>')
                    .addClass(btnClasses)
                    .append($('<span>').addClass('fa fa-binoculars'))
                    .click(function (e) {
                        e.stopPropagation();
                        window.open(landingPageLink);
                    });

                var $openProvenance = $('<span>')
                    .addClass(btnClasses)
                    //.tooltip({title:'View data provenance and relationships', 'container':'body'})
                    .append($('<span>').addClass('fa fa-sitemap fa-rotate-90'))
                    .click(function (e) {
                        e.stopPropagation();
                        window.open('/#objgraphview/' + object_info[7] + '/' + object_info[1]);
                    });
                $btnToolbar.append($openLandingPage).append($openProvenance);

                var name = object_info[1];

                var isCopy = loadedData && loadedData[name];
                var actionButtonText = (isCopy) ? ' Copy' : ' Add';

                var $card = kbaseDataCard.apply(self, [
                    {
                        narrative: narName,
                        actionButtonText: actionButtonText,
                        moreContent: $btnToolbar,
                        max_name_length: 50,
                        object_info: object_info,
                        ws_name: self.ws_name
                    }]);

                return $card;
            }

            function setHeaderMessage(view, message) {
                var messageHeader = $sharedMessageHeader;
                if (view === 'mine') {
                    messageHeader = $mineMessageHeader;
                }
                if (message) {
                    messageHeader.find('#kb-data-panel-msg').html(message);
                    messageHeader.show();
                } else {
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
                } else {
                    loader.loader.hide();
                    loader.reset();
                    container.show();
                }
            }

            function objURL(module, type, ws, name) {
                return self.options.lp_url + ws + '/' + name;
            }

            return {
                updateView: updateView
            };
        },
        currentWsIsTemp: function () {
            this.$myDataHeader.empty();
            this.$myDataHeader.css({'color': '#777', 'margin': '10px 10px 0px 10px'});
            this.$myDataHeader.append(this.myDataTempNarrativeMsg);
        }

    });

});
