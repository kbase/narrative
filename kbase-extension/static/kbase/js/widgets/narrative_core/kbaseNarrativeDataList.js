/**
 * @author Michael Sneddon <mwsneddon@lbl.gov>
 * @public
 */
define([
    'kbwidget',
    'jquery',
    'underscore',
    'bluebird',
    'base/js/namespace',
    'narrativeConfig',
    'util/string',
    'util/display',
    'util/timeFormat',
    'util/icon',
    'kbase-client-api',
    'kb_service/client/workspace',
    'kb_common/jsonRpc/genericClient',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kbaseAuthenticatedWidget',
    'kbaseNarrativeDownloadPanel',
    'common/runtime',
    'handlebars',
    'text!kbase/templates/data_list/object_row.html',
    'kb_service/utils',
    'util/bootstrapDialog',
    'util/bootstrapSearch',
    'kbase/js/widgets/narrative_core/kbaseDataCard',
    'api/dataProvider',
    'bootstrap',
    'jquery-nearest',
], (
    KBWidget,
    $,
    _,
    Promise,
    Jupyter,
    Config,
    StringUtil,
    DisplayUtil,
    TimeFormat,
    Icon,
    kbase_client_api,
    Workspace,
    GenericClient,
    DynamicServiceClient,
    kbaseAuthenticatedWidget,
    kbaseNarrativeDownloadPanel,
    Runtime,
    Handlebars,
    ObjectRowHtml,
    ServiceUtils,
    BootstrapDialog,
    BootstrapSearch,
    kbaseDataCard,
    DataProvider
) => {
    'use strict';

    return KBWidget({
        name: 'kbaseNarrativeDataList',
        parent: kbaseAuthenticatedWidget,
        version: '1.1.0',
        options: {
            ws_name: null, // must be the WS name, not the WS Numeric ID

            ws_url: Config.url('workspace'),
            lp_url: Config.url('landing_pages'),
            loadingImage: Config.get('loading_gif'),
            parentControlPanel: null,
            slideTime: 400,
        },
        // private variables
        runtime: Runtime.make(),
        mainListPanelHeight: '340px',
        refreshTimer: null,
        ws_name: null,
        ws: null,
        wsLastUpdateTimestamp: null,
        maxWsObjId: null,
        n_objs_rendered: 0,
        real_name_lookup: {},
        $searchInput: null,
        $filterTypeSelect: null,
        availableTypes: {},
        $searchDiv: null,
        $sortByDiv: null,
        $filterTypeDiv: null,
        $addDataButton: null,
        $controllerDiv: null,
        $mainListDiv: null,
        mainListId: null,
        $loadingDiv: null,
        objData: {}, // old style - type_name : info
        downloadSpecCache: { tag: 'dev' },
        controlClickHnd: {}, // click handlers for control buttons
        token: null,
        my_username: null,
        sortOrder: -1, // order for sorting the list. 1 = increasing, -1 = decreasing

        objectRowTmpl: Handlebars.compile(ObjectRowHtml),

        /** -----------------
         * Structural changes to support new view(s).
         * viewOrder = a list of object ids - which order to view (might make them references)
         * dataObjects = object id (or ref) -> object info
         * keyToObjId = key (uuid) -> obj id (int)
         */
        viewOrder: [], // { objId: int, rendered: boolean, filtered: boolean }
        dataObjects: {},
        keyToObjId: {},
        lastObjectRendered: 0,

        /* ----------------------------------------------------
            Changes for hierarchical data panel (KBASE-4566)
        */
        setItems: {}, // item_id -> {set_id -> 1, ..}
        setInfo: {}, // set_id -> { count: , div: , expanded: ,... }
        setViewMode: false, // Whether the panel is in hierarchy "mode"
        cachedSetItems: {}, // Items retrieved from a mega-call to list_sets
        dataIconParam: {},

        /*
        variables to keep track of current state before workspace refresh
        */
        selectedType: '',
        lastSortFunction: null,

        /**
         * Utility function to portably return the identifier to
         * use for a single data object.
         *
         * @param obj Info tuple from ws_list_objects
         * @return Identifier (string)
         */
        itemId: function (obj) {
            return obj[6] + '/' + obj[0];
        },

        writingLock: false,
        refreshwritingLock: null,

        /**
         * Test if given object is a set.
         * This simply tests whether that object is in the `setInfo` mapping.
         *
         * @param obj_info Object info tuple, as returned by ws.list_objects()
         * @return true if in a set, false otherwise
         */
        isASet: function (objInfo) {
            return this.setInfo[this.itemId(objInfo)] ? true : false;
        },

        /**
         * Returns true if in set view mode AND the object is a set.
         */
        isAViewedSet: function (objInfo) {
            if (this.setViewMode) {
                return this.isASet(objInfo);
            } else {
                return false;
            }
        },

        /**
         * Test if item is in a set.
         *
         * @param item_info an object info tuple, as returned by the
         *                  workspace API for list_objects()
         * @return true or false
         */
        inAnySet: function (item_info) {
            if (this.setViewMode) {
                const item_id = this.itemId(item_info);
                return _.has(this.setItems, item_id);
            } else {
                return false;
            }
        },

        getSetInfo: function (obj_info) {
            return this.setInfo[this.itemId(obj_info)];
        },

        /**
         * Get item parents.
         *
         * @param item_info an object info tuple, as returned by the
         *                  workspace API for list_objects()
         * @return All parents, expanded or not, as a mapping with
         *         the keys: (item_id, expanded, div).
         */
        getItemParents: function (item_info) {
            const item_id = this.itemId(item_info);
            // empty if not in ANY set
            if (!_.has(this.setItems, item_id)) {
                return [];
            }
            // Construct return value, which is one
            // map for each of the Sets.
            return _.map(_.keys(this.setItems[item_id]), (key) => {
                return {
                    item_id: key,
                    expanded: this.setInfo[key].expanded,
                    div: this.setInfo[key].div,
                };
            });
        },

        /**
         * Clear data structures tracking the workspace sets.
         * This will cause the next refresh to fetch new data.
         */
        clearSets: function () {
            this.setItems = {};
            this.setInfo = {};
        },

        itemIdsInSet: function (set_id) {
            if (this.setViewMode) {
                return this.setInfo[set_id].item_ids;
            } else {
                return [];
            }
        },

        /**
         * @method init
         * Builds the DOM structure for the widget.
         * Includes the tables and panel.
         * If any data was passed in (options.data), that gets shoved into the datatable.
         *
         * @param {Object} - the options set.
         * @returns {Object} this shiny new widget.
         * @private
         */
        init: function (options) {
            this._super(options);

            const dataConfig = Config.get('data_panel');
            // this is the limit of the number of objects to retrieve from the ws on each pass
            // note that if there are more objects than this, then sorts/search filters may
            // not show accurate results
            this.options.ws_chunk_size = dataConfig.ws_chunk_size;
            this.options.ws_max_objs_to_fetch = dataConfig.ws_max_objs_to_fetch;

            // initial number of rows to display
            this.options.objs_to_render_to_start = dataConfig.obj_render_initial;
            // number of rows to add when the user scrolls to the bottom, should be <=5,
            // much more and the addition of new rows becomes jerky
            this.options.objs_to_render_on_scroll = dataConfig.obj_render_scroll;

            //if there are more than this # of objs, user must click search
            //instead of updating as you type
            this.options.maxObjsToPreventFilterAsYouTypeInSearch =
                dataConfig.typeahead_search_limit;

            // initial sort makes loading slower, so we can turn it off if
            // there are more than this number of objects
            this.options.max_objs_to_prevent_initial_sort = dataConfig.initial_sort_limit;
            this.options.max_name_length = dataConfig.max_name_length;
            this.options.refresh_interval = dataConfig.refresh_interval_ms;

            this.$controllerDiv = $('<div>');
            this.$elem.append(this.$controllerDiv);
            this.renderController();

            this.loadingDiv = DisplayUtil.loadingDiv();
            this.loadingDiv.div.hide();
            this.loadingDiv.div.css({ top: '0', bottom: '0' });

            this.mainListId = StringUtil.uuid();
            this.$mainListDiv = $('<div id=' + this.mainListId + '>')
                .css({
                    'overflow-x': 'hidden',
                    'overflow-y': 'auto',
                    height: this.mainListPanelHeight,
                })
                .on('scroll', (event) => {
                    if (
                        $(event.target).scrollTop() + $(event.target).innerHeight() >=
                        event.target.scrollHeight
                    ) {
                        this.renderMore();
                    }
                });

            this.$addDataButton = $('<button>')
                .addClass('kb-data-list-add-data-button fa fa-plus fa-2x')
                .attr('aria-label', 'add data')
                .css({ position: 'absolute', bottom: '15px', right: '25px', 'z-index': '5' })
                .click(() => {
                    this.trigger('toggleSidePanelOverlay.Narrative', [
                        this.options.parentControlPanel.$overlayPanel,
                    ]);
                });
            const $mainListDivContainer = $('<div>')
                .css({ position: 'relative' })
                .append(this.loadingDiv.div)
                .append(this.$mainListDiv)
                .append(this.$addDataButton.hide());
            this.$elem.append($mainListDivContainer);

            if (this._attributes.auth) {
                this.token = this._attributes.auth.token;
                this.ws = new Workspace(this.options.ws_url, this._attributes.auth);
            }

            // listener for refresh
            $(document).on('updateDataList.Narrative', () => {
                this.refresh();
            });

            if (this.options.ws_name) {
                this.ws_name = this.options.ws_name;
            }

            this.wsId = this.runtime.workspaceId();

            return this;
        },

        destroy: function () {
            this.token = null;
            this.ws = null;
            this.isLoggedIn = false;
            this.my_username = null;
            $(document).off('updateDataList.Narrative');
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
                this.refreshTimer = null;
            }
        },

        setListHeight: function (height, animate) {
            if (this.$mainListDiv) {
                if (animate) {
                    this.$mainListDiv.animate({ height: height }, this.options.slideTime);
                } else {
                    this.$mainListDiv.css({ height: height });
                }
            }
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
            this.ws = new Workspace(this.options.ws_url, auth);
            this.my_username = auth.user_id;
            this.isLoggedIn = true;
            this.writingLock = false;
            this.refresh();
            return this;
        },

        /**
         * @method loggedOutCallback
         * Like the loggedInCallback, this is triggered during a logout event (through the login widget).
         * It throws away the auth token and workspace client, and refreshes the widget
         * @private
         */
        loggedOutCallback: function () {
            this.destroy();
        },

        showLoading: function (caption) {
            this.$mainListDiv.hide();
            this.loadingDiv.setText(caption || '');
            this.loadingDiv.div.show();
        },

        hideLoading: function () {
            this.loadingDiv.div.hide();
            this.$mainListDiv.show();
        },

        refresh: function (showError) {
            if (this.writingLock) {
                return Promise.resolve();
            }
            // Set the refresh timer on the first refresh. From  here, it'll refresh itself
            // every this.options.refresh_interval (30000) ms
            if (this.refreshTimer === null) {
                this.refreshTimer = setInterval(() => {
                    this.refresh();
                }, this.options.refresh_interval); // check if there is new data every X ms
            }

            if (!this.ws_name || !this.ws) {
                console.error('DataList: missing variable(s)');
                console.error('ws_name: ' + this.ws_name);
                console.error('ws: ' + this.ws);
                return Promise.resolve();
            }
            return Promise.resolve(
                this.ws.get_workspace_info({
                    workspace: this.ws_name,
                })
            )
                .then((wsInfo) => {
                    if (this.wsLastUpdateTimestamp !== wsInfo[3]) {
                        this.wsLastUpdateTimestamp = wsInfo[3];
                        this.maxWsObjId = wsInfo[4];
                        this.showLoading('Fetching data...');
                        return this.reloadWsData();
                    } else {
                        this.refreshTimeStrings();
                    }
                })
                .catch((error) => {
                    console.trace('dumping stacktrace!');
                    console.error('DataList: when checking for updates:', error);
                    if (showError) {
                        this.showBlockingError(
                            'Sorry, an error occurred while fetching your data.',
                            { error: 'Unable to connect to KBase database.' }
                        );
                    }
                });
        },

        refreshTimeStrings: function () {
            Object.keys(this.dataObjects).forEach((i) => {
                if (this.dataObjects[i].$div) {
                    const newTime = TimeFormat.getTimeStampStr(this.dataObjects[i].info[3]);
                    this.dataObjects[i].$div.find('.kb-data-list-date').text(newTime);
                }
            });
        },

        reloadWsData: function () {
            // empty the existing object list first
            this.objData = {};
            this.availableTypes = {};

            this.viewOrder = [];
            this.dataObjects = {};

            this.clearSets();

            return this.fetchWorkspaceData()
                .then(() => {
                    // Signal all data channel listeners that we have new data.
                    // TODO: only signal if there are actual changes
                    // TODO: data fetch and sychronization should live as a ui
                    // service, not in a widget.
                    const justInfo = Object.keys(this.dataObjects).map((objId) => {
                        return this.dataObjects[objId].info;
                    });
                    const objectInfoPlus = Object.keys(this.dataObjects).map((objId) => {
                        // see code below this function for the format of
                        // items in the dataObjects collection
                        const dataObject = this.dataObjects[objId];
                        const info = this.createInfoObject(dataObject.info);
                        dataObject.objectInfo = info;
                        info.dataPaletteRef = dataObject.refPath;
                        return info;
                    });
                    const data = JSON.parse(JSON.stringify(justInfo));
                    this.runtime.bus().set(
                        {
                            data: data,
                            timestamp: new Date().getTime(),
                            objectInfo: objectInfoPlus,
                        },
                        {
                            channel: 'data',
                            key: {
                                type: 'workspace-data-updated',
                            },
                        }
                    );
                })
                .then(() => {
                    this.showLoading('Rendering data...');
                    const numObj = Object.keys(this.dataObjects).length;
                    if (numObj > this.options.maxObjsToPreventFilterAsYouTypeInSearch) {
                        this.$searchInput.off('input');
                    }

                    if (numObj <= this.options.max_objs_to_prevent_initial_sort) {
                        this.viewOrder.sort((a, b) => {
                            const idA = a.objId,
                                idB = b.objId;
                            if (this.dataObjects[idA].info[3] > this.dataObjects[idB].info[3]) {
                                return -1;
                            }
                            if (this.dataObjects[idA].info[3] < this.dataObjects[idB].info[3]) {
                                return 1;
                            }
                            return 0;
                        });
                        this.$elem.find('#nar-data-list-default-sort-option').attr('checked');
                    }

                    this.populateAvailableTypes();
                    const typeSelected = this.$filterTypeSelect.val();
                    if (this.selectedType === 'filterTypeSelect') {
                        this.currentMatch = this.viewOrder;
                        this.filterByType(typeSelected);
                    } else if (this.selectedType === 'sortData') {
                        this.sortData(this.lastSortFunction);
                    } else {
                        this.renderList();
                        this.$elem.find('#nar-data-list-default-sort-label').addClass('active');
                    }
                    this.hideLoading();
                    this.trigger('dataUpdated.Narrative');
                });
        },

        /**
         * @method
         * @param {string} error - the error string to show
         *
         * This empties out the main data div and injects an error into it.
         * Used mainly when lookups fail.
         */
        showBlockingError: function (title, error) {
            this.$mainListDiv.empty();
            this.$mainListDiv.append(DisplayUtil.createError(title, error));
            this.loadingDiv.div.hide();
            this.$mainListDiv.show();
        },

        fetchWorkspaceData: function () {
            const addObjectInfo = (objInfo, dpInfo) => {
                // Get the object info
                const objId = this.itemId(objInfo);
                let fullDpReference = null;
                if (dpInfo && dpInfo.ref) {
                    fullDpReference =
                        dpInfo.ref + ';' + objInfo[6] + '/' + objInfo[0] + '/' + objInfo[4];
                }
                if (this.dataObjects[objId]) {
                    return;
                }
                const key = StringUtil.uuid();
                this.dataObjects[objId] = {
                    key: key,
                    $div: null,
                    info: objInfo,
                    attached: false,
                    fromPalette: this.wsId !== objInfo[6],
                    refPath: fullDpReference,
                };
                this.keyToObjId[key] = objId;
                this.viewOrder.push({
                    objId: objId,
                    inView: false,
                    inFilter: true,
                });

                // set the type -> object info structure
                const typeKey = objInfo[2].split('-')[0];
                if (!(typeKey in this.objData)) {
                    this.objData[typeKey] = [];
                }
                this.objData[typeKey].push(objInfo.concat(fullDpReference));

                // get the count of objects for each type
                const typeName = typeKey.split('.')[1];
                if (!(typeName in this.availableTypes)) {
                    this.availableTypes[typeName] = {
                        type: typeName,
                        count: 0,
                    };
                }
                this.availableTypes[typeName].count++;
            };

            const updateSetInfo = (obj) => {
                const setId = this.itemId(obj.object_info);
                obj.set_items.set_items_info.forEach((setItem) => {
                    const itemId = this.itemId(setItem);
                    if (!this.setInfo[setId]) {
                        this.setInfo[setId] = {
                            div: null,
                            expanded: false,
                            item_ids: [],
                        };
                    }
                    this.setInfo[setId].item_ids.push(itemId);
                    if (!this.setItems[itemId]) {
                        this.setItems[itemId] = {};
                    }
                    this.setItems[itemId][setId] = 1;
                    if (!this.dataObjects[itemId]) {
                        addObjectInfo(setItem, obj.dp_info);
                    }
                });
            };

            return DataProvider.getData(true)
                .then((objects) => {
                    objects.forEach((obj) => {
                        const objInfo = obj.object_info;
                        if (objInfo[2].indexOf('KBaseNarrative') === 0) {
                            if (objInfo[2].indexOf('KBaseNarrative.Narrative') === 0) {
                                Jupyter.narrative.checkDocumentVersion(objInfo);
                            }
                            return;
                        }
                        addObjectInfo(obj.object_info, obj.dp_info);
                        // if there's set info, update that.
                        if (obj.set_items) {
                            updateSetInfo(obj);
                        }
                    });
                })
                .catch((error) => {
                    this.showBlockingError(
                        'Sorry, an error occurred while fetching your data.',
                        error
                    );
                    console.error(error);
                    window.KBError(
                        'kbaseNarrativeDataList.fetchWorkspaceData',
                        error.error.message
                    );
                    throw error;
                });
        },

        /**
         * Returns the available object data for a type.
         * If no type is specified (type is falsy), returns all object data
         */
        getObjData: function (types) {
            if (types) {
                const dataSet = {};
                if (typeof types === 'string') {
                    types = [types];
                }
                for (const type of types) {
                    if (this.objData[type]) {
                        dataSet[type] = this.objData[type];
                    }
                }
                return dataSet;
            }
            return this.objData;
        },

        /**
         * Returns the object info for the given object.
         * if asObject is truthy, it will package this array up as an object and include the reference
         * path as key refPath.
         */
        getDataObjectByRef: function (ref, asObject) {
            if (!ref) {
                return null;
            }
            // if it's part of a ref chain, just get the last one
            if (ref.indexOf(';') >= 0) {
                const refSplit = ref.split(';');
                ref = refSplit[refSplit.length - 1];
            }
            // carve off the version, if present
            const refSegments = ref.split('/');
            if (refSegments.length < 2 || refSegments.length > 3) {
                return null;
            }
            ref = refSegments[0] + '/' + refSegments[1];
            let retVal = null;
            if (this.dataObjects[ref]) {
                retVal = this.dataObjects[ref].info;
                if (asObject) {
                    retVal = ServiceUtils.objectInfoToObject(retVal);
                    retVal.ws_id = retVal.wsid;
                    retVal.ref_path = this.dataObjects[ref].refPath;
                }
            }
            return retVal;
        },

        getDataObjectByName: function (name, wsId) {
            // means we gotta search. Oof.
            let objInfo = null;
            Object.keys(this.dataObjects).forEach((id) => {
                const obj = this.dataObjects[id];
                if (obj.info[1] === name) {
                    if (wsId) {
                        if (wsId === obj.info[6]) {
                            objInfo = obj.info;
                        }
                    } else {
                        objInfo = obj.info;
                    }
                }
            });
            return objInfo;
        },

        $currentSelectedRow: null,
        selectedObject: null,

        setSelected: function ($selectedRow, object_info) {
            if (this.$currentSelectedRow) {
                this.$currentSelectedRow.removeClass('kb-data-list-obj-row-selected');
            }
            if (object_info[0] === this.selectedObject) {
                this.$currentSelectedRow = null;
                this.selectedObject = null;
                this.trigger('removeFilterMethods.Narrative');
            }
        },

        showReportLandingPage: function (reportRef) {
            window.open('/#dataview/' + reportRef, '_blank');
        },

        makeToolbarButton: function (name) {
            const btnClasses = 'btn btn-xs btn-default';
            const btnCss = { color: '#888' };

            const $btn = $('<span>').addClass(btnClasses).css(btnCss);

            if (name) {
                $btn.attr('data-button', name);
            }

            return $btn;
        },

        filterMethodInputButton: function (objData) {
            return this.makeToolbarButton()
                .tooltip({
                    title: 'Show Apps with this as input',
                    container: '#' + this.mainListId,
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                })
                .append($('<span>').addClass('fa fa-sign-in'))
                .click(() => {
                    this.trigger(
                        'filterMethods.Narrative',
                        'input:' + objData.objectInfo.type.split('-')[0]
                    );
                });
        },

        filterMethodOutputButton: function (objData) {
            return this.makeToolbarButton()
                .tooltip({
                    title: 'Show Apps with this as output',
                    container: '#' + this.mainListId,
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                })
                .append($('<span>').addClass('fa fa-sign-out'))
                .click(() => {
                    this.trigger(
                        'filterMethods.Narrative',
                        'output:' + objData.objectInfo.type.split('-')[0]
                    );
                });
        },

        openLandingPageButton: function (objData, $alertContainer) {
            return this.makeToolbarButton()
                .tooltip({
                    title: 'Explore data',
                    container: '#' + this.mainListId,
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                })
                .append($('<span>').addClass('fa fa-binoculars'))
                .click((e) => {
                    e.stopPropagation();
                    $alertContainer.empty();
                    const landingPageLink = this.options.lp_url + objData.objectInfo.ref;
                    window.open(landingPageLink, '_blank');
                });
        },

        openReportButton: function () {
            return this.makeToolbarButton('report');
        },

        renderError: function ($alertContainer, message) {
            $alertContainer.empty();
            $alertContainer.append(
                $('<span>')
                    .css({ color: '#F44336' })
                    .append('Error! ' + message)
            );
        },

        openHistoryButton: function (objData, $alertContainer) {
            return this.makeToolbarButton()
                .tooltip({
                    title: 'View history to revert changes',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                })
                .append($('<span>').addClass('fa fa-history'))
                .click((e) => {
                    e.stopPropagation();
                    $alertContainer.empty();

                    if (this.ws_name && this.ws) {
                        this.ws.get_object_history(
                            { ref: objData.objectInfo.wsid + '/' + objData.objectInfo.id },
                            (history) => {
                                $alertContainer.append(
                                    $('<div>').append(
                                        $('<button>')
                                            .addClass('kb-data-list-cancel-btn')
                                            .append('Hide History')
                                            .click(() => {
                                                $alertContainer.empty();
                                            })
                                    )
                                );
                                history.reverse();
                                const $tbl = $('<table>').css({ width: '100%' });
                                for (const [historyItem, historyIndex] of history.items()) {
                                    const $revertBtn = $('<button>')
                                        .append('v' + historyItem[4])
                                        .addClass('kb-data-list-btn');
                                    if (historyIndex === 0) {
                                        $revertBtn.tooltip({
                                            title: 'Current Version',
                                            container: 'body',
                                            placement: 'bottom',
                                            delay: {
                                                show: Config.get('tooltip').showDelay,
                                                hide: Config.get('tooltip').hideDelay,
                                            },
                                        });
                                    } else {
                                        const revertRef = {
                                            wsid: historyItem[6],
                                            objid: historyItem[0],
                                            ver: historyItem[4],
                                        };
                                        ((revertRefLocal) => {
                                            $revertBtn
                                                .tooltip({
                                                    title: 'Revert to this version?',
                                                    container: 'body',
                                                    placement: 'bottom',
                                                    delay: {
                                                        show: Config.get('tooltip').showDelay,
                                                        hide: Config.get('tooltip').hideDelay,
                                                    },
                                                })
                                                .click(() => {
                                                    this.ws.revert_object(
                                                        revertRefLocal,
                                                        () => {
                                                            this.writingLock = false;
                                                            this.refresh();
                                                        },
                                                        (error) => {
                                                            console.error(error);
                                                            this.renderError(
                                                                $alertContainer,
                                                                error.error.message
                                                            );
                                                        }
                                                    );
                                                });
                                        })(revertRef);
                                    }
                                    $tbl.append(
                                        $('<tr>')
                                            .append($('<td>').append($revertBtn))
                                            .append(
                                                $('<td>').append(
                                                    'Saved by ' +
                                                        historyItem[5] +
                                                        '<br>' +
                                                        TimeFormat.getTimeStampStr(historyItem[3])
                                                )
                                            )
                                            .append(
                                                $('<td>')
                                                    .append(
                                                        $('<span>')
                                                            .css({ margin: '4px' })
                                                            .addClass('fa fa-info pull-right')
                                                    )
                                                    .tooltip({
                                                        title:
                                                            historyItem[2] +
                                                            '<br>' +
                                                            historyItem[8] +
                                                            '<br>' +
                                                            historyItem[9] +
                                                            ' bytes',
                                                        container: 'body',
                                                        html: true,
                                                        placement: 'bottom',
                                                        delay: {
                                                            show: Config.get('tooltip').showDelay,
                                                            hide: Config.get('tooltip').hideDelay,
                                                        },
                                                    })
                                            )
                                    );
                                }
                                $alertContainer.append($tbl);
                            },
                            (error) => {
                                console.error(error);
                                this.renderError($alertContainer, error.error.message);
                            }
                        );
                    }
                });
        },

        openProvenanceButton: function (objData, $alertContainer) {
            return this.makeToolbarButton()
                .tooltip({
                    title: 'View data provenance and relationships',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                })
                .append($('<span>').addClass('fa fa-sitemap fa-rotate-90'))
                .click((e) => {
                    e.stopPropagation();
                    $alertContainer.empty();
                    window.open('/#objgraphview/' + objData.objectInfo.ref);
                });
        },

        downloadButton: function (objData, ref_path, $alertContainer) {
            return this.makeToolbarButton()
                .tooltip({
                    title: 'Export / Download data',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                })
                .append($('<span>').addClass('fa fa-download'))
                .click((e) => {
                    e.stopPropagation();
                    $alertContainer.empty();
                    const type = objData.objectInfo.type.split('-')[0];
                    const wsId = objData.objectInfo.wsid;
                    const objId = objData.objectInfo.id;
                    const objRef = objData.fromPalette ? ref_path : wsId + '/' + objId;
                    const downloadPanel = $('<div>');
                    $alertContainer.append(downloadPanel);
                    new kbaseNarrativeDownloadPanel(downloadPanel, {
                        token: this._attributes.auth.token,
                        type: type,
                        objId: objId,
                        ref: objRef,
                        objName: objData.objectInfo.name,
                        downloadSpecCache: this.downloadSpecCache,
                    });
                });
        },

        renameButton: function (objData, $alertContainer) {
            return this.makeToolbarButton()
                .tooltip({
                    title: 'Rename data',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                })
                .append($('<span>').addClass('fa fa-font'))
                .click((e) => {
                    e.stopPropagation();
                    $alertContainer.empty();
                    if (Jupyter.narrative.readonly) {
                        $alertContainer.append(
                            $('<div>').append(
                                $('<span>')
                                    .append('Read-only Narrative - Cannot rename data object')
                                    .addClass('text-warning')
                            )
                        );
                        return;
                    }

                    //lock on refresh expires after 15 min
                    const releaseLock = () => {
                        if (this.refreshwritingLock !== null) {
                            clearTimeout(this.refreshwritingLock);
                        }

                        this.refreshwritingLock = setTimeout(() => {
                            this.writingLock = false;
                        }, 900000);
                    };
                    const $newNameInput = $('<input type="text">')
                        .addClass('form-control')
                        .val(objData.objectInfo.name)
                        .on('focus', () => {
                            if (Jupyter && Jupyter.narrative) {
                                this.writingLock = true;
                                Jupyter.narrative.disableKeyboardManager();
                            }
                        })
                        .on('blur', () => {
                            if (Jupyter && Jupyter.narrative) {
                                Jupyter.narrative.enableKeyboardManager();
                            }
                        });

                    $newNameInput.unbind('focus', releaseLock);
                    $newNameInput.bind('focus', releaseLock);

                    $alertContainer.append(
                        $('<div>')
                            .append(
                                $('<div>').append('Warning: Apps using the old name may break.')
                            )
                            .append($('<div>').append($newNameInput))
                            .append(
                                $('<button>')
                                    .addClass('kb-data-list-btn')
                                    .append('Rename')
                                    .click(() => {
                                        if (this.ws_name && this.ws) {
                                            this.ws.rename_object(
                                                {
                                                    obj: {
                                                        ref:
                                                            objData.objectInfo.wsid +
                                                            '/' +
                                                            objData.objectInfo.id,
                                                    },
                                                    new_name: $newNameInput.val(),
                                                },
                                                () => {
                                                    this.writingLock = false;
                                                    this.refresh();
                                                },
                                                (error) => {
                                                    console.error(error);
                                                    this.renderError(
                                                        $alertContainer,
                                                        error.error.message
                                                    );
                                                }
                                            );
                                        }
                                    })
                            )
                            .append(
                                $('<button>')
                                    .addClass('kb-data-list-cancel-btn')
                                    .append('Cancel')
                                    .click(() => {
                                        this.writingLock = false;
                                        $alertContainer.empty();
                                    })
                            )
                    );
                });
        },

        deleteButton: function (objData, $alertContainer) {
            return this.makeToolbarButton()
                .tooltip({
                    title: 'Delete data',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                })
                .append($('<span>').addClass('fa fa-trash-o'))
                .click((e) => {
                    e.stopPropagation();
                    $alertContainer.empty();
                    // TODO: The control should actually be disabled. This should be via a listener
                    // for the view-only event...
                    if (Jupyter.narrative.readonly) {
                        $alertContainer.append(
                            $('<div>').append(
                                $('<span>')
                                    .append('Read-only Narrative - Cannot delete data object')
                                    .addClass('text-warning')
                            )
                        );
                        return;
                    }
                    $alertContainer.append(
                        $('<div>')
                            .append($('<span>').append('Are you sure?'))
                            .append(
                                $('<button>')
                                    .addClass('kb-data-list-btn')
                                    .append('Delete')
                                    .click(() => {
                                        if (this.ws_name && this.ws) {
                                            this.ws.rename_object(
                                                {
                                                    obj: {
                                                        ref:
                                                            objData.objectInfo.wsid +
                                                            '/' +
                                                            objData.objectInfo.id,
                                                    },
                                                    new_name:
                                                        objData.objectInfo.name.split(
                                                            '-deleted-'
                                                        )[0] +
                                                        '-deleted-' +
                                                        new Date().getTime(),
                                                },
                                                () => {
                                                    this.ws.delete_objects(
                                                        [
                                                            {
                                                                ref:
                                                                    objData.objectInfo.wsid +
                                                                    '/' +
                                                                    objData.objectInfo.id,
                                                            },
                                                        ],
                                                        () => {
                                                            $(document).trigger(
                                                                'deleteDataList.Narrative',
                                                                objData.objectInfo.name
                                                            );
                                                            this.writingLock = false;
                                                            this.refresh();
                                                        },
                                                        (error) => {
                                                            console.error(error);
                                                            this.renderError(
                                                                $alertContainer,
                                                                error.error.message
                                                            );
                                                        }
                                                    );
                                                },
                                                (error) => {
                                                    console.error(error);
                                                    this.renderError(
                                                        $alertContainer,
                                                        error.error.message
                                                    );
                                                }
                                            );
                                        }
                                    })
                            )
                            .append(
                                $('<button>')
                                    .addClass('kb-data-list-cancel-btn')
                                    .append('Cancel')
                                    .click(() => {
                                        $alertContainer.empty();
                                    })
                            )
                    );
                });
        },

        addDataControls: function (objData, $alertContainer, ref_path) {
            const $filterMethodInput = this.filterMethodInputButton(objData);
            const $filterMethodOutput = this.filterMethodOutputButton(objData);
            const $openLandingPage = this.openLandingPageButton(objData, $alertContainer);
            const $openReport = this.openReportButton(objData);
            const $openHistory = this.openHistoryButton(objData, $alertContainer);
            const $openProvenance = this.openProvenanceButton(objData, $alertContainer);
            const $download = this.downloadButton(objData, ref_path, $alertContainer);
            const $rename = this.renameButton(objData, $alertContainer);
            const $delete = this.deleteButton(objData, $alertContainer);

            const $btnToolbar = $('<span>').addClass('btn-group');

            $btnToolbar
                .append($filterMethodInput)
                .append($filterMethodOutput)
                .append($openLandingPage)
                .append($openReport);

            if (!Jupyter.narrative.readonly && !objData.fromPalette) {
                $btnToolbar.append($openHistory);
            }

            $btnToolbar.append($openProvenance).append($download);

            if (!Jupyter.narrative.readonly && !objData.fromPalette) {
                $btnToolbar.append($rename).append($delete);
            }

            return $btnToolbar;
        },

        toggleSetExpansion: function (objId, $setDiv) {
            const setInfo = this.setInfo[objId];
            let setItemsShown, i;
            if (!setInfo) {
                return;
            }
            const showItems = this.dataObjects[objId].expanded;
            if (showItems) {
                setItemsShown = 0;
                for (i = 0; i < setInfo.item_ids.length; i++) {
                    const setItemId = setInfo.item_ids[i];
                    const viewInfo = _.findWhere(this.viewOrder, { objId: setItemId });
                    if (viewInfo.inFilter) {
                        const $setItemDiv = this.renderObjectRowDiv(setItemId, 1);
                        $setDiv.after($setItemDiv);
                        setItemsShown++;
                    }
                }
                this.setInfo[objId].setItemsShown = setItemsShown;
            } else {
                setItemsShown = setInfo.setItemsShown || 0;
                for (i = 0; i < setItemsShown; i++) {
                    $setDiv.next().remove();
                }
            }
        },

        getReportForObject: function (objectInfo) {
            const narrativeService = new DynamicServiceClient({
                module: 'NarrativeService',
                url: Config.url('service_wizard'),
                token: this.token,
            });
            return narrativeService
                .callFunc('find_object_report', [
                    {
                        upa: objectInfo.ref,
                    },
                ])
                .spread((reportResult) => {
                    if (reportResult.report_upas.length === 0) {
                        return [];
                    }

                    const objectsToFetch = reportResult.report_upas.map((ref) => {
                        return {
                            ref,
                        };
                    });

                    // If, after evaluation of the reports, we really don't have any, just
                    // shortcircuit with an array of nulls.
                    if (objectsToFetch.length === 0) {
                        return [];
                    }

                    const reportRef = reportResult.object_upa;

                    const workspace = new GenericClient({
                        module: 'Workspace',
                        url: Config.url('workspace'),
                        token: this.token,
                    });

                    return workspace
                        .callFunc('get_objects2', [
                            {
                                objects: objectsToFetch,
                                ignoreErrors: 0,
                            },
                        ])
                        .spread((result) => {
                            let objectReportsForOutput = result.data
                                .filter((reportObject) => {
                                    // pull out found objects which are in the list of objects created in the report.
                                    // objects_created looks like {description: .., ref: ..}
                                    return reportObject.data.objects_created.some(
                                        (objectCreated) => {
                                            return objectCreated.ref === reportRef;
                                        }
                                    );
                                })
                                .map((reportObject) => {
                                    return ServiceUtils.objectInfoToObject(reportObject.info);
                                });

                            // we can get multiple reports if this narrative has been copied.
                            // If so, we only want to look at the one in the current workspace.
                            // TODO: otherwise? is it possible to have more than one report and not have
                            //       one in the current workspace????
                            if (objectReportsForOutput.length > 1) {
                                objectReportsForOutput = objectReportsForOutput.filter(
                                    (reportInfo) => {
                                        return reportInfo.wsid === objectInfo.wsid;
                                    }
                                );
                            }

                            return objectReportsForOutput;
                        });
                });
        },

        onOpenDataListItem: function ($moreRow, objData) {
            if ('reportRef' in objData) {
                return;
            }

            const objectInfo = objData.objectInfo;
            // The report button needs the report to be found!
            const $reportButton = $moreRow.find('[data-button="report"]');

            $reportButton
                .empty()
                .append(
                    $('<span>').addClass('fa fa-spinner fa-spin fa-fw fa-sm').css('width', '0.75em')
                );

            this.getReportForObject(objectInfo).then((result) => {
                if (result.length === 0) {
                    $reportButton.addClass('disabled');
                    $reportButton
                        .empty()
                        .append($('<span>').addClass('fa fa-file-text').css('width', '0.75em'));
                    $reportButton.tooltip({
                        title: 'No report associated with this object',
                        container: '#' + this.mainListId,
                        delay: {
                            show: Config.get('tooltip').showDelay,
                            hide: Config.get('tooltip').hideDelay,
                        },
                    });
                    objData.reportRef = null;
                    return;
                } else if (result.length === 1) {
                    $reportButton
                        .empty()
                        .append($('<span>').addClass('fa fa-file-text').css('width', '0.75em'));
                    objData.reportRef = result[0].ref;
                    $reportButton
                        .tooltip({
                            title: 'View associated report',
                            container: '#' + this.mainListId,
                            delay: {
                                show: Config.get('tooltip').showDelay,
                                hide: Config.get('tooltip').hideDelay,
                            },
                        })
                        .click((e) => {
                            e.stopPropagation();
                            if (objData.reportRef) {
                                this.showReportLandingPage(objData.reportRef);
                            }
                        });
                } else {
                    console.warn('oops, too many reports', result);

                    $reportButton.tooltip({
                        title: 'Too many reports associated with this object',
                        container: '#' + this.mainListId,
                        delay: {
                            show: Config.get('tooltip').showDelay,
                            hide: Config.get('tooltip').hideDelay,
                        },
                    });
                    $reportButton.addClass('disabled');
                    $reportButton
                        .empty()
                        .append($('<span>').addClass('fa fa-ban').css('width', '0.75em'));
                    objData.reportRef = null;
                }
            });
        },

        /**
         * This is the main function for rendering a data object
         * in the data list.
         */
        renderObjectRowDiv: function (objId) {
            const objData = this.dataObjects[objId];
            const object_info = objData.info;
            const ref_path = objData.refPath;
            const object_key = objData.key;

            // object_info:
            // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
            // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
            // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
            // [9] : int size // [10] : usermeta meta
            const type_tokens = object_info[2].split('.');
            const type_module = type_tokens[0];
            const type = type_tokens[1].split('-')[0];
            const is_set = this.isASet(object_info);

            let author = ' ';
            if (object_info[5] !== this.my_username) {
                author = ' by ' + object_info[5];
            }

            const metadata = object_info[10] || {};
            let viewType = type;
            if (type === 'Genome' || type === 'GenomeAnnotation') {
                if ('Name' in metadata) {
                    viewType = type + ': ' + metadata['Name'];
                }
            }

            let metadataText = '';
            for (const key in metadata) {
                if (Object.prototype.hasOwnProperty.call(metadata, key)) {
                    metadataText += '<tr><th>' + key + '</th><td>' + metadata[key] + '</td></tr>';
                }
            }

            // create more content
            const $savedByUserSpan = $('<td>').addClass('kb-data-list-username-td');
            DisplayUtil.displayRealName(object_info[5], $savedByUserSpan);

            const $alertDiv = $('<div>').css({ 'text-align': 'center', margin: '10px 0px' });
            const typeLink =
                '<a href="/#spec/module/' +
                type_module +
                '" target="_blank">' +
                type_module +
                '</a>.<wbr>' +
                '<a href="/#spec/type/' +
                object_info[2] +
                '" target="_blank">' +
                type_tokens[1].replace('-', '&#8209;') +
                '.' +
                type_tokens[2] +
                '</a>';

            const $moreContent = $('<div>')
                .addClass('kb-data-list-more-div')
                .append(this.addDataControls(objData, $alertDiv, ref_path))
                .append($alertDiv)
                .append(
                    $('<table style="width:100%;">')
                        .append(
                            '<tr><th>Permanent Id</th><td>' +
                                object_info[6] +
                                '/' +
                                object_info[0] +
                                '/' +
                                object_info[4] +
                                '</td></tr>'
                        )
                        .append('<tr><th>Full Type</th><td>' + typeLink + '</td></tr>')
                        .append($('<tr>').append('<th>Saved by</th>').append($savedByUserSpan))
                        .append(metadataText)
                );

            const $card = kbaseDataCard.apply(this, [
                {
                    viewType: viewType,
                    type: type,
                    editedBy: author,
                    moreContent: $moreContent,
                    is_set: is_set,
                    object_info: object_info,
                    onOpen: () => {
                        this.onOpenDataListItem($moreContent, objData);
                    },
                },
            ]);

            if (objData.fromPalette) {
                const $paletteIcon = $('<div>')
                    .addClass('pull-right narrative-card-palette-icon')
                    .append($('<i>').addClass('fa fa-link'))
                    .tooltip({
                        title: 'This is a reference to an object in another Narrative.',
                        placement: 'right',
                        container: 'body',
                        delay: {
                            show: Config.get('tooltip').showDelay,
                            hide: Config.get('tooltip').hideDelay,
                        },
                    });
                $card.find('.kb-data-list-info').append($paletteIcon);
            }
            //add custom click events

            $card.find('.narrative-card-logo , .kb-data-list-name').click((e) => {
                e.stopPropagation();
                this.insertViewer(object_key);
            });

            $card.find('.narrative-card-row-main').click(() => {
                const $node = $(this.parentElement).find('.narrative-card-row-more');
                if (this.selectedObject === object_info[0] && $node.is(':visible')) {
                    // assume selection handling occurs before this is called
                    // so if we are now selected and the moreContent is visible, leave it...
                    return;
                }

                if ($node.is(':visible')) {
                    this.writingLock = false;
                } else {
                    this.getRichData(object_info, $node);
                }
            });

            // Drag and drop
            $card.attr('kb-oid', object_key);
            this.addDragAndDrop($card);

            return $card;
        },

        // ============= DnD ==================

        addDropZone: function (container, targetCell, isBelow) {
            const targetDiv = document.createElement('div');

            targetDiv.classList.add('kb-data-list-drag-target');
            targetDiv.innerHTML = '<i>drop data object here</i>';
            targetDiv.addEventListener('dragover', (e) => {
                e.target.classList.add('-drag-active');
                e.preventDefault();
            });
            targetDiv.addEventListener('dragenter', (e) => {
                e.target.classList.add('-drag-hover');
                e.preventDefault();
            });
            targetDiv.addEventListener('dragleave', (e) => {
                e.target.classList.remove('-drag-hover');
                e.target.classList.remove('-drag-active');
                e.preventDefault();
            });
            targetDiv.addEventListener('drop', (e) => {
                if (Jupyter.narrative.readonly) {
                    new BootstrapDialog({
                        type: 'warning',
                        title: 'Warning',
                        body:
                            'Read-only Narrative -- may not insert a data viewer into this Narrative',
                        alertOnly: true,
                    }).show();
                    return;
                }
                const data = JSON.parse(e.dataTransfer.getData('info'));
                const obj = this.dataObjects[this.keyToObjId[data.key]];
                const info = this.createInfoObject(obj.info, obj.refPath);

                let cell, placement;

                if (e.target.getAttribute('cellIs') === 'below') {
                    cell = $(e.target.nextSibling).data().cell;
                    placement = 'above';
                } else {
                    cell = $(e.target.previousSibling).data().cell;
                    placement = 'below';
                }
                const cellIndex = Jupyter.notebook.find_cell_index(cell);

                $(document).trigger('createViewerCell.Narrative', {
                    nearCellIdx: cellIndex,
                    widget: 'kbaseNarrativeDataCell',
                    info: info,
                    placement: placement,
                });
            });
            if (isBelow) {
                targetDiv.setAttribute('cellIs', 'above');
                container.appendChild(targetDiv);
            } else {
                targetDiv.setAttribute('cellIs', 'below');
                container.insertBefore(targetDiv, targetCell);
            }
        },

        addDragAndDrop: function ($row) {
            const node = $row.children().get(0),
                key = $row.attr('kb-oid'),
                obj = this.dataObjects[this.keyToObjId[key]], //_.findWhere(this.objectList, {key: key}),
                info = this.createInfoObject(obj.info, obj.refPath),
                data = {
                    widget: 'kbaseNarrativeDataCell',
                    info: info,
                    key: key,
                },
                dataString = JSON.stringify(data);

            node.setAttribute('draggable', true);

            node.addEventListener('dragstart', (e) => {
                e.dataTransfer.dropEffect = 'copy';
                e.dataTransfer.setData('info', dataString);

                const targetCells = document.querySelectorAll('#notebook-container .cell');
                const container = document.querySelector('#notebook-container');
                for (let i = 0; i < targetCells.length; i += 1) {
                    this.addDropZone(container, targetCells.item(i));
                    if (i === targetCells.length - 1) {
                        this.addDropZone(container, targetCells.item(i), true);
                    }
                }
            });

            node.addEventListener('dragend', () => {
                const container = document.querySelector('#notebook-container'),
                    targetCells = document.querySelectorAll(
                        '#notebook-container .kb-data-list-drag-target'
                    );
                for (let i = 0; i < targetCells.length; i += 1) {
                    const targetCell = targetCells.item(i);
                    container.removeChild(targetCell);
                }
            });

            // Add tooltip to indicate this functionality
            $row.attr({
                'data-toggle': 'tooltip',
                title: 'Drag onto Narrative &rarr;',
            });

            $row.tooltip({
                delay: {
                    show: Config.get('tooltip').showDelay,
                    hide: Config.get('tooltip').hideDelay,
                },
                placement: 'top auto',
                html: true,
            });

            return this;
        },
        /**
         * Helper function to create named object attrs from
         * list of fields returned from Workspace service.
         */
        createInfoObject: function (info, refPath) {
            const ret = ServiceUtils.objectInfoToObject(info);

            if (refPath) {
                ret['ref_path'] = refPath;
            }
            return ret;
        },
        // ============= end DnD ================

        insertViewer: function (key) {
            Jupyter.narrative.addViewerCell(this.keyToObjId[key]);
        },

        renderMore: function () {
            const start = this.lastObjectRendered;
            const limit = this.n_objs_rendered + this.options.objs_to_render_on_scroll;
            for (
                let i = start + 1;
                i < this.viewOrder.length && this.n_objs_rendered < limit;
                i++
            ) {
                if (this.shouldRenderObject(this.viewOrder[i])) {
                    this.renderObject(this.viewOrder[i].objId);
                    this.n_objs_rendered++;
                    this.lastObjectRendered = i;
                }
            }
        },

        detachAllRows: function () {
            this.$mainListDiv.children().detach();
            this.n_objs_rendered = 0;
            this.renderedAll = false;
        },

        shouldRenderObject: function (viewInfo) {
            let render = viewInfo.inFilter;
            if (render) {
                if (this.setViewMode && this.inAnySet(this.dataObjects[viewInfo.objId].info)) {
                    render = false;
                }
            }
            return render;
        },

        renderList: function () {
            this.detachAllRows();
            this.n_objs_rendered = 0;

            if (this.viewOrder.length > 0) {
                const limit = this.options.objs_to_render_to_start;
                for (let i = 0; i < this.viewOrder.length && this.n_objs_rendered < limit; i++) {
                    if (this.shouldRenderObject(this.viewOrder[i])) {
                        this.renderObject(this.viewOrder[i].objId);
                        this.n_objs_rendered++;
                        this.lastObjectRendered = i;
                    }
                }
                if (Jupyter.narrative.readonly) {
                    this.$addDataButton.hide();
                } else {
                    this.$addDataButton.show();
                }
            } else {
                const $noDataDiv = $('<div>')
                    .css({ 'text-align': 'center', margin: '20pt' })
                    .append('This Narrative has no data yet.<br><br>');
                if (Jupyter && Jupyter.narrative && !Jupyter.narrative.readonly) {
                    $noDataDiv.append(
                        $('<button>')
                            .append('Add Data')
                            .addClass('kb-data-list-add-data-text-button')
                            .attr('data-test-id', 'add-data-button')
                            .css({ margin: '20px' })
                            .click(() => {
                                this.trigger('toggleSidePanelOverlay.Narrative', [
                                    this.options.parentControlPanel.$overlayPanel,
                                ]);
                            })
                    );
                    this.$addDataButton.hide();
                }
                this.$mainListDiv.append($noDataDiv);
                // only show up to the given number
            }
        },

        renderObject: function (objId) {
            const $renderedDiv = this.renderObjectRowDiv(objId);
            this.dataObjects[objId].$div = $renderedDiv;
            this.$mainListDiv.append($renderedDiv);
            if (this.setViewMode) {
                this.toggleSetExpansion(objId, $renderedDiv);
            }
        },

        renderController: function () {
            const $upOrDown = $('<button class="btn btn-default btn-sm" type="button">')
                .css({ 'margin-left': '5px' })
                .append(
                    '<span class="fa fa-sort-amount-asc" style="color:#777" aria-hidden="true" />'
                )
                .on('click', () => {
                    this.reverseData();
                    this.sortOrder *= -1;
                    const $icon = $upOrDown.find('.fa');
                    if ($icon.is('.fa-sort-amount-desc,.fa-sort-amount-asc')) {
                        $icon.toggleClass('fa-sort-amount-desc fa-sort-amount-asc');
                    } else {
                        $icon.toggleClass('fa-sort-alpha-desc fa-sort-alpha-asc');
                    }
                });

            const setSortIcon = (newIcon) => {
                $upOrDown
                    .find('.fa')
                    .removeClass()
                    .addClass('fa ' + newIcon);
            };

            const $byDate = $(
                '<label id="nar-data-list-default-sort-label" class="btn btn-default">'
            )
                .addClass('btn btn-default')
                .append(
                    $(
                        '<input type="radio" name="options" id="nar-data-list-default-sort-option" autocomplete="off">'
                    )
                )
                .append('date')
                .on('click', () => {
                    this.sortData((a, b) => {
                        return (
                            this.sortOrder *
                            this.dataObjects[a.objId].info[3].localeCompare(
                                this.dataObjects[b.objId].info[3]
                            )
                        );
                    });
                    setSortIcon(this.sortOrder > 0 ? 'fa-sort-amount-desc' : 'fa-sort-amount-asc');
                });

            const $byName = $('<label class="btn btn-default">')
                .append($('<input type="radio" name="options" id="option2" autocomplete="off">'))
                .append('name')
                .on('click', () => {
                    this.sortData((a, b) => {
                        return (
                            -1 *
                            this.sortOrder *
                            this.dataObjects[a.objId].info[1]
                                .toUpperCase()
                                .localeCompare(this.dataObjects[b.objId].info[1].toUpperCase())
                        );
                    });
                    setSortIcon(this.sortOrder > 0 ? 'fa-sort-alpha-desc' : 'fa-sort-alpha-asc');
                });

            const $byType = $('<label class="btn btn-default">')
                .append($('<input type="radio" name="options" id="option3" autocomplete="off">'))
                .append('type')
                .on('click', () => {
                    this.sortData((a, b) => {
                        const aType = this.dataObjects[a.objId].info[2]
                            .toUpperCase()
                            .match(/\.(.+)/)[1];
                        const bType = this.dataObjects[b.objId].info[2]
                            .toUpperCase()
                            .match(/\.(.+)/)[1];
                        return -1 * this.sortOrder * aType.localeCompare(bType);
                    });
                    setSortIcon(this.sortOrder > 0 ? 'fa-sort-alpha-desc' : 'fa-sort-alpha-asc');
                });

            const $sortByGroup = $('<div data-toggle="buttons">')
                .addClass('btn-group btn-group-sm')
                .css({ margin: '2px' })
                .append($byDate)
                .append($byName)
                .append($byType);

            /** Set view mode toggle */
            this.viewModeDisableHnd = {};
            const $viewMode = $('<span>')
                .addClass('btn btn-xs btn-default kb-data-list-ctl')
                .attr('id', 'kb-data-list-hierctl')
                .tooltip({
                    title: 'Hierarchical view',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                })
                .append('<span class="fa fa-copy"></span>')
                .on('click', () => {
                    this.setViewMode = !this.setViewMode;
                    if (this.setViewMode) {
                        $('#kb-data-list-hierctl').attr('enabled', '1');
                    } else {
                        $('#kb-data-list-hierctl').removeAttr('enabled');
                    }
                    this.renderList();
                });

            // Search control
            this.controlClickHnd.search = () => {
                if (!this.$searchDiv.is(':visible')) {
                    this.$sortByDiv.hide({ effect: 'blind', duration: 'fast' });
                    this.$filterTypeDiv.hide({ effect: 'blind', duration: 'fast' });
                    this.$searchDiv.show({ effect: 'blind', duration: 'fast' });
                    this.bsSearch.focus();
                } else {
                    this.$searchDiv.hide({ effect: 'blind', duration: 'fast' });
                }
            };

            const $openSearch = $('<span>')
                .addClass('btn btn-xs btn-default kb-data-list-ctl')
                .attr('id', 'kb-data-list-searchctl')
                .tooltip({
                    title: 'Search data in narrative',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                })
                .append('<span class="fa fa-search"></span>')
                .on('click', this.controlClickHnd.search);

            // Sort control
            this.controlClickHnd.sort = () => {
                if (!this.$sortByDiv.is(':visible')) {
                    this.$searchDiv.hide({ effect: 'blind', duration: 'fast' });
                    this.$filterTypeDiv.hide({ effect: 'blind', duration: 'fast' });
                    this.$sortByDiv.show({ effect: 'blind', duration: 'fast' });
                } else {
                    this.$sortByDiv.hide({ effect: 'blind', duration: 'fast' });
                }
            };
            const $openSort = $('<span>')
                .addClass('btn btn-xs btn-default kb-data-list-ctl')
                .attr('id', 'kb-data-list-sortctl')
                .tooltip({
                    title: 'Sort data list',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                })
                .append('<span class="fa fa-sort-amount-asc"></span>')
                .on('click', this.controlClickHnd.sort);

            // Filter control
            this.controlClickHnd.filter = () => {
                if (!this.$filterTypeDiv.is(':visible')) {
                    this.$sortByDiv.hide({ effect: 'blind', duration: 'fast' });
                    this.$searchDiv.hide({ effect: 'blind', duration: 'fast' });
                    this.$filterTypeDiv.show({ effect: 'blind', duration: 'fast' });
                } else {
                    this.$filterTypeDiv.hide({ effect: 'blind', duration: 'fast' });
                }
            };
            const $openFilter = $('<span>')
                .addClass('btn btn-xs btn-default kb-data-list-ctl')
                .attr('id', 'kb-data-list-filterctl')
                .tooltip({
                    title: 'Filter data by type',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                })
                .append('<span class="fa fa-filter"></span>')
                .on('click', this.controlClickHnd.filter);

            // Refresh control
            const $refreshBtn = $('<span>')
                .addClass('btn btn-xs btn-default')
                .tooltip({
                    title: 'Refresh data list',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                })
                .append('<span class="fa fa-refresh"></span>')
                .on('click', () => {
                    this.writingLock = false;
                    this.refresh();
                });
            this.$searchDiv = $('<div data-testid="search-field">');
            this.bsSearch = new BootstrapSearch(this.$searchDiv, {
                inputFunction: () => {
                    this.search();
                },
                placeholder: 'Search in your data',
            });

            this.$sortByDiv = $('<div>')
                .css('text-align', 'center')
                .append('<small>sort by: </small>')
                .append($sortByGroup)
                .append($upOrDown);

            this.$filterTypeSelect = $('<select>')
                .addClass('form-control')
                .css('margin', 'inherit')
                .append($('<option value="">'))
                .change(() => {
                    this.selectedType = 'filterTypeSelect';
                    const optionSelected = $(this).find('option:selected');
                    const typeSelected = optionSelected.val();

                    // whenever we change the type filter, we need to clear the current match
                    // so that the complete filter can rerun
                    this.currentMatch = this.viewOrder;

                    this.filterByType(typeSelected);
                });

            this.$filterTypeDiv = $('<div>').append(this.$filterTypeSelect);

            const $header = $('<div>');
            if (this.options.parentControlPanel) {
                if (Config.get('features').hierarchicalDataView) {
                    this.options.parentControlPanel.addButtonToControlPanel($viewMode);
                }
                this.options.parentControlPanel.addButtonToControlPanel($openSearch);
                this.options.parentControlPanel.addButtonToControlPanel($openSort);
                this.options.parentControlPanel.addButtonToControlPanel($openFilter);
                this.options.parentControlPanel.addButtonToControlPanel($refreshBtn);
            } else {
                $header
                    .addClass('row')
                    .css({ margin: '5px' })
                    .append(
                        $('<div>')
                            .addClass('col-xs-12')
                            .css({ margin: '0px', padding: '0px', 'text-align': 'right' })
                            .append(Config.get('features').hierarchicalDataView ? $viewMode : '')
                            .append($openSearch)
                            .append($openSort)
                            .append($openFilter)
                    );
            }

            this.$sortByDiv.hide();
            this.$searchDiv.hide();
            this.$filterTypeDiv.hide();

            const $filterDiv = $('<div>')
                .append(this.$sortByDiv)
                .append(this.$searchDiv)
                .append(this.$filterTypeDiv);

            this.$controllerDiv.append($header).append($filterDiv);
        },

        pluralize(word, count) {
            if (count > 0) {
                return `${word}s`;
            }
            return word;
        },
        /**
         * Populates the filter set of available types.
         */
        populateAvailableTypes: function () {
            if (this.availableTypes && this.$filterTypeSelect) {
                const selected = this.$filterTypeSelect.val();
                this.$filterTypeSelect.empty();
                let runningCount = 0;
                Object.keys(this.availableTypes)
                    .sort()
                    .forEach((type) => {
                        const typeInfo = this.availableTypes[type];
                        this.$filterTypeSelect.append(
                            $('<option value="' + typeInfo.type + '">').append(
                                [
                                    typeInfo.type,
                                    ' (',
                                    typeInfo.count,
                                    ' ',
                                    this.pluralize('object', typeInfo.count),
                                    ')',
                                ].join('')
                            )
                        );
                        runningCount += typeInfo.count;
                    });
                this.$filterTypeSelect
                    .prepend(
                        $('<option value="">').append(
                            'Show All Types (' +
                                runningCount +
                                ' ' +
                                this.pluralize('object', runningCount) +
                                ')'
                        )
                    )
                    .val(selected);
            }
        },
        reverseData: function () {
            this.viewOrder.reverse();
            this.renderList();
            this.search();
        },
        sortData: function (sortfunction) {
            this.selectedType = 'sortData';
            this.lastSortFunction = sortfunction;
            this.viewOrder.sort(sortfunction);
            this.renderList();
            this.search(); // always refilter on the search term search if there is something there

            // go back to the top on sort
            this.$mainListDiv.animate(
                {
                    scrollTop: 0,
                },
                300
            ); // fast = 200, slow = 600
        },

        search: function (term, type) {
            if (!this.dataObjects) {
                return;
            }

            if (!term) {
                term = this.bsSearch.val();
            }

            // if type wasn't selected, then we try to get something that was set
            if (!type && this.$filterTypeSelect) {
                type = this.$filterTypeSelect.find('option:selected').val();
            }

            term = term.trim();
            if (term.length > 0 || type) {
                this.searchFilterOn = true;
                // todo: should show searching indicator (could take several seconds if there is a lot of data)
                // optimization => we filter existing matches instead of researching everything if the new
                // term starts with the last term searched for
                // clean the term for regex use

                // bars are common in kb ids, so escape them unless we have \\|
                term = term.replace(/\|/g, '\\|').replace(/\\\\\|/g, '|');

                // dots are common in names, so we escape them, but
                // if a user writes '\\.' we assume they want the regex '.'
                term = term.replace(/\./g, '\\.').replace(/\\\\\./g, '.');

                const regex = new RegExp(term, 'i');

                // TODO: n_filteredObjsRendered does not seem to be used anywhere, but needs
                // further investigation.
                this.n_filteredObjsRendered = 0;
                for (const orderedObject of this.viewOrder) {
                    // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                    // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                    // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                    // [9] : int size // [10] : usermeta meta

                    orderedObject.inFilter = (() => {
                        const objectTypeName = info[2].split(/[.-]/)[1];
                        const info = this.dataObjects[orderedObject.objId].info;

                        // if type is defined, then our sort must also filter by the type
                        if (type && type !== objectTypeName) {
                            return false; // no match if we are not the selected type!
                        }

                        // match on name
                        if (regex.test(info[1])) {
                            return true;
                        }
                        // match on type name
                        if (regex.test(objectTypeName)) {
                            return true;
                        }
                        // match on saved_by user
                        if (regex.test(info[5])) {
                            return true;
                        }

                        const metadata = info[10];
                        if (metadata) {
                            // match on metadata values
                            for (const [metaKey, metaValue] of Object.entries(metadata)) {
                                if (
                                    regex.test(metaValue) ||
                                    regex.test(metaKey + '::' + metaValue)
                                ) {
                                    return true;
                                }
                            }
                        }

                        return false;
                    })();
                }
            } else {
                // no new search, so show all and render the list
                this.viewOrder.forEach((viewInfo) => {
                    viewInfo.inFilter = true;
                });
            }
            this.renderList();
            this.currentTerm = term;
        },

        filterByType: function (type) {
            this.search(null, type);
        },

        getRichData: function (object_info, $moreRow) {
            // spawn off expensive operations required to enable "more" functionality.
            // e.g. the report button.

            // The "Saved by" field needs to lookup that user's real name.
            const $usernameTd = $moreRow.find('.kb-data-list-username-td');
            DisplayUtil.displayRealName(object_info[5], $usernameTd);
        },
    });
});
