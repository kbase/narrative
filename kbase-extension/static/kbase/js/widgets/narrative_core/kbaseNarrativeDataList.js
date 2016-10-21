/* global define,Jupyter,KBError */
/* global Workspace, SetAPI */
/* jslint white: true */
/* eslint no-console: 0 */
/**
 * @author Michael Sneddon <mwsneddon@lbl.gov>
 * @public
 */
define([
    'kbwidget',
    'jquery',
    'underscore',
    'bluebird',
    'narrativeConfig',
    'util/string',
    'util/display',
    'util/timeFormat',
    'util/icon',
    'kbase-client-api',
    'kbase-generic-client-api',
    'kbaseAuthenticatedWidget',
    'kbaseNarrativeDownloadPanel',
    'common/runtime',
    'handlebars',
    'text!kbase/templates/data_list/object_row.html',
    'bootstrap',
    'jquery-nearest'
], function (
    KBWidget,
    $,
    _,
    Promise,
    Config,
    StringUtil,
    DisplayUtil,
    TimeFormat,
    Icon,
    kbase_client_api,
    GenericClient,
    kbaseAuthenticatedWidget,
    kbaseNarrativeDownloadPanel,
    Runtime,
    Handlebars,
    ObjectRowHtml
    ) {
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
            ws_chunk_size: 10000, // this is the limit of the number of objects to retrieve from the ws on each pass
            ws_max_objs_to_fetch: 75000, // this is the total limit of the number of objects before we stop trying to get more
            // note that if there are more objects than this, then sorts/search filters may
            // not show accurate results

            objs_to_render_to_start: 40, // initial number of rows to display
            objs_to_render_on_scroll: 5, // number of rows to add when the user scrolls to the bottom, should be <=5, much more and
            // the addition of new rows becomes jerky

            maxObjsToPreventFilterAsYouTypeInSearch: 50000, //if there are more than this # of objs, user must click search
            //instead of updating as you type

            max_objs_to_prevent_initial_sort: 10000, // initial sort makes loading slower, so we can turn it off if
            // there are more than this number of objects

            max_name_length: 33,
            refresh_interval: 10000,
            parentControlPanel: null,
            slideTime: 400
        },
        // private variables
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
        downloadSpecCache: {tag: 'dev'},
        controlClickHnd: {}, // click handlers for control buttons
        my_user_id: null,
        setAPI: null,
        serviceClient: null,

        objectRowTmpl: Handlebars.compile(ObjectRowHtml),

        /** -----------------
         * Structural changes to support new view(s).
         * viewOrder = a list of object ids - which order to view (might make them references)
         * dataObjects = object id (or ref) -> object info -- same as objectList above
         * keyToObjId = key (uuid) -> obj id (int)
         */
        viewOrder: [],
        dataObjects: {},
        keyToObjId: {},

        /* ----------------------------------------------------
            Changes for hierarchical data panel (KBASE-4566)
        */
        setItems: { }, // item_id -> {set_id -> 1, ..}
        setInfo: { }, // set_id -> { count: , div: , expanded: ,... }
        setsInitialized: false, // have we 'extracted' the sets yet?
        // MOCK_SET_ID: 666, // hardcoded workspace set object id
        setViewMode: false, // Whether the panel is in hierarchy "mode"
        cachedSetItems: {}, // Items retrieved from a mega-call to list_sets
        dataIconParam: {},

        /**
         * Perform any set-specific initialization needed.
         */
        initDataListSets: function() {
            for (var objId in this.dataObjects) {
                if (this.isASet(this.dataObjects[objId].info) &&
                    _.has(this.dataIconParam, objId) &&
                    !this.dataIconParam[objId].stacked
                ) {
                    this.dataIconParam[objId].stacked = true;
                    Icon.overwriteDataIcon(this.dataIconParam[objId]);
                }
            }
        },

        /**
         * Utility function to portably return the identifier to
         * use for a single data object.
         *
         * @param obj Info tuple from ws_list_objects
         * @return Identifier (string)
         */
        itemId: function(obj) {
            return obj[0];
        },

        /**
         * Test if given object is a set.
         * This simply tests whether that object is in the `setInfo` mapping.
         *
         * @param obj_info Object info tuple, as returned by ws.list_objects()
         * @return true if in a set, false otherwise
         */
        isASet: function(obj_info) {
            return _.has(this.setInfo, this.itemId(obj_info));
        },

        isAViewedSet: function(obj_info) {
            if (this.setViewMode) {
                return this.isASet(obj_info);
            }
            else {
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
        inAnySet: function(item_info) {
            if (this.setViewMode) {
                var item_id = this.itemId(item_info);
                //console.debug('item_id = ', item_id);
                return _.has(this.setItems, item_id);
            }
            else {
                return false;
            }
        },

        getSetInfo: function(obj_info) {
            return this.setInfo[this.itemId(obj_info)];
        },

        /**
         * Toggle whether set is 'expanded' or not.
         *
         * @param item_info an object info tuple, as returned by the
         *                  workspace API for list_objects()
         * @return New state of 'expanded'
         */
         toggleSetExpanded: function (item_info) {
            var set_id = this.itemId(item_info);
            var new_value = !this.setInfo[set_id].expanded;
            this.setInfo[set_id].expanded = new_value;
            return new_value;
         },

        /**
         * Get item parents.
         *
         * @param item_info an object info tuple, as returned by the
         *                  workspace API for list_objects()
         * @return All parents, expanded or not, as a mapping with
         *         the keys: (item_id, expanded, div).
        */
        getItemParents: function(item_info) {
            var item_id = this.itemId(item_info);
            // empty if not in ANY set
            if (!_.has(this.setItems, item_id)) {
                return [];
            }
            var self = this;
            // Construct return value, which is one
            // map for each of the Sets.
            return _.map(
                _.keys(this.setItems[item_id]),
                function(key) {
                    return {
                        item_id: key,
                        expanded: self.setInfo[key].expanded,
                        div: self.setInfo[key].div
                    };
                }
            );
        },

        /**
         * Extract, into 'setItems' and 'setInfo',
         * the data items in the input workspace.
         *
         * @return Promise-wrapped true (ok or no-op) or false (failed)
         */
        extractSets: function(ws_id, force) {
            if (this.setsInitialized && !force) {
                console.info('Sets are already initialized');
                return new Promise(function(resolve, reject) { resolve(true) });
            }
            this.setsInitialized = false;

            var self = this;
            console.info('Extracting sets from datalist...');
            return this.getWorkspaceSets(ws_id)
                .then(function(ws_sets) {
                    console.debug('Got list of sets:', ws_sets);
                    _.each(ws_sets.sets,
                        // for each set type, add mappings of {item_id: {set_id : 1, ..}}
                        // to the instance 'setItems' object, and info to 'setInfo'
                        function(set_info) {
                            var set_id = self.itemId(set_info.info),
                                set_item_ids = [];
                            _.each(set_info.items, function(item) {
                                var item_id = self.itemId(item.info);
                                set_item_ids.push(item_id);
                                if (!_.has(self.setItems, item_id)) {
                                    self.setItems[item_id] = {};
                                }
                                self.setItems[item_id][set_id] = 1;
                            });
                            // record item ids, expanded state, etc. for the set
                            self.setInfo[set_id] = {
                                item_ids: set_item_ids,
                                expanded: false,
                                div: null
                            };
                            //console.debug('Added setInfo[' + set_id + ']', self.setInfo[set_id]);
                            // If we make it here, then we are initialized
                            self.setsInitialized = true;
                        });
                    self.initDataListSets();
                    return true;
                }, function(reason) {
                    console.error('Failed to get sets:', reason);
                    return false;
                });
        },

        /**
         * Clear data structures tracking the workspace sets.
         * This will cause the next refresh to fetch new data.
         */
        clearSets: function() {
            this.setItems = {};
            this.setInfo = {};
            this.setsInitialized = false;
        },

        itemIdsInSet: function(set_id) {
            if (this.setViewMode) {
                return this.setInfo[set_id].item_ids;
            }
            else {
                return [];
            }
        },

        /**
         * Get a list of workspace items which are set/group types.
         *
         * @return Promise-wrapped list of items.
         */
        getWorkspaceSets: function(ws_id) {
            try {
                var params = {workspace: '' + ws_id, include_set_item_info: true};
                return this.setAPI.list_sets(params);
            }
            catch(e) {
                return Promise.reject('Cannot get sets for workspace ' + ws_id + ' :' + e);
            }
        },

        /*
            END: Changes for hierarchical data panel (KBASE-4566)
            ----------------------------------------------------
        */

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
            var self = this;

            this.$controllerDiv = $('<div>');
            this.$elem.append(this.$controllerDiv);
            this.renderController();

            this.loadingDiv = DisplayUtil.loadingDiv();
            this.loadingDiv.div.hide();
            this.loadingDiv.div.css({'top': '0', 'bottom': '0'});

            this.mainListId = StringUtil.uuid();
            this.$mainListDiv = $('<div id=' + this.mainListId + '>')
                .css({'overflow-x': 'hidden', 'overflow-y': 'auto', 'height': this.mainListPanelHeight})
                .on('scroll', function () {
                    if ($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) {
                        self.renderMore();
                    }
                });

            this.$addDataButton = $('<span>').addClass('kb-data-list-add-data-button fa fa-plus fa-2x')
                .css({'position': 'absolute', bottom: '15px', right: '25px', 'z-index': '5'})
                .click(function () {
                    self.trigger('hideGalleryPanelOverlay.Narrative');
                    self.trigger('toggleSidePanelOverlay.Narrative', self.options.parentControlPanel.$overlayPanel);
                });
            var $mainListDivContainer = $('<div>').css({'position': 'relative'})
                .append(this.loadingDiv.div)
                .append(this.$mainListDiv)
                .append(this.$addDataButton.hide());
            this.$elem.append($mainListDivContainer);

            if (this._attributes.auth) {
                this.ws = new Workspace(this.options.ws_url, this._attributes.auth);
                this.initSetAPI(this._attributes.auth);
            }

            // listener for refresh
            $(document).on('updateDataList.Narrative', function () {
                self.initSetAPI(this._attributes.auth);
                self.refresh();
            })

            self.initDataListSets();

            if (this.options.ws_name) {
                this.ws_name = this.options.ws_name;
            }

            return this;
        },

        setListHeight: function (height, animate) {
            if (this.$mainListDiv) {
                if (animate) {
                    this.$mainListDiv.animate({'height': height}, this.options.slideTime);
                } else {
                    this.$mainListDiv.css({'height': height});
                }
            }
        },

        /**
         * Initialize Set API
         */
        initSetAPI: function(auth) {
            if (!this.setAPI) {
                var token = {'token': auth.token};
                this.setAPI = new SetAPI(Config.url('service_wizard'), token, null, null, null, '<1.0.0');
            }
            return this.setAPI;
        },

        /**
         * @method loggedInCallback
         * This is associated with the login widget (through the kbaseAuthenticatedWidget parent) and
         * is triggered when a login event occurs.
         * It associates the new auth token with this widget and refreshes the data panel.
         * @private
         */
        loggedInCallback: function (event, auth) {
            this.ws = new Workspace(this.options.ws_url, auth);
            this.serviceClient = new GenericClient(Config.url('service_wizard'), auth);
            this.my_user_id = auth.user_id;
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
        loggedOutCallback: function () {
            this.ws = null;
            this.isLoggedIn = false;
            this.my_user_id = null;
            return this;
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
            // Set the refresh timer on the first refresh. From  here, it'll refresh itself
            // every this.options.refresh_interval (30000) ms
            if (this.refreshTimer === null) {
                this.refreshTimer = setInterval(function () {
                    this.refresh();
                }.bind(this), this.options.refresh_interval); // check if there is new data every X ms
            }

            if (!this.ws_name || !this.ws) {
                console.error('DataList: missing variable(s)');
                console.error('ws_name: ' + this.ws_name);
                console.error('ws: ' + this.ws);
                return;
            }

            Promise.resolve(this.ws.get_workspace_info({
                workspace: this.ws_name
            }))
            .then(function (wsInfo) {
                if (this.wsLastUpdateTimestamp !== wsInfo[3]) {
                    this.wsLastUpdateTimestamp = wsInfo[3];
                    this.maxWsObjId = wsInfo[4];
                    this.showLoading('Fetching data...');
                    this.reloadWsData();
                } else {
                    this.refreshTimeStrings();
                    // this.hideLoading();
                }
            }.bind(this))
            .catch(function (error) {
                console.error('DataList: when checking for updates:', error);
                if (showError) {
                    this.showBlockingError('Error: Unable to connect to KBase data.');
                }
            }.bind(this));
        },

        refreshTimeStrings: function () {
            Object.keys(this.dataObjects).forEach(function(i) {
                if (this.dataObjects[i].$div) {
                    var newTime = TimeFormat.getTimeStampStr(this.dataObjects[i].info[3]);
                    this.dataObjects[i].$div.find('.kb-data-list-date').text(newTime);
                }
            }.bind(this));
        },

        reloadWsData: function () {
            // empty the existing object list first
            this.objData = {};
            this.availableTypes = {};

            this.viewOrder = [];
            this.dataObjects = {};

            this.clearSets();

            this.fetchWorkspaceData()
                .then(function () {
                    // Extract sets
                    var cur_ws_id = this.ws_name;
                    console.debug('extract sets from reloadWsData');
                    this.extractSets(cur_ws_id);

                    // Signal all data channel listeners that we have new data.
                    // TODO: only signal if there are actual changes
                    // TODO: data fetch and sychronization should live as a ui
                    // service, not in a widget.
                    var runtime = Runtime.make();
                    runtime.bus().send({
                        data: JSON.parse(
                                JSON.stringify(
                                    Object.keys(this.dataObjects).map(function (objId) {
                                        return this.dataObjects[objId].info;
                                    }.bind(this))))
                    }, {
                        channel: 'data',
                        key: {
                            type: 'workspace-data-updated'
                        }
                    });
                }.bind(this))
                .then(function () {
                    this.showLoading('Rendering data...');
                    var numObj = Object.keys(this.dataObjects).length;
                    if (numObj > this.options.maxObjsToPreventFilterAsYouTypeInSearch) {
                        this.$searchInput.off('input');
                    }

                    if (numObj <= this.options.max_objs_to_prevent_initial_sort) {
                        this.viewOrder.sort(function (a, b) {
                            if (this.dataObjects[a].info[3] > this.dataObjects[b].info[3]) {
                                return -1;
                            }
                            if (this.dataObjects[a].info[3] < this.dataObjects[b].info[3]) {
                                return 1;
                            }
                            return 0;
                        }.bind(this));
                        this.$elem.find('#nar-data-list-default-sort-label').addClass('active');
                        this.$elem.find('#nar-data-list-default-sort-option').attr('checked');
                    }

                    this.populateAvailableTypes();
                    this.renderList();
                    this.hideLoading();
                    this.trigger('dataUpdated.Narrative');
                }.bind(this));
        },

        /**
         * @method
         * @param {string} error - the error string to show
         *
         * This empties out the main data div and injects an error into it.
         * Used mainly when lookups fail.
         */
        showBlockingError: function (error) {
            this.$mainListDiv.empty();
            this.$mainListDiv.append(
                $('<div>').css({'color': '#F44336', 'margin': '10px'})
                .append(error)
                );
            this.loadingDiv.div.hide();
            this.$mainListDiv.show();
        },

        fetchWorkspaceData: function () {
            // var dataChunkNum = 1;
            // var self = this;

            return Promise.resolve(
                this.serviceClient.sync_call(
                    'NarrativeService.list_objects_with_sets',
                    [{'ws_name': this.ws_name}]
                )
            )
            .then(function(result) {
                result = result[0]['data'];
                console.log('NEW WORKSPACE LIST FUN');
                console.log(result);
                for (var i=0; i<result.length; i++) {
                    var obj = result[i];
                    if (obj.object_info[2].indexOf('KBaseNarrative') === 0) {
                        continue;
                    }

                    var key = StringUtil.uuid();
                    var objId = obj.object_info[0];
                    this.dataObjects[objId] = {
                        key: key,
                        $div: null,
                        info: obj.object_info,
                        attached: false
                    };
                    this.keyToObjId[key] = objId;
                    this.viewOrder.push(objId);

                    var typeKey = obj.object_info[2].split('-')[0];
                    if (!(typeKey in this.objData)) {
                        this.objData[typeKey] = [];
                    }
                    this.objData[typeKey].push(obj.object_info);

                    var typeName = typeKey.split('.')[1];
                    if (!(typeName in this.availableTypes)) {
                        this.availableTypes[typeName] = {
                            type: typeName,
                            count: 0
                        }
                    }
                    this.availableTypes[typeName].count++;
                }
            }.bind(this))
            .catch(function (error) {
                this.showBlockingError(error);
                console.error(error);
                KBError("kbaseNarrativeDataList.getNextDataChunk", error.error.message);
            }.bind(this));

            // return new Promise(function (resolve, reject) {
            //     var getDataChunk = function (minId) {
            //         this.showLoading('Fetching data chunk ' + dataChunkNum + '...');
            //         return Promise.resolve(this.ws.list_objects({
            //             workspaces: [this.ws_name],
            //             includeMetadata: 1,
            //             minObjectID: minId,
            //             maxObjectID: minId + this.options.ws_chunk_size
            //         }))
            //         .then(function (infoList) {
            //             // object_info:
            //             // [0] : obj_id objid
            //             // [1] : obj_name name
            //             // [2] : type_string type
            //             // [3] : timestamp save_date
            //             // [4] : int version
            //             // [5] : username saved_by
            //             // [6] : ws_id wsid
            //             // [7] : ws_name workspace
            //             // [8] : string chsum
            //             // [9] : int size
            //             // [10] : usermeta meta
            //             for (var i = 0; i < infoList.length; i++) {
            //                 // skip narrative objects
            //                 if (infoList[i][2].indexOf('KBaseNarrative') === 0) {
            //                     continue;
            //                 }
            //
            //                 var key = StringUtil.uuid();
            //                 self.dataObjects[infoList[i][0]] = {
            //                     key: key,
            //                     $div: null,
            //                     info: infoList[i],
            //                     attached: false
            //                 };
            //                 self.keyToObjId[key] = infoList[i][0];
            //                 self.viewOrder.push(infoList[i][0]);
            //
            //                 // type is formatted like this: Module.Type-1.0
            //                 // typeKey = Module.Type
            //                 // typeName = Type
            //                 var typeKey = infoList[i][2].split('-')[0];
            //                 if (!(typeKey in self.objData)) {
            //                     self.objData[typeKey] = [];
            //                 }
            //                 self.objData[typeKey].push(infoList[i]);
            //
            //                 var typeName = typeKey.split('.')[1];
            //                 if (!(typeName in self.availableTypes)) {
            //                     self.availableTypes[typeName] = {
            //                         type: typeName,
            //                         count: 0
            //                     };
            //                 }
            //                 self.availableTypes[typeName].count++;
            //             }
            //
            //             /* Do another lookup if all of these conditions are met:
            //              * 1. total object list length < max objs allowed to fetch/render
            //              * 2. theres > 0 objects seen.
            //              * 3. our search space hasn't hit the max object id.
            //              * There's no guarantee that we'll ever see the object with
            //              * max id (it could have been deleted), so keep rolling until
            //              * we either meet how many we're allowed to fetch, or we get
            //              * a query with no objects.
            //              */
            //             if (minId + self.options.ws_chunk_size < self.maxWsObjId &&
            //                 self.viewOrder.length < self.options.ws_max_objs_to_fetch &&
            //                 infoList.length > 0) {
            //                 dataChunkNum++;
            //                 return getDataChunk(minId + 1 + self.options.ws_chunk_size);
            //             }
            //         });
            //     }.bind(this);
            //     getDataChunk(0).then(resolve);
            // }.bind(this))
            // .catch(function (error) {
            //     this.showBlockingError(error);
            //     console.error(error);
            //     KBError("kbaseNarrativeDataList.getNextDataChunk", error.error.message);
            // }.bind(this));
        },

        /**
         * Returns the available object data for a type.
         * If no type is specified (type is falsy), returns all object data
         */
        getObjData: function (type, ignoreVersion) {
            if (type) {
                var dataSet = {};
                if (typeof type === 'string') {
                    type = [type];
                }
                for (var i = 0; i < type.length; i++) {
                    if (this.objData[type[i]]) {
                        dataSet[type[i]] = this.objData[type[i]];
                    }
                }
                return dataSet;
            }
            return this.objData;
        },

        $currentSelectedRow: null,
        selectedObject: null,

        setSelected: function ($selectedRow, object_info) {
            var self = this;
            if (self.$currentSelectedRow) {
                self.$currentSelectedRow.removeClass('kb-data-list-obj-row-selected');
            }
            if (object_info[0] === self.selectedObject) {
                self.$currentSelectedRow = null;
                self.selectedObject = null;
                self.trigger('removeFilterMethods.Narrative');
            }
        },

        addDataControls: function (object_info, $alertContainer) {
            var self = this;
            var $btnToolbar = $('<span>')
                .addClass('btn-group');

            var btnClasses = "btn btn-xs btn-default";
            var css = {'color': '#888'};

            /*.append($('<div>').css({'text-align':'center','margin':'5pt'})
             .append('<a href="'+landingPageLink+'" target="_blank">'+
             'explore data</a>&nbsp&nbsp|&nbsp&nbsp')
             .append('<a href="'+this.options.landing_page_url+'objgraphview/'+object_info[7] +'/'+object_info[1] +'" target="_blank">'+
             'view provenance</a><br>'))*/

            var $filterMethodInput = $('<span>')
                .tooltip({
                    title: 'Show Methods with this as input',
                    container: '#' + this.mainListId,
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .addClass(btnClasses)
                .append($('<span>').addClass('fa fa-sign-in').css(css))
                .click(function (e) {
                    this.trigger('filterMethods.Narrative', 'in_type:' + object_info[2].split('-')[0].split('.')[1]);
                }.bind(this));

            var $filterMethodOutput = $('<span>')
                .tooltip({
                    title: 'Show Methods with this as output',
                    container: '#' + this.mainListId,
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .addClass(btnClasses)
                .append($('<span>').addClass('fa fa-sign-out').css(css))
                .click(function (e) {
                    this.trigger('filterMethods.Narrative', 'out_type:' + object_info[2].split('-')[0].split('.')[1]);
                }.bind(this));


            var $openLandingPage = $('<span>')
                .tooltip({
                    title: 'Explore data',
                    container: '#' + this.mainListId,
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .addClass(btnClasses)
                .append($('<span>').addClass('fa fa-binoculars').css(css))
                .click(function (e) {
                    e.stopPropagation();
                    $alertContainer.empty();
                    var typeTokens = object_info[2].split('-')[0].split('.');
                    var landingPageLink = self.options.lp_url + object_info[6] + '/' + object_info[1];
                    window.open(landingPageLink);
                });

            var $openHistory = $('<span>')
                .addClass(btnClasses).css(css)
                .tooltip({
                    title: 'View history to revert changes',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append($('<span>').addClass('fa fa-history').css(css))
                .click(function (e) {
                    e.stopPropagation();
                    $alertContainer.empty();

                    if (self.ws_name && self.ws) {
                        self.ws.get_object_history({ref: object_info[6] + "/" + object_info[0]},
                            function (history) {
                                $alertContainer.append($('<div>')
                                    .append($('<button>').addClass('kb-data-list-cancel-btn')
                                        .append('Hide History')
                                        .click(function () {
                                            $alertContainer.empty();
                                        })));
                                history.reverse();
                                var $tbl = $('<table>').css({'width': '100%'});
                                for (var k = 0; k < history.length; k++) {
                                    var $revertBtn = $('<button>').append('v' + history[k][4]).addClass('kb-data-list-btn');
                                    if (k == 0) {
                                        $revertBtn.tooltip({
                                            title: 'Current Version',
                                            container: 'body',
                                            placement: 'bottom',
                                            delay: {
                                                show: Config.get('tooltip').showDelay,
                                                hide: Config.get('tooltip').hideDelay
                                            }
                                        });
                                    } else {
                                        var revertRef = {wsid: history[k][6], objid: history[k][0], ver: history[k][4]};
                                        (function (revertRefLocal) {
                                            $revertBtn.tooltip({
                                                title: 'Revert to this version?',
                                                container: 'body',
                                                placement: 'bottom',
                                                delay: {
                                                    show: Config.get('tooltip').showDelay,
                                                    hide: Config.get('tooltip').hideDelay
                                                }
                                            })
                                                .click(function () {
                                                    self.ws.revert_object(revertRefLocal,
                                                        function (reverted_obj_info) {
                                                            self.refresh();
                                                        }, function (error) {
                                                        console.error(error);
                                                        $alertContainer.empty();
                                                        $alertContainer.append($('<span>').css({'color': '#F44336'}).append("Error! " + error.error.message));
                                                    });
                                                });
                                        })(revertRef);
                                    }
                                    $tbl.append($('<tr>')
                                        .append($('<td>').append($revertBtn))
                                        .append($('<td>').append('Saved by ' + history[k][5] + '<br>' + TimeFormat.getTimeStampStr(history[k][3])))
                                        .append($('<td>').append($('<span>').css({margin: '4px'}).addClass('fa fa-info pull-right'))
                                            .tooltip({
                                                title: history[k][2] + '<br>' + history[k][8] + '<br>' + history[k][9] + ' bytes',
                                                container: 'body',
                                                html: true,
                                                placement: 'bottom',
                                                delay: {
                                                    show: Config.get('tooltip').showDelay,
                                                    hide: Config.get('tooltip').hideDelay
                                                }
                                            })
                                        ));
                                }
                                $alertContainer.append($tbl);
                            },
                            function (error) {
                                console.error(error);
                                $alertContainer.empty();
                                $alertContainer.append($('<span>').css({'color': '#F44336'}).append("Error! " + error.error.message));
                            });
                    }


                });

            var $openProvenance = $('<span>')
                .addClass(btnClasses).css(css)
                .tooltip({
                    title: 'View data provenance and relationships',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append($('<span>').addClass('fa fa-sitemap fa-rotate-90').css(css))
                .click(function (e) {
                    e.stopPropagation();
                    $alertContainer.empty();
                    window.open('/#objgraphview/' + object_info[7] + '/' + object_info[1]);
                });
            var $download = $('<span>')
                .addClass(btnClasses).css(css)
                .tooltip({
                    title: 'Export / Download data',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append($('<span>').addClass('fa fa-download').css(css))
                .click(function (e) {
                    e.stopPropagation();
                    $alertContainer.empty();
                    var type = object_info[2].split('-')[0];
                    var wsId = object_info[7];
                    var objId = object_info[1];
                    var downloadPanel = $('<div>');
                    $alertContainer.append(downloadPanel);
                    new kbaseNarrativeDownloadPanel(downloadPanel, {
                        token: self._attributes.auth.token, type: type, wsId: wsId, objId: objId,
                        downloadSpecCache: self.downloadSpecCache});
                });

            var $rename = $('<span>')
                .addClass(btnClasses).css(css)
                .tooltip({
                    title: 'Rename data',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append($('<span>').addClass('fa fa-font').css(css))
                .click(function (e) {
                    e.stopPropagation();
                    $alertContainer.empty();
                    var $newNameInput = $('<input type="text">')
                        .addClass('form-control')
                        .val(object_info[1])
                        .on('focus', function () {
                            if (Jupyter && Jupyter.narrative) {
                                Jupyter.narrative.disableKeyboardManager();
                            }
                        })
                        .on('blur', function () {
                            if (Jupyter && Jupyter.narrative) {
                                Jupyter.narrative.enableKeyboardManager();
                            }
                        });
                    $alertContainer.append($('<div>')
                        .append($('<div>').append("Warning: Apps using the old name may break."))
                        .append($('<div>').append($newNameInput))
                        .append($('<button>').addClass('kb-data-list-btn')
                            .append('Rename')
                            .click(function () {
                                if (self.ws_name && self.ws) {
                                    self.ws.rename_object({
                                        obj: {ref: object_info[6] + "/" + object_info[0]},
                                        new_name: $newNameInput.val()
                                    },
                                        function (renamed_info) {
                                            self.refresh();
                                        },
                                        function (error) {
                                            console.error(error);
                                            $alertContainer.empty();
                                            $alertContainer.append($('<span>').css({'color': '#F44336'}).append("Error! " + error.error.message));
                                        });
                                }
                            }))
                        .append($('<button>').addClass('kb-data-list-cancel-btn')
                            .append('Cancel')
                            .click(function () {
                                $alertContainer.empty();
                            })));
                });
            var $delete = $('<span>')
                .addClass(btnClasses).css(css)
                .tooltip({
                    title: 'Delete data',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append($('<span>').addClass('fa fa-trash-o').css(css))
                .click(function (e) {
                    e.stopPropagation();
                    $alertContainer.empty();
                    $alertContainer.append($('<div>')
                        .append($('<span>').append('Are you sure?'))
                        .append($('<button>').addClass('kb-data-list-btn')
                            .append('Delete')
                            .click(function () {
                                if (self.ws_name && self.ws) {
                                    self.ws.rename_object({
                                        obj: {ref: object_info[6] + "/" + object_info[0]},
                                        new_name: object_info[1].split('-deleted-')[0] + "-deleted-" + (new Date()).getTime()
                                    },
                                        function (renamed_info) {
                                            self.ws.delete_objects([{ref: object_info[6] + "/" + object_info[0]}],
                                                function () {
                                                    self.refresh();
                                                },
                                                function (error) {
                                                    console.error(error);
                                                    $alertContainer.empty();
                                                    $alertContainer.append($('<span>').css({'color': '#F44336'}).append("Error! " + error.error.message));
                                                });
                                        },
                                        function (error) {
                                            console.error(error);
                                            $alertContainer.empty();
                                            $alertContainer.append($('<span>').css({'color': '#F44336'}).append("Error! " + error.error.message));
                                        });
                                }
                            }))
                        .append($('<button>').addClass('kb-data-list-cancel-btn')
                            .append('Cancel')
                            .click(function () {
                                $alertContainer.empty();
                            })));
                });

            if (!Jupyter.narrative.readonly) {
                $btnToolbar.append($filterMethodInput)
                    .append($filterMethodOutput);
            }
            $btnToolbar.append($openLandingPage);
            if (!Jupyter.narrative.readonly)
                $btnToolbar.append($openHistory);
            $btnToolbar.append($openProvenance);
            if (!Jupyter.narrative.readonly) {
                $btnToolbar.append($download)
                    .append($rename)
                    .append($delete);
            }

            return $btnToolbar;
        },
        /**
         * This is the main function for rendering a data object
         * in the data list.
         */
        renderObjectRowDiv: function (object_info, object_key) {
            var self = this;
            // object_info:
            // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
            // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
            // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
            // [9] : int size // [10] : usermeta meta
            var type_tokens = object_info[2].split('.');
            var type_module = type_tokens[0];
            var type = type_tokens[1].split('-')[0];
            var unversioned_full_type = type_module + '.' + type;
            var $logo = $('<div>');
            var is_set = this.isASet(object_info);

            // Remember the icons
            var data_icon_param = {elt: $logo, type: type, stacked: is_set, indent: 0};
            Icon.buildDataIcon($logo, type, is_set, 0);

            // Save params for this icon, so we can update later when sets get "discovered"
            this.dataIconParam[this.itemId(object_info)] = data_icon_param;
            // add behavior
            $logo.click(function (e) {
                e.stopPropagation();
                // For sets, click toggles -- everything else, adds a viewer (?!)
                if (self.isAViewedSet(object_info)) {
                    var is_expanded = self.toggleSetExpanded(object_info);
                    self.renderList();
                }
                else {
                   self.insertViewer(object_key);
                }
            });

            var shortName = object_info[1];
            var isShortened = false;
            if (shortName.length > this.options.max_name_length) {
                shortName = shortName.substring(0, this.options.max_name_length - 3) + '...';
                isShortened = true;
            }
            var $name = $('<span>').addClass("kb-data-list-name").append('<a>' + shortName + '</a>')
                .css({'cursor': 'pointer'})
                .click(function (e) {
                    e.stopPropagation();
                    self.insertViewer(object_key);
                });
            if (isShortened) {
                $name.tooltip({
                    title: object_info[1],
                    placement: 'bottom',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                });
            }

            var $version = $('<span>').addClass("kb-data-list-version").append('v' + object_info[4]);
            var $type = $('<div>').addClass("kb-data-list-type").append(type);

            var $date = $('<span>').addClass("kb-data-list-date").append(TimeFormat.getTimeStampStr(object_info[3]));
            var $byUser = $('<span>').addClass("kb-data-list-edit-by");
            if (object_info[5] !== self.my_user_id) {
                $byUser.append(' by ' + object_info[5])
                    .click(function (e) {
                        e.stopPropagation();
                        window.open('/#people/' + object_info[5]);
                    });
            }
            var metadata = object_info[10];
            var metadataText = '';
            for (var key in metadata) {
                if (metadata.hasOwnProperty(key)) {
                    metadataText += '<tr><th>' + key + '</th><td>' + metadata[key] + '</td></tr>';
                }
            }
            if (type === 'Genome' || type === 'GenomeAnnotation') {
                if (metadata.hasOwnProperty('Name')) {
                    $type.text(type + ': ' + metadata['Name']);
                }
            }

            var $savedByUserSpan = $('<td>').addClass('kb-data-list-username-td');
            DisplayUtil.displayRealName(object_info[5], $savedByUserSpan);

            var $alertDiv = $('<div>').css({'text-align': 'center', 'margin': '10px 0px'});
            var typeLink = '<a href="/#spec/module/' + type_module + '" target="_blank">' + type_module + "</a>.<wbr>" +
                '<a href="/#spec/type/' + object_info[2] + '" target="_blank">' + (type_tokens[1].replace('-', '&#8209;')) + '.' + type_tokens[2] + '</a>';
            var $moreRow = $('<div>').addClass("kb-data-list-more-div").hide()
                .append($('<div>').css({'text-align': 'center', 'margin': '5pt'})
                    .append(self.addDataControls(object_info, $alertDiv)).append($alertDiv))
                .append(
                    $('<table style="width:100%;">')
                    .append("<tr><th>Permament Id</th><td>" + object_info[6] + "/" + object_info[0] + "/" + object_info[4] + '</td></tr>')
                    .append("<tr><th>Full Type</th><td>" + typeLink + '</td></tr>')
                    .append($('<tr>').append('<th>Saved by</th>').append($savedByUserSpan))
                    .append(metadataText));

            var $toggleAdvancedViewBtn =
                $('<span>').addClass("kb-data-list-more")//.addClass('btn btn-default btn-xs kb-data-list-more-btn')
                .hide()
                .html($('<button class="btn btn-xs btn-default pull-right" aria-hidden="true">').append('<span class="fa fa-ellipsis-h" style="color:#888" />'));
            var toggleAdvanced = function () {
                if (self.selectedObject === object_info[0] && $moreRow.is(':visible')) {
                    // assume selection handling occurs before this is called
                    // so if we are now selected and the moreRow is visible, leave it...
                    return;
                }
                if ($moreRow.is(':visible')) {
                    $moreRow.slideUp('fast');
                    //$toggleAdvancedViewBtn.show();
                } else {
                    self.getRichData(object_info, $moreRow);
                    $moreRow.slideDown('fast');
                    //$toggleAdvancedViewBtn.hide();
                }
            };

            var $mainDiv = $('<div>').addClass('kb-data-list-info').css({padding: '0px', margin: '0px'})
                .append($name).append($version).append('<br>')
                .append($('<table>').css({width: '100%'})
                    .append($('<tr>')
                        .append($('<td>').css({width: '80%'})
                            .append($type).append($date).append($byUser))
                        .append($('<td>')
                            .append($toggleAdvancedViewBtn))))
                .click(
                    function () {
                        self.setSelected($(this).closest('.kb-data-list-obj-row'), object_info);
                        toggleAdvanced();
                    });

            var $topTable = $('<table>').attr('kb-oid', object_key)
                .css({'width': '100%', 'background': '#fff'})  // set background to white looks better on DnD
                .append($('<tr>')
                    // logo
                    .append($('<td>')
                        .css({'width': '15%'})
                        .append($logo))
                    // main content
                    .append($('<td>')
                        .append($mainDiv)));

            var $row = $('<div>').addClass('kb-data-list-obj-row')
                .append($('<div>').addClass('kb-data-list-obj-row-main')
                    .append($topTable))
                .append($moreRow)
                // show/hide ellipses on hover, show extra info on click
                .mouseenter(function () {
                    $toggleAdvancedViewBtn.show();
                })
                .mouseleave(function () {
                    $toggleAdvancedViewBtn.hide();
                });


            // Drag and drop
            this.addDragAndDrop($topTable);

            // +---+
            // |   | Containing "box" is the top-level <div>
            // +---+

            var $box = $('<div>').addClass('kb-data-list-box');

            // add a separator
            $box.append($('<hr>')
                .addClass('kb-data-list-row-hr')
                .css({'margin-left': '65px'}));

            // add the row
            $box.append($row);

            return $box;
        },


        renderObjectRowDivxx: function (object_info, object_key) {
            var self = this;
            // object_info:
            // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
            // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
            // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
            // [9] : int size // [10] : usermeta meta
            var type_tokens = object_info[2].split('.');
            var type_module = type_tokens[0];
            var type = type_tokens[1].split('-')[0];
            var unversioned_full_type = type_module + '.' + type;
            var $logo = $('<div>');
            var is_set = this.isASet(object_info);

            var templateInfo = {
                kbOid: '',
                objName: type,
                lastUpdate: '',
                lastEditBy: '',
                objRef: '',
                typeModule: type_module,
                fullType: object_info[2],
                versionedType: type + '-'
            }


            // Remember the icons
            var data_icon_param = {elt: $logo, type: type, stacked: is_set, indent: 0};
            Icon.buildDataIcon($logo, type, is_set, 0);

            // Save params for this icon, so we can update later when sets get "discovered"
            this.dataIconParam[this.itemId(object_info)] = data_icon_param;
            // add behavior
            $logo.click(function (e) {
                e.stopPropagation();
                // For sets, click toggles -- everything else, adds a viewer (?!)
                if (self.isAViewedSet(object_info)) {
                    var is_expanded = self.toggleSetExpanded(object_info);
                    self.renderList();
                }
                else {
                   self.insertViewer(object_key);
                }
            });

            var shortName = object_info[1];
            var isShortened = false;
            if (shortName.length > this.options.max_name_length) {
                shortName = shortName.substring(0, this.options.max_name_length - 3) + '...';
                isShortened = true;
            }
            var $name = $('<span>').addClass("kb-data-list-name").append('<a>' + shortName + '</a>')
                .css({'cursor': 'pointer'})
                .click(function (e) {
                    e.stopPropagation();
                    self.insertViewer(object_key);
                });
            if (isShortened) {
                $name.tooltip({
                    title: object_info[1],
                    placement: 'bottom',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                });
            }

            var $version = $('<span>').addClass("kb-data-list-version").append('v' + object_info[4]);
            var $type = $('<div>').addClass("kb-data-list-type").append(type);

            var $date = $('<span>').addClass("kb-data-list-date").append(TimeFormat.getTimeStampStr(object_info[3]));
            var $byUser = $('<span>').addClass("kb-data-list-edit-by");
            if (object_info[5] !== self.my_user_id) {
                $byUser.append(' by ' + object_info[5])
                    .click(function (e) {
                        e.stopPropagation();
                        window.open('/#people/' + object_info[5]);
                    });
            }
            var metadata = object_info[10];
            var metadataText = '';
            for (var key in metadata) {
                if (metadata.hasOwnProperty(key)) {
                    metadataText += '<tr><th>' + key + '</th><td>' + metadata[key] + '</td></tr>';
                }
            }
            if (type === 'Genome' || type === 'GenomeAnnotation') {
                if (metadata.hasOwnProperty('Name')) {
                    $type.text(type + ': ' + metadata['Name']);
                }
            }

            var $savedByUserSpan = $('<td>').addClass('kb-data-list-username-td');
            DisplayUtil.displayRealName(object_info[5], $savedByUserSpan);

            var $alertDiv = $('<div>').css({'text-align': 'center', 'margin': '10px 0px'});
            var typeLink = '<a href="/#spec/module/' + type_module + '" target="_blank">' + type_module + "</a>.<wbr>" +
                '<a href="/#spec/type/' + object_info[2] + '" target="_blank">' + (type_tokens[1].replace('-', '&#8209;')) + '.' + type_tokens[2] + '</a>';
            var $moreRow = $('<div>').addClass("kb-data-list-more-div").hide()
                .append($('<div>').css({'text-align': 'center', 'margin': '5pt'})
                    .append(self.addDataControls(object_info, $alertDiv)).append($alertDiv))
                .append(
                    $('<table style="width:100%;">')
                    .append("<tr><th>Permament Id</th><td>" + object_info[6] + "/" + object_info[0] + "/" + object_info[4] + '</td></tr>')
                    .append("<tr><th>Full Type</th><td>" + typeLink + '</td></tr>')
                    .append($('<tr>').append('<th>Saved by</th>').append($savedByUserSpan))
                    .append(metadataText));

            var $toggleAdvancedViewBtn =
                $('<span>').addClass("kb-data-list-more")//.addClass('btn btn-default btn-xs kb-data-list-more-btn')
                .hide()
                .html($('<button class="btn btn-xs btn-default pull-right" aria-hidden="true">').append('<span class="fa fa-ellipsis-h" style="color:#888" />'));
            var toggleAdvanced = function () {
                if (self.selectedObject === object_info[0] && $moreRow.is(':visible')) {
                    // assume selection handling occurs before this is called
                    // so if we are now selected and the moreRow is visible, leave it...
                    return;
                }
                if ($moreRow.is(':visible')) {
                    $moreRow.slideUp('fast');
                    //$toggleAdvancedViewBtn.show();
                } else {
                    self.getRichData(object_info, $moreRow);
                    $moreRow.slideDown('fast');
                    //$toggleAdvancedViewBtn.hide();
                }
            };

            var $mainDiv = $('<div>').addClass('kb-data-list-info').css({padding: '0px', margin: '0px'})
                .append($name).append($version).append('<br>')
                .append($('<table>').css({width: '100%'})
                    .append($('<tr>')
                        .append($('<td>').css({width: '80%'})
                            .append($type).append($date).append($byUser))
                        .append($('<td>')
                            .append($toggleAdvancedViewBtn))))
                .click(
                    function () {
                        self.setSelected($(this).closest('.kb-data-list-obj-row'), object_info);
                        toggleAdvanced();
                    });

            var $topTable = $('<table>').attr('kb-oid', object_key)
                .css({'width': '100%', 'background': '#fff'})  // set background to white looks better on DnD
                .append($('<tr>')
                    // logo
                    .append($('<td>')
                        .css({'width': '15%'})
                        .append($logo))
                    // main content
                    .append($('<td>')
                        .append($mainDiv)));

            var $row = $('<div>').addClass('kb-data-list-obj-row')
                .append($('<div>').addClass('kb-data-list-obj-row-main')
                    .append($topTable))
                .append($moreRow)
                // show/hide ellipses on hover, show extra info on click
                .mouseenter(function () {
                    $toggleAdvancedViewBtn.show();
                })
                .mouseleave(function () {
                    $toggleAdvancedViewBtn.hide();
                });


            // Drag and drop
            this.addDragAndDrop($topTable);

            // +---+
            // |   | Containing "box" is the top-level <div>
            // +---+

            var $box = $('<div>').addClass('kb-data-list-box');

            // add a separator
            $box.append($('<hr>')
                .addClass('kb-data-list-row-hr')
                .css({'margin-left': '65px'}));

            // add the row
            $box.append($row);

            return $box;
        },


        // ============= DnD ==================

        addDropZone: function (container, targetCell, isBelow) {
            var targetDiv = document.createElement('div'),
                self = this;

            targetDiv.classList.add('kb-data-list-drag-target');
            targetDiv.innerHTML = '<i>drop data object here</i>';
            targetDiv.addEventListener('dragover', function (e) {
                e.target.classList.add('-drag-active');
                e.preventDefault();
            });
            targetDiv.addEventListener('dragenter', function (e) {
                e.target.classList.add('-drag-hover');
                e.preventDefault();
            });
            targetDiv.addEventListener('dragleave', function (e) {
                e.target.classList.remove('-drag-hover');
                e.target.classList.remove('-drag-active');
                e.preventDefault();
            });
            targetDiv.addEventListener('drop', function (e) {
                var data = JSON.parse(e.dataTransfer.getData('info')),
                    obj = self.dataObjects[self.keyToObjId[data.key]],
                    info = self.createInfoObject(obj.info),
                    cell, cellIndex, placement;

                if (e.target.getAttribute('cellIs') === 'below') {
                    cell = $(e.target.nextSibling).data().cell;
                    placement = 'above';
                } else {
                    cell = $(e.target.previousSibling).data().cell;
                    placement = 'below';
                }
                cellIndex = Jupyter.notebook.find_cell_index(cell);

                $(document).trigger('createViewerCell.Narrative', {
                    nearCellIdx: cellIndex,
                    widget: 'kbaseNarrativeDataCell',
                    info: info,
                    placement: placement
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
            var node = $row.parent().get(0),
                key = $row.attr('kb-oid'),
                obj = this.dataObjects[this.keyToObjId[key]], //_.findWhere(this.objectList, {key: key}),
                info = this.createInfoObject(obj.info),
                data = {
                    widget: 'kbaseNarrativeDataCell',
                    info: info,
                    key: key
                },
            dataString = JSON.stringify(data),
                self = this;

            node.setAttribute('draggable', true);

            node.addEventListener('dragstart', function (e) {
                e.dataTransfer.dropEffect = 'copy';
                e.dataTransfer.setData('info', dataString);

                // e.target.style.border = "3px red solid";
                var targetCells = document.querySelectorAll('#notebook-container .cell');
                var container = document.querySelector('#notebook-container');
                for (var i = 0; i < targetCells.length; i += 1) {
                    self.addDropZone(container, targetCells.item(i));
                    if (i === targetCells.length - 1) {
                        self.addDropZone(container, targetCells.item(i), true);
                    }
                }
            });

            node.addEventListener('dragend', function () {
                var container = document.querySelector('#notebook-container'),
                    targetCells = document.querySelectorAll('#notebook-container .kb-data-list-drag-target');
                for (var i = 0; i < targetCells.length; i += 1) {
                    var targetCell = targetCells.item(i);
                    container.removeChild(targetCell);
                }
            });

            // Add tooltip to indicate this functionality
            $row.attr({
                'data-toggle': 'tooltip',
                'title': 'Drag onto narrative &rarr;'
            });

            $row.tooltip({
                delay: {
                    show: Config.get('tooltip').showDelay,
                    hide: Config.get('tooltip').hideDelay
                },
                placement: 'top auto',
                html: true,
                viewport: {
                    selector: '#kb-side-panel .kb-narr-side-panel:nth-child(1) .kb-narr-panel-body',
                    padding: 2
                }
            });

            return this;
        },
        /**
         * Helper function to create named object attrs from
         * list of fields returned from Workspace service.
         */
        createInfoObject: function (info) {
            return _.object(['id', 'name', 'type', 'save_date', 'version',
                'saved_by', 'ws_id', 'ws_name', 'chsum', 'size',
                'meta'], info);
        },
        // ============= end DnD ================

        insertViewer: function (key) {
            var cell = Jupyter.notebook.get_selected_cell(),
                near_idx = 0;
            if (cell) {
                near_idx = Jupyter.notebook.find_cell_index(cell);
                $(cell.element).off('dblclick');
                $(cell.element).off('keydown');
            }
            var obj = this.dataObjects[this.keyToObjId[key]], // _.findWhere(self.objectList, {key: key});
                info = self.createInfoObject(obj.info);
            // Insert the narrative data cell into the div we just rendered
            // new kbaseNarrativeDataCell($('#' + cell_id), {cell: cell, info: info});
            self.trigger('createViewerCell.Narrative', {
                'nearCellIdx': near_idx,
                'widget': 'kbaseNarrativeDataCell',
                'info': info
            });
        },

        renderMore: function () {
            if (!this.searchFilterOn) { // if search filter is off, then we just are showing everything
                var start = this.n_objs_rendered;
                var limit = start + this.options.objs_to_render_on_scroll;
                for (var i = start;
                     (i < this.viewOrder.length) && (this.n_objs_rendered < limit);
                     i++) {
                    this.n_objs_rendered += this.attachObjectAtIndex(i);
                }
            } else {
                // search filter is on, so we have to base this on what is currently filtered
                var start = this.n_filteredObjsRendered;
                for (var i = start; i < this.currentMatch.length; i++) {
                    // only show them as we scroll to them
                    if (this.n_filteredObjsRendered >= start + this.options.objs_to_render_on_scroll) {
                        break;
                    }
                    this.attachObject(this.currentMatch[i]);
                    this.n_filteredObjsRendered++;
                }
            }
        },

        /**
         * Attach one object from the list to the datalist *if* it is not in a set,
         * or expanded in a set. Determine where to attach the object in the hierarchy, and pass
         * this information to the attachObject() function.
         *
         * @param i Index of object in this.viewOrder
         */
        attachObjectAtIndex: function(i) {
            var obj_info = this.dataObjects[this.viewOrder[i]].info,
                rendered = false,
                self = this;

            if (this.inAnySet(obj_info)) {
                var parents = this.getItemParents(obj_info);
                if (parents.length === 0 ) {
                    console.debug(i + ': Error! No parent found');
                }
                else if (_.some(_.pluck(parents, 'expanded'))) {
                    _.each(_.filter(parents, function(p) { return p.expanded; }),
                        function(p) {
                            self.attachObject(self.dataObjects[this.viewOrder[i]], p.div);
                        });
                    rendered = true;
                }
                else {
                    //console.debug( i + ': Set not expanded');
                }
            }
            else {
                //console.debug(i + ' not in any set:', obj_info);
                //console.debug('attaching object #' + i);
                this.attachObject(this.dataObjects[this.viewOrder[i]], null);
                rendered = true;
            }
            return rendered;
        },

        /**
         * Add an object to the list.
         *
         * @param obj Object to attach (one item from this.dataObjects)
         * @param $parentDiv Parent 'div' to which to add.
         *        If null, use default main list 'div'.
         */
        attachObject: function (obj, $parentDiv) {
            if (obj.attached) {
                return;
            }
            if (!$parentDiv) {
                $parentDiv = this.$mainListDiv;
            }
            if (obj.$div) {
                $parentDiv.append(obj.$div.clone(true));
                // $parentDiv.append(obj.$div);
            } else {
                obj.$div = this.renderObjectRowDiv(obj.info, obj.key);
                $parentDiv.append(obj.$div);
                var set_info = this.getSetInfo(obj.info);
                if (set_info !== undefined) {
                    set_info.div = obj.$div;
                    var type = obj.info[2].split('.')[1].split('-')[0]; // split type-string like KBaseFile.PairedEndLibrary-2.0
                    console.debug('update dataIcon for set object', obj);
                    Icon.overwriteDataIcon({elt: set_info.div, type: type, stacked: true});
                }
            }
            obj.attached = true;
            this.n_objs_rendered++;
        },

        detachAllRows: function () {
            for (var i = 0; i < this.viewOrder.length; i++) {
                this.detachRow(i);
            }
            this.$mainListDiv.children().detach();
            this.n_objs_rendered = 0;
            this.renderedAll = false;
        },
        detachRow: function (index) {
            if (this.dataObjects[this.viewOrder[index]].attached) {
                if (this.dataObjects[this.viewOrder[index]].$div) {
                    this.dataObjects[this.viewOrder[index]].$div.detach();
                }
                this.dataObjects[this.viewOrder[index]].attached = false;
                this.n_objs_rendered--;
            }
        },

        renderList: function () {
            var self = this;

            self.detachAllRows();
            self.n_objs_rendered = 0;

            var indent_value = self.setViewMode ? 1 : 0; // new value

            if (self.viewOrder.length > 0) {
                var limit = self.options.objs_to_render_to_start;
                // XXX: Hack, part 1: Find expanded sets, and "reserve" rendering for them.
                // Also fix rendering of set logos.
                var exp_sets = {};
                for (i=0; i < self.viewOrder.length; i++) {
                    var cur_obj = self.dataObjects[self.viewOrder[i]];
                    var cur_obj_id = self.itemId(cur_obj.info);
                    // check whether expanded
                    if (self.isAViewedSet(cur_obj.info) && self.getSetInfo(cur_obj.info).expanded) {
                        exp_sets[i] = true; // save index needed for attachObjectAtIndex()
                    }
                    // modify indentation
                    else if (self.setViewMode && self.inAnySet(cur_obj.info)) {
                        self.dataIconParam[cur_obj_id].indent = indent_value;
                        Icon.overwriteDataIcon(self.dataIconParam[cur_obj_id]);
                    }
                    // Any non-zero indent not in setView mode, should go to zero
                    else if (!self.setViewMode && self.dataIconParam[cur_obj_id] !== undefined &&
                        self.dataIconParam[cur_obj_id].indent !== 0) {
                        self.dataIconParam[cur_obj_id].indent = 0;
                        Icon.overwriteDataIcon(self.dataIconParam[cur_obj_id]);
                    }
                }

                limit -= _.keys(exp_sets).length; // reserve space

                for (var i = 0;
                     i < self.viewOrder.length && (self.n_objs_rendered < limit);
                     i++) {

                    var cur_obj = self.dataObjects[self.viewOrder[i]];
                    var cur_obj_id = self.itemId(cur_obj.info);
                    // If object does not have a key, define one.
                    // This will be used for 'id' of rendered element.
                    // But do *not* replace an existing key.
                    if (cur_obj.key === undefined) {
                        cur_obj.key = StringUtil.uuid();
                        this.keyToObjId[cur_obj.key] = cur_obj_id;
                    }

                    self.n_objs_rendered += self.attachObjectAtIndex(i);
                    // XXX: Hack, part 1.5: Remove from "reserved" exp sets
                    if (_.has(exp_sets, i)) {
                        delete exp_sets[i];
                        limit++; // un-reserve space
                    }
                }

                // XXX: Hack, part deux: Add the expanded sets
                _.each(_.keys(exp_sets), function(i) {
                    self.n_objs_rendered += self.attachObjectAtIndex(i);
                });

                if (Jupyter.narrative.readonly) {
                    self.$addDataButton.hide();
                } else {
                    self.$addDataButton.show();
                }

            } else {
                var $noDataDiv = $('<div>')
                    .css({'text-align': 'center', 'margin': '20pt'})
                    .append('This Narrative has no data yet.<br><br>');
                if (Jupyter && Jupyter.narrative && !Jupyter.narrative.readonly) {
                    $noDataDiv.append($("<button>")
                        .append('Add Data')
                        .addClass('kb-data-list-add-data-text-button')
                        .css({'margin': '20px'})
                        .click(function () {
                            self.trigger('hideGalleryPanelOverlay.Narrative');
                            self.trigger('toggleSidePanelOverlay.Narrative', self.options.parentControlPanel.$overlayPanel);
                        }));
                    self.$addDataButton.hide();
                }
                self.$mainListDiv.append($noDataDiv);
                // only show up to the given number
            }
        },

        renderController: function () {
            var self = this;

            var $byDate = $('<label id="nar-data-list-default-sort-label" class="btn btn-default">').addClass('btn btn-default')
                .append($('<input type="radio" name="options" id="nar-data-list-default-sort-option" autocomplete="off">'))
                .append("date")
                .on('click', function () {
                    self.sortData(function (a, b) {
                        if (self.dataObjects[a].info[3] > self.dataObjects[b].info[3])
                            return -1; // sort by date
                        if (self.dataObjects[a].info[3] < self.dataObjects[b].info[3])
                            return 1;  // sort by date
                        return 0;
                    });
                });

            var $byName = $('<label class="btn btn-default">')
                .append($('<input type="radio" name="options" id="option2" autocomplete="off">'))
                .append("name")
                .on('click', function () {
                    self.sortData(function (a, b) {
                        if (self.dataObjects[a].info[1].toUpperCase() < self.dataObjects[b].info[1].toUpperCase())
                            return -1; // sort by name
                        if (self.dataObjects[a].info[1].toUpperCase() > self.dataObjects[b].info[1].toUpperCase())
                            return 1;
                        return 0;
                    });
                });

            var $byType = $('<label class="btn btn-default">')
                .append($('<input type="radio" name="options" id="option3" autocomplete="off">'))
                .append("type")
                .on('click', function () {
                    self.sortData(function (a, b) {
                        if (self.dataObjects[a].info[2].toUpperCase() > self.dataObjects[b].info[2].toUpperCase())
                            return -1; // sort by type
                        if (self.dataObjects[a].info[2].toUpperCase() < self.dataObjects[b].info[2].toUpperCase())
                            return 1;
                        return 0;
                    });
                });
            var $upOrDown = $('<button class="btn btn-default btn-sm" type="button">').css({'margin-left': '5px'})
                .append('<span class="glyphicon glyphicon-sort" style="color:#777" aria-hidden="true" />')
                .on('click', function () {
                    self.reverseData();
                });

            var $sortByGroup = $('<div data-toggle="buttons">')
                .addClass("btn-group btn-group-sm")
                .css({"margin": "2px"})
                .append($byDate)
                .append($byName)
                .append($byType);

            /** Set view mode toggle */
            var viewModeDisableCtl = ['search', 'sort', 'filter'];
            self.viewModeDisableHnd = {};
            var $viewMode = $('<span>')
                .addClass('btn btn-xs btn-default kb-data-list-ctl')
                .attr('id', 'kb-data-list-hierctl')
                .tooltip({
                    title: 'Hierarchical view',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append('<span class="fa fa-copy"></span>')
                .on('click', function () {
                    if (self.setViewMode) {
                        // Turn OFF set view mode
                        self.setViewMode = false;
                        self.renderList();
                        $('#kb-data-list-hierctl').removeAttr('enabled');
                        // re-enable other controls
                        _.each(viewModeDisableCtl, function(ctl) {
                            var ctl_id = '#kb-data-list-' + ctl + 'ctl';
                            $(ctl_id + ' span').removeClass('inviso');
                            $(ctl_id).on('click', self.controlClickHnd[ctl]);
                        });
                    }
                    else {
                        // Turn ON set view mode
                        self.setViewMode = true;
                        self.renderList();
                        $('#kb-data-list-hierctl').attr('enabled', '1');
                        // disable some other controls
                        _.each(viewModeDisableCtl, function(ctl) {
                            var ctl_id = '#kb-data-list-' + ctl + 'ctl';
                            $(ctl_id + ' span').addClass('inviso');
                            $(ctl_id).off('click');
                        });
                    }
                });

            // Search control
            self.controlClickHnd.search = function () {
                if (!self.$searchDiv.is(':visible')) {
                    self.$sortByDiv.hide({effect: 'blind', duration: 'fast'});
                    self.$filterTypeDiv.hide({effect: 'blind', duration: 'fast'});
                    self.$searchDiv.show({effect: 'blind', duration: 'fast'});
                    self.$searchInput.focus();
                } else {
                    self.$searchDiv.hide({effect: 'blind', duration: 'fast'});
                }
            }
            var $openSearch = $('<span>')
                .addClass('btn btn-xs btn-default kb-data-list-ctl')
                .attr('id', 'kb-data-list-searchctl')
                .tooltip({
                    title: 'Search data in narrative',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append('<span class="fa fa-search"></span>')
                .on('click', self.controlClickHnd.search);

            // Sort control
            self.controlClickHnd.sort = function () {
                if (!self.$sortByDiv.is(':visible')) {
                    self.$searchDiv.hide({effect: 'blind', duration: 'fast'});
                    self.$filterTypeDiv.hide({effect: 'blind', duration: 'fast'});
                    self.$sortByDiv.show({effect: 'blind', duration: 'fast'});
                } else {
                    self.$sortByDiv.hide({effect: 'blind', duration: 'fast'});
                }
            };
            var $openSort = $('<span>')
                .addClass('btn btn-xs btn-default kb-data-list-ctl')
                .attr('id', 'kb-data-list-sortctl')
                .tooltip({
                    title: 'Sort data list',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append('<span class="fa fa-sort-amount-asc"></span>')
                .on('click', self.controlClickHnd.sort);

            // Filter control
            self.controlClickHnd.filter = function () {
                if (!self.$filterTypeDiv.is(':visible')) {
                    self.$sortByDiv.hide({effect: 'blind', duration: 'fast'});
                    self.$searchDiv.hide({effect: 'blind', duration: 'fast'});
                    self.$filterTypeDiv.show({effect: 'blind', duration: 'fast'});
                } else {
                    self.$filterTypeDiv.hide({effect: 'blind', duration: 'fast'});
                }
            };
            var $openFilter = $('<span>')
                .addClass('btn btn-xs btn-default kb-data-list-ctl')
                .attr('id', 'kb-data-list-filterctl')
                .tooltip({
                    title: 'Filter data by type',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append('<span class="fa fa-filter"></span>')
                .on('click', self.controlClickHnd.filter);

            // Refresh control
            var $refreshBtn = $('<span>')
                .addClass('btn btn-xs btn-default')
                .tooltip({
                    title: 'Refresh data list',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append('<span class="glyphicon glyphicon-refresh"></span>')
                .on('click', function () {
                    self.refresh();
                });
            self.$searchInput = $('<input type="text">')
                .attr('Placeholder', 'Search in your data')
                .addClass('form-control')
                .on('focus', function () {
                    if (Jupyter && Jupyter.narrative) {
                        Jupyter.narrative.disableKeyboardManager();
                    }
                })
                .on('blur', function () {
                    if (Jupyter && Jupyter.narrative) {
                        Jupyter.narrative.enableKeyboardManager();
                    }
                })
                .on('input change blur', function (e) {
                    this.search();
                }.bind(this))
                .on('keyup', function (e) {
                    if (e.keyCode === 27) {
                        this.search();
                    }
                }.bind(this));

            self.$searchDiv = $('<div>').addClass("input-group").css({'margin-bottom': '10px'})
                .append(self.$searchInput)
                .append($("<span>").addClass("input-group-addon")
                    .append($("<span>")
                        .addClass("glyphicon glyphicon-search")
                        .css({'cursor': 'pointer'})
                        .on('click', function () {
                            self.search();
                        })));

            self.$sortByDiv = $('<div>').css('text-align', 'center')
                .append('<small>sort by: </small>')
                .append($sortByGroup)
                .append($upOrDown);

            self.$filterTypeSelect = $('<select>').addClass("form-control")
                .css('margin', 'inherit')
                .append($('<option value="">'))
                .change(function () {
                    var optionSelected = $(this).find("option:selected");
                    var typeSelected = optionSelected.val();

                    // whenever we change the type filter, we need to clear the current match
                    // so that the complete filter can rerun
                    self.currentMatch = self.viewOrder;

                    self.filterByType(typeSelected);
                });

            self.$filterTypeDiv = $('<div>')
                .append(self.$filterTypeSelect);

            var $header = $('<div>');
            if (self.options.parentControlPanel) {
                self.options.parentControlPanel.addButtonToControlPanel($viewMode);
                self.options.parentControlPanel.addButtonToControlPanel($openSearch);
                self.options.parentControlPanel.addButtonToControlPanel($openSort);
                self.options.parentControlPanel.addButtonToControlPanel($openFilter);
                self.options.parentControlPanel.addButtonToControlPanel($refreshBtn);
            } else {
                $header.addClass('row').css({'margin': '5px'})
                    .append($('<div>').addClass('col-xs-12').css({'margin': '0px', 'padding': '0px', 'text-align': 'right'})
                        .append($viewMode)
                        .append($openSearch)
                        .append($openSort)
                        .append($openFilter))
            }


            self.$sortByDiv.hide();
            self.$searchDiv.hide();
            self.$filterTypeDiv.hide();

            var $filterDiv = $('<div>')
                .append(self.$sortByDiv)
                .append(self.$searchDiv)
                .append(self.$filterTypeDiv);

            self.$controllerDiv.append($header).append($filterDiv);
        },
        /**
         * Populates the filter set of available types.
         */
        populateAvailableTypes: function () {
            var self = this;
            if (self.availableTypes && self.$filterTypeSelect) {

                var types = [];
                for (var type in self.availableTypes) {
                    if (self.availableTypes.hasOwnProperty(type)) {
                        types.push(type);
                    }
                }
                types.sort();

                self.$filterTypeSelect.empty();
                var runningCount = 0;
                var suf = '';
                for (var i = 0; i < types.length; i++) {
                    runningCount += self.availableTypes[types[i]].count;
                    if (runningCount > 1) {
                        suf = 's';
                    }
                    var countStr = ' ('.concat(runningCount).concat(" object" + suf + ")");
                    self.$filterTypeSelect.append(
                        $('<option value="' + self.availableTypes[types[i]].type + '">')
                        .append(self.availableTypes[types[i]].type + countStr));
                }
                self.$filterTypeSelect
                    .prepend($('<option value="">')
                             .append("Show All Types (" + runningCount + " object" + suf + ")"))
                    .val("");
            }
        },

        reverseData: function () {
            this.viewOrder.reverse();
            this.renderList();
            this.search();
        },

        sortData: function (sortfunction) {
            this.viewOrder.sort(sortfunction);
            this.renderList();
            this.search();  // always refilter on the search term search if there is something there

            // go back to the top on sort
            this.$mainListDiv.animate({
                scrollTop: 0
            }, 300); // fast = 200, slow = 600
        },

        currentMatch: [],
        currentTerm: '',
        searchFilterOn: false,
        n_filteredObjsRendered: null,

        search: function (term, type) {
            if (!this.dataObjects) {
                return;
            }

            if (!term && this.$searchInput) {
                term = this.$searchInput.val();
            }

            // if type wasn't selected, then we try to get something that was set
            if (!type) {
                if (this.$filterTypeSelect) {
                    type = this.$filterTypeSelect.find("option:selected").val();
                }
            }

            term = term.trim();
            if (term.length > 0 || type) {
                this.searchFilterOn = true;
                // todo: should show searching indicator (could take several seconds if there is a lot of data)
                // optimization => we filter existing matches instead of researching everything if the new
                // term starts with the last term searched for
                var newMatch = [];
                if (!this.currentTerm) {
                    // reset if currentTerm is null or empty
                    this.currentMatch = this.viewOrder;
                } else {
                    if (term.indexOf(this.currentTerm) !== 0) {
                        this.currentMatch = this.viewOrder;
                    }
                }
                // clean the term for regex use
                term = term.replace(/\|/g, '\\|').replace(/\\\\\|/g, '|'); // bars are common in kb ids, so escape them unless we have \\|
                term = term.replace(/\./g, '\\.').replace(/\\\\\./g, '.'); // dots are common in names, so we escape them, but
                // if a user writes '\\.' we assume they want the regex '.'

                var regex = new RegExp(term, 'i');

                var n_matches = 0;
                this.n_filteredObjsRendered = 0;
                for (var k = 0; k < this.currentMatch.length; k++) {
                    // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                    // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                    // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                    // [9] : int size // [10] : usermeta meta
                    var match = false;
                    var info = this.dataObjects[this.currentMatch[k]].info;
                    if (regex.test(info[1])) {
                        match = true;
                    } // match on name
                    else if (regex.test(info[2].split('.')[1].split('-'))) {
                        match = true;
                    } // match on type name
                    else if (regex.test(info[5])) {
                        match = true;
                    } // match on saved_by user

                    if (!match && info[10]) { // match on metadata values
                        for (var metaKey in info[10]) {
                            if (info[10].hasOwnProperty(metaKey)) {
                                if (regex.test(info[10][metaKey])) {
                                    match = true;
                                    break;
                                } else if (regex.test(metaKey + "::" + info[10][metaKey])) {
                                    match = true;
                                    break;
                                }
                            }
                        }
                    }


                    if (type) { // if type is defined, then our sort must also filter by the type
                        if (type !== info[2].split('-')[0].split('.')[1]) {
                            match = false; // no match if we are not the selected type!
                        }
                    }
                    if (match) {
                        // matches must always switch to show if they are rendered
                        if (this.dataObjects[this.currentMatch[k]].$div) {
                            this.dataObjects[this.currentMatch[k]].$div.show();
                        }

                        // todo: add check so we only show up to the number we render... switching to this will require that
                        // we revise the renderMore logic...
                        if (n_matches < this.options.objs_to_render_to_start) {
                            this.attachObject(this.dataObjects[this.currentMatch[k]]);
                            this.n_filteredObjsRendered++;
                        }

                        newMatch.push(this.dataObjects[this.currentMatch[k]]);
                        n_matches++;
                    } else {
                        if (this.dataObjects[this.currentMatch[k]].$div) {
                            this.dataObjects[this.currentMatch[k]].$div.hide();
                        }
                    }
                }
                this.currentMatch = newMatch; // update the current match
            } else {
                this.searchFilterOn = false;
                // no new search, so show all and render the list
                for (var k = 0; k < this.viewOrder.length; k++) {
                    if (this.dataObjects[this.viewOrder[k]].$div) {
                        this.dataObjects[this.viewOrder[k]].$div.show();
                    }
                }
                this.renderList();
            }
            this.currentTerm = term;
        },

        filterByType: function (type) {
            this.search(null, type);
        },

        getRichData: function (object_info, $moreRow) {
            var $usernameTd = $moreRow.find(".kb-data-list-username-td");
            DisplayUtil.displayRealName(object_info[5], $usernameTd);
        }
    })
});
