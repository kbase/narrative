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
    'kbase/js/widgets/narrative_core/dataBrowser',
    'narrativeConfig',
    'base/js/namespace',
    'kbaseNarrative',
    'kbaseNarrativeControlPanel',
    'kbaseNarrativeDataList',
    'kbaseNarrativeSidePublicTab',
    'kbaseNarrativeExampleDataTab',
    'kbaseNarrativeStagingDataTab',
    'bootstrap'
], function (
    KBWidget,
    $,
    _,
    DataBrowser,
    Config,
    Jupyter,
    kbaseNarrative,
    kbaseNarrativeControlPanel,
    kbaseNarrativeDataList,
    kbaseNarrativeSidePublicTab,
    kbaseNarrativeExampleDataTab,
    kbaseNarrativeStagingDataTab,
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
            this.buildSlideoutPanel();

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
            // this.$elem.css({'height': (readOnly ? '100%' : '50%')});
            if (readOnly) {
                this.$slideoutBtn.hide();
                this.dataListWidget.$addDataButton.hide();
                this.toggleCollapse('expand');
            } else {
                this.$slideoutBtn.show();
                this.dataListWidget.$addDataButton.show();
                this.toggleCollapse('restore');
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
            this.isLoggedIn = true;
            if (this.ws_name) {
                this.tabMapping = [
                    {
                        widget : this.mineTab,
                        render : function () {
                            this.mineTab.updateView(true, true);
                        }.bind(this),
                    },
                    {
                        widget : this.sharedTab,
                        render : function () {
                            this.sharedTab.updateView(true, true);
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
        loggedOutCallback: function () {
            this.isLoggedIn = false;
            this.ws_name = null;
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

        currentWsIsTemp: function () {
            this.$myDataHeader.empty();
            this.$myDataHeader.css({'color': '#777', 'margin': '10px 10px 0px 10px'});
            this.$myDataHeader.append(this.myDataTempNarrativeMsg);
        },

        buildSlideoutPanel: function () {
            // tab panels
            let minePanel = $('<div class="kb-import-content kb-import-mine">'),
                sharedPanel = $('<div class="kb-import-content kb-import-shared">'),
                publicPanel = $('<div class="kb-import-content kb-import-public">'),
                examplePanel = $('<div class="kb-import-content">'),
                stagingPanel = $('<div class="kb-import-content">');

            let tabList = [
                {tabName: '<small>My Data</small>', content: minePanel},
                {tabName: '<small>Shared With Me</small>', content: sharedPanel},
                {tabName: '<small>Public</small>', content: publicPanel},
                {tabName: '<small>Example</small>', content: examplePanel},
            ];

            if (Config.get('features').stagingDataViewer) {
                tabList.push({tabName: '<small>Import<small>', content: stagingPanel});
            }

            // add tabs
            let $tabs = this.buildTabs(tabList);

            var body = $('<div>');
            var footer = $('<div>');
            body.addClass('kb-side-panel');
            body.append($tabs.header, $tabs.body);

            // add footer status container and buttons
            var importStatus = $('<div class="pull-left kb-import-status">');
            footer.append(importStatus);
            var btn = $('<button class="btn btn-primary pull-right" disabled>Add to Narrative</button>').css({'margin': '10px'});
            var closeBtn = $('<button class="kb-default-btn pull-right">Close</button>').css({'margin': '10px'});

            // Setup the panels that are defined by widgets
            this.mineTab = new DataBrowser(minePanel, {$importStatus: importStatus, ws_name: this.ws_name, dataSet: 'mine'});
            this.sharedTab = new DataBrowser(sharedPanel, {$importStatus: importStatus, ws_name: this.ws_name, dataSet: 'shared'});
            this.publicTab = new kbaseNarrativeSidePublicTab(publicPanel, {$importStatus: importStatus, ws_name: this.ws_name});
            this.exampleTab = new kbaseNarrativeExampleDataTab(examplePanel, {$importStatus: importStatus, ws_name: this.ws_name});
            if (Config.get('features').stagingDataViewer) {
                this.stagingTab = new kbaseNarrativeStagingDataTab(stagingPanel).render();
            }

            closeBtn.click(() => {
                this.$slideoutBtn.children().toggleClass('fa-arrow-right fa-arrow-left');
                this.trigger('hideSidePanelOverlay.Narrative');
            });
            footer.append(closeBtn);

            this.$overlayPanel = body.append(footer);
        }

    });

});
