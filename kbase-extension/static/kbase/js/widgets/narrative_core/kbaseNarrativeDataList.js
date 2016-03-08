/*global define,Jupyter*/
/*jslint white: true*/
/**
* @author Michael Sneddon <mwsneddon@lbl.gov>
* @public
*/
define(['jquery',
        'underscore',
        'bluebird',
        'narrativeConfig',
        'util/string',
        'util/display',
        'util/timeFormat',
        'kbase-client-api',
        'jquery-nearest',
        'kbwidget',
        'kbaseAuthenticatedWidget',
        'kbaseNarrativeDownloadPanel'],
function ($,
          _,
          Promise,
          Config,
          StringUtil,
          DisplayUtil,
          TimeFormat) {
    'use strict';
    $.KBWidget({
        name: 'kbaseNarrativeDataList',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.0',
        options: {
            ws_name: null, // must be the WS name, not the WS Numeric ID

            ws_url: Config.url('workspace'),
            lp_url: Config.url('landing_pages'),
            profile_page_url: Config.url('profile_page'),

            loadingImage: Config.get('loading_gif'),
            methodStoreURL: Config.url('narrative_method_store'), 

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
            refresh_interval: 30000,
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
        objList: [],
        objData: {}, // old style - type_name : info

        my_user_id: null,
        /**
         * @method init
         * Builds the DOM structure for the widget.
         * Includes the tables and panel.
         * If any data was passed in (options.data), that gets shoved into the datatable.
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
            }

            // listener for refresh
            $(document).on('updateDataList.Narrative', function () {
                self.refresh();
            })

            if (this.options.ws_name) {
                this.ws_name = this.options.ws_name;
            }

            return this;
        },

        setListHeight: function(height, animate) {
            if(this.$mainListDiv) {
                if(animate) {
                    this.$mainListDiv.animate({'height':height},this.options.slideTime);
                } else {
                    this.$mainListDiv.css({'height':height});
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
            this.ws = new Workspace(this.options.ws_url, auth);
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
        loggedOutCallback: function (event, auth) {
            this.ws = null;
            this.isLoggedIn = false;
            this.my_user_id = null;
            return this;
        },

        showLoading: function(caption) {
            this.$mainListDiv.hide();
            this.loadingDiv.setText(caption || '');
            this.loadingDiv.div.show();
        },

        hideLoading: function() {
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
            .then(function(wsInfo) {
                if (this.wsLastUpdateTimestamp !== wsInfo[3]) {
                    this.wsLastUpdateTimestamp = wsInfo[3];
                    this.maxWsObjId = wsInfo[4];
                    this.showLoading('Fetching data...');
                    this.reloadWsData();
                }
                else {
                    this.refreshTimeStrings();
                    this.hideLoading();
                }
            }.bind(this))
            .catch(function(error) {
                console.error('DataList: when checking for updates:', error);
                if (showError) {
                    this.showBlockingError('Error: Unable to connect to KBase data.');
                }
            }.bind(this));
        },

        refreshTimeStrings: function () {
            var self = this;
            var newTime;
            var oldTime;
            if (self.objectList) {
                for (var i = 0; i < self.objectList.length; i++) {
                    if (self.objectList[i].$div) {
                        newTime = TimeFormat.getTimeStampStr(self.objectList[i].info[3]);
                        self.objectList[i].$div.find('.kb-data-list-date').text(newTime);
                    }
                }
            }
        },

        reloadWsData: function() {
            // empty the existing object list first
            this.objectList = [];
            this.objData = {};
            this.availableTypes = {};

            this.fetchWorkspaceData()
            .then(function() {
                this.showLoading('Rendering data...');
                if (this.objectList.length > this.options.maxObjsToPreventFilterAsYouTypeInSearch) {
                    this.$searchInput.off('input');
                }

                if (this.objectList.length <= this.options.max_objs_to_prevent_initial_sort) {
                    this.objectList.sort(function (a, b) {
                        if (a.info[3] > b.info[3])
                            return -1; // sort by date
                        if (a.info[3] < b.info[3])
                            return 1;  // sort by date
                        return 0;
                    });
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
        showBlockingError: function(error) {
            this.$mainListDiv.empty();
            this.$mainListDiv.append(
                $('<div>').css({'color': '#F44336', 'margin': '10px'})
                          .append(error)
            );
            this.loadingDiv.div.hide();
            this.$mainListDiv.show();
        },

        fetchWorkspaceData: function () {
            var dataChunkNum = 1;
            return new Promise(function(resolve, reject) {
                var getDataChunk = function(minId) {
                    this.showLoading('Fetching data chunk ' + dataChunkNum + '...');
                    return Promise.resolve(this.ws.list_objects({
                        workspaces: [this.ws_name],
                        includeMetadata: 1,
                        minObjectID: minId,
                        maxObjectID: minId + this.options.ws_chunk_size
                    }))
                    .then(function(infoList) {
                        // object_info:
                        // [0] : obj_id objid 
                        // [1] : obj_name name 
                        // [2] : type_string type
                        // [3] : timestamp save_date 
                        // [4] : int version 
                        // [5] : username saved_by
                        // [6] : ws_id wsid 
                        // [7] : ws_name workspace 
                        // [8] : string chsum
                        // [9] : int size 
                        // [10] : usermeta meta
                        for (var i=0; i<infoList.length; i++) {
                            // skip narrative objects
                            if (infoList[i][2].indexOf('KBaseNarrative') === 0) {
                                continue;
                            }
                            this.objectList.push({
                                key: StringUtil.uuid(), // always generate the DnD key
                                $div: null,
                                info: infoList[i],
                                attached: false
                            });
                            // type is formatted like this: Module.Type-1.0
                            // typeKey = Module.Type
                            // typeName = Type
                            var typeKey = infoList[i][2].split('-')[0];
                            if (!(typeKey in this.objData)) {
                                this.objData[typeKey] = [];
                            }
                            this.objData[typeKey].push(infoList[i]);

                            var typeName = typeKey.split('.')[1];
                            if (!(typeName in this.availableTypes)) {
                                this.availableTypes[typeName] = {
                                    type: typeName,
                                    count: 0
                                };
                            }
                            this.availableTypes[typeName].count++;
                        }

                        /* Do another lookup if all of these conditions are met:
                         * 1. total object list length < max objs allowed to fetch/render
                         * 2. theres > 0 objects seen.
                         * 3. our search space hasn't hit the max object id.
                         * There's no guarantee that we'll ever see the object with
                         * max id (it could have been deleted), so keep rolling until
                         * we either meet how many we're allowed to fetch, or we get
                         * a query with no objects.
                         */
                        if (minId + this.options.ws_chunk_size < this.maxWsObjId &&
                            this.objectList.length < this.options.ws_max_objs_to_fetch &&
                            infoList.length > 0) {
                            dataChunkNum++;
                            return getDataChunk(minId + 1 + this.options.ws_chunk_size);
                        }
                    }.bind(this));
                }.bind(this);

                getDataChunk(0).then(resolve);
            }.bind(this))
            .catch(function(error) {
                this.showBlockingError(error);
                console.error(error);
                KBError("kbaseNarrativeDataList.getNextDataChunk", error.error.message);
            }.bind(this));
        },

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
            // } else {
            //     $selectedRow.addClass('kb-data-list-obj-row-selected');
            //     self.$currentSelectedRow = $selectedRow;
            //     self.selectedObject = object_info[0];
            //     self.trigger('filterMethods.Narrative', 'type:' + object_info[2].split('-')[0].split('.')[1]);
            // }
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
                    downloadPanel.kbaseNarrativeDownloadPanel({token: self._attributes.auth.token, type: type, wsId: wsId, objId: objId});
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
        renderObjectRowDiv: function (object_info, object_key) {
            var self = this;
            // object_info:
            // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
            // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
            // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
            // [9] : int size // [10] : usermeta meta
            var type_tokens = object_info[2].split('.')
            var type_module = type_tokens[0];
            var type = type_tokens[1].split('-')[0];
            var unversioned_full_type = type_module + '.' + type;
            var $logo = $('<div>');
            // set icon
            $(document).trigger("setDataIcon.Narrative", {elt: $logo, type: type});
            // add behavior
            $logo.click(function (e) {
                e.stopPropagation();
                self.insertViewer(object_key);
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
            if (type === 'Genome') {
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
                    .append($('<td>')
                        .css({'width': '15%'})
                        .append($logo))
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

            var $rowWithHr = $('<div>')
                .append($('<hr>')
                    .addClass('kb-data-list-row-hr')
                    .css({'margin-left': '65px'}))
                .append($row);

            return $rowWithHr;
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
                    key = data.key,
                    obj = _.findWhere(self.objectList, {key: key}),
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
                obj = _.findWhere(this.objectList, {key: key}),
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
                    if (i  === targetCells.length - 1) {
                        self.addDropZone(container, targetCells.item(i), true);
                    }
                }
            });
            node.addEventListener('dragend', function (e) {
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
            var self = this;
            var cell = Jupyter.notebook.get_selected_cell();
            var near_idx = 0;
            if (cell) {
                near_idx = Jupyter.notebook.find_cell_index(cell);
                $(cell.element).off('dblclick');
                $(cell.element).off('keydown');
            }

            //var cell_id = StringUtil.uuid();
            //cell.rendered = false;
            //cell.set_text('<div id="' + cell_id + '">&nbsp;</div>');
            //cell.render();

            var obj = _.findWhere(self.objectList, {key: key});
            var info = self.createInfoObject(obj.info);
            // Insert the narrative data cell into the div we just rendered
            //$('#' + cell_id).kbaseNarrativeDataCell({cell: cell, info: info});
            self.trigger('createViewerCell.Narrative', {
                'nearCellIdx': near_idx,
                'widget': 'kbaseNarrativeDataCell',
                'info': info
            });
        },
        renderMore: function () {
            var self = this;
            if (self.objectList) {

                if (!self.searchFilterOn) { // if search filter is off, then we just are showing everything
                    var start = self.n_objs_rendered;
                    for (var i = start; i < self.objectList.length; i++) {
                        // only show them as we scroll to them
                        if (self.n_objs_rendered >= start + self.options.objs_to_render_on_scroll) {
                            break;
                        }
                        self.attachRow(i);
                    }
                } else {
                    // search filter is on, so we have to base this on what is currently filtered
                    var start = self.n_filteredObjsRendered;
                    for (var i = start; i < self.currentMatch.length; i++) {
                        // only show them as we scroll to them
                        if (self.n_filteredObjsRendered >= start + self.options.objs_to_render_on_scroll) {
                            break;
                        }
                        self.attachRowElement(self.currentMatch[i]);
                        self.n_filteredObjsRendered++;
                    }
                }
            }
        },
        attachRow: function (index) {
            var obj = this.objectList[index];
            if (obj.attached) {
                return;
            }
            if (obj.$div) {
                this.$mainListDiv.append(obj.$div);
            } else {
                obj.$div = this.renderObjectRowDiv(obj.info, obj.key);
                this.$mainListDiv.append(obj.$div);
            }
            obj.attached = true;
            this.n_objs_rendered++;
        },
        attachRowElement: function (row) {
            if (row.attached) {
                return;
            } // return if we are already attached
            if (row.$div) {
                this.$mainListDiv.append(row.$div);
            } else {
                row.$div = this.renderObjectRowDiv(row.info, row.key);
                this.$mainListDiv.append(row.$div);
            }
            row.attached = true;
            this.n_objs_rendered++;
        },
        detachAllRows: function () {
            for (var i = 0; i < this.objectList.length; i++) {
                this.detachRow(i);
            }
            this.$mainListDiv.children().detach();
            this.n_objs_rendered = 0;
            this.renderedAll = false;
        },
        detachRow: function (index) {
            if (this.objectList[index].attached) {
                if (this.objectList[index].$div) {
                    this.objectList[index].$div.detach();
                }
                this.objectList[index].attached = false;
                this.n_objs_rendered--;
            }
        },
        renderList: function () {
            var self = this;

            self.detachAllRows();

            if (self.objectList.length > 0) {
                for (var i = 0; i < self.objectList.length; i++) {
                    // only show up to the given number
                    if (i >= self.options.objs_to_render_to_start) {
                        self.n_objs_rendered = i;
                        break;
                    }
                    // If object does not have a key, define one.
                    // This will be used for 'id' of rendered element.
                    // But do *not* replace an existing key.
                    if (self.objectList[i].key == undefined) {
                        self.objectList[i].key = StringUtil.uuid();
                    }
                    self.attachRow(i);
                }
                if (Jupyter.narrative.readonly) {
                    this.$addDataButton.hide();
                }
                else {
                    this.$addDataButton.show();
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
                }
                self.$mainListDiv.append($noDataDiv);
            }
        },

        renderController: function () {
            var self = this;

            var $byDate = $('<label id="nar-data-list-default-sort-label" class="btn btn-default">').addClass('btn btn-default')
                .append($('<input type="radio" name="options" id="nar-data-list-default-sort-option" autocomplete="off">'))
                .append("date")
                .on('click', function () {
                    self.sortData(function (a, b) {
                        if (a.info[3] > b.info[3])
                            return -1; // sort by date
                        if (a.info[3] < b.info[3])
                            return 1;  // sort by date
                        return 0;
                    });
                });

            var $byName = $('<label class="btn btn-default">')
                .append($('<input type="radio" name="options" id="option2" autocomplete="off">'))
                .append("name")
                .on('click', function () {
                    self.sortData(function (a, b) {
                        if (a.info[1].toUpperCase() < b.info[1].toUpperCase())
                            return -1; // sort by name
                        if (a.info[1].toUpperCase() > b.info[1].toUpperCase())
                            return 1;
                        return 0;
                    });
                });

            var $byType = $('<label class="btn btn-default">')
                .append($('<input type="radio" name="options" id="option3" autocomplete="off">'))
                .append("type")
                .on('click', function () {
                    self.sortData(function (a, b) {
                        if (a.info[2].toUpperCase() > b.info[2].toUpperCase())
                            return -1; // sort by type
                        if (a.info[2].toUpperCase() < b.info[2].toUpperCase())
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

            // var $addDataBtn = $('<button>')
            //                     .addClass("btn btn-warning kb-data-list-get-data-button")
            //                     .append('<span class="fa fa-plus" style="color:#fff" aria-hidden="true" /> Add Data')
            //                     .on('click',function() {
            //                         self.trigger('toggleSidePanelOverlay.Narrative');
            //                     });



            var $openSearch = $('<span>')
                .addClass('btn btn-xs btn-default')
                .tooltip({
                    title: 'Search data in narrative',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append('<span class="fa fa-search"></span>')
                .on('click', function () {
                    if (!self.$searchDiv.is(':visible')) {
                        self.$sortByDiv.hide({effect: 'blind', duration: 'fast'});
                        self.$filterTypeDiv.hide({effect: 'blind', duration: 'fast'});
                        self.$searchDiv.show({effect: 'blind', duration: 'fast'});
                        self.$searchInput.focus();
                    } else {
                        self.$searchDiv.hide({effect: 'blind', duration: 'fast'});
                    }
                });

            var $openSort = $('<span>')
                .addClass('btn btn-xs btn-default')
                .tooltip({
                    title: 'Sort data list',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append('<span class="fa fa-sort-amount-asc"></span>')
                .on('click', function () {
                    if (!self.$sortByDiv.is(':visible')) {
                        self.$searchDiv.hide({effect: 'blind', duration: 'fast'});
                        self.$filterTypeDiv.hide({effect: 'blind', duration: 'fast'});
                        self.$sortByDiv.show({effect: 'blind', duration: 'fast'});
                    } else {
                        self.$sortByDiv.hide({effect: 'blind', duration: 'fast'});
                    }
                });

            var $openFilter = $('<span>')
                .addClass('btn btn-xs btn-default')
                .tooltip({
                    title: 'Filter data by type',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append('<span class="fa fa-filter"></span>')
                .on('click', function () {
                    if (!self.$filterTypeDiv.is(':visible')) {
                        self.$sortByDiv.hide({effect: 'blind', duration: 'fast'});
                        self.$searchDiv.hide({effect: 'blind', duration: 'fast'});
                        self.$filterTypeDiv.show({effect: 'blind', duration: 'fast'});
                    } else {
                        self.$filterTypeDiv.hide({effect: 'blind', duration: 'fast'});
                    }
                });
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
                .on('input change blur', function(e) {
                    this.search();
                }.bind(this))
                .on('keyup', function(e) {
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
                    self.currentMatch = self.objectList;

                    self.filterByType(typeSelected);
                });

            self.$filterTypeDiv = $('<div>')
                .append(self.$filterTypeSelect);

            var $header = $('<div>');
            if (self.options.parentControlPanel) {
                self.options.parentControlPanel.addButtonToControlPanel($openSearch);
                self.options.parentControlPanel.addButtonToControlPanel($openSort);
                self.options.parentControlPanel.addButtonToControlPanel($openFilter);
                self.options.parentControlPanel.addButtonToControlPanel($refreshBtn);
            } else {
                $header.addClass('row').css({'margin': '5px'})
                    .append($('<div>').addClass('col-xs-12').css({'margin': '0px', 'padding': '0px', 'text-align': 'right'})
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
                for (var i = 0; i < types.length; i++) {
                    runningCount += self.availableTypes[types[i]].count;
                    var countStr = '';
                    if (self.availableTypes[types[i]].count == 1) {
                        countStr = " (".concat(self.availableTypes[types[i]].count).concat(" object)");
                    } else {
                        countStr = " (".concat(self.availableTypes[types[i]].count).concat(" objects)");
                    }
                    self.$filterTypeSelect.append(
                        $('<option value="' + self.availableTypes[types[i]].type + '">')
                        .append(self.availableTypes[types[i]].type + countStr));
                }
                if (runningCount == 1) {
                    self.$filterTypeSelect.prepend($('<option value="">').append("Show All Types (" + runningCount + " object)"));
                } else {
                    self.$filterTypeSelect.prepend($('<option value="">').append("Show All Types (" + runningCount + " objects)"));
                }
                self.$filterTypeSelect.val("");
            }
        },
        reverseData: function () {
            var self = this;
            if (!self.objectList) {
                return;
            }

            self.objectList.reverse();
            self.renderList();
            self.search();
        },
        sortData: function (sortfunction) {
            var self = this;
            if (!self.objectList) {
                return;
            }

            self.objectList.sort(sortfunction);
            self.renderList();
            self.search();  // always refilter on the search term search if there is something there

            // go back to the top on sort
            self.$mainListDiv.animate({
                scrollTop: 0
            }, 300); // fast = 200, slow = 600
        },
        currentMatch: [],
        currentTerm: '',
        searchFilterOn: false,
        n_filteredObjsRendered: null,
        search: function (term, type) {
            var self = this;
            if (!self.objectList) {
                return;
            }

            if (!term && self.$searchInput) {
                term = self.$searchInput.val();
            }

            // if type wasn't selected, then we try to get something that was set
            if (!type) {
                if (self.$filterTypeSelect) {
                    type = self.$filterTypeSelect.find("option:selected").val();
                }
            }

            term = term.trim();
            if (term.length > 0 || type) {
                self.searchFilterOn = true;
                // todo: should show searching indicator (could take several seconds if there is a lot of data)
                // optimization => we filter existing matches instead of researching everything if the new
                // term starts with the last term searched for
                var newMatch = [];
                if (!self.currentTerm) {
                    // reset if currentTerm is null or empty
                    self.currentMatch = self.objectList;
                } else {
                    if (term.indexOf(self.currentTerm) !== 0) {
                        self.currentMatch = self.objectList;
                    }
                }
                // clean the term for regex use
                term = term.replace(/\|/g, '\\|').replace(/\\\\\|/g, '|'); // bars are common in kb ids, so escape them unless we have \\|
                term = term.replace(/\./g, '\\.').replace(/\\\\\./g, '.'); // dots are common in names, so we escape them, but
                // if a user writes '\\.' we assume they want the regex '.'

                var regex = new RegExp(term, 'i');

                var n_matches = 0;
                self.n_filteredObjsRendered = 0;
                for (var k = 0; k < self.currentMatch.length; k++) {
                    // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                    // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                    // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                    // [9] : int size // [10] : usermeta meta
                    var match = false;
                    var info = self.currentMatch[k].info;
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
                        if (self.currentMatch[k].$div) {
                            self.currentMatch[k].$div.show();
                        }

                        // todo: add check so we only show up to the number we render... switching to this will require that
                        // we revise the renderMore logic...
                        if (n_matches < self.options.objs_to_render_to_start) {
                            self.attachRowElement(self.currentMatch[k]);
                            self.n_filteredObjsRendered++;
                        }

                        newMatch.push(self.currentMatch[k]);
                        n_matches++;
                    } else {
                        if (self.currentMatch[k].$div) {
                            self.currentMatch[k].$div.hide();
                        }
                    }
                }
                self.currentMatch = newMatch; // update the current match
            } else {
                self.searchFilterOn = false;
                // no new search, so show all and render the list
                for (var k = 0; k < self.objectList.length; k++) {
                    if (self.objectList[k].$div) {
                        self.objectList[k].$div.show();
                    }
                }
                self.renderList();
            }
            self.currentTerm = term;
        },
        filterByType: function (type) {
            var self = this;
            self.search(null, type);
        },
        getRichData: function (object_info, $moreRow) {
            var self = this;
            var $usernameTd = $moreRow.find(".kb-data-list-username-td");
            DisplayUtil.displayRealName(object_info[5], $usernameTd);
        },
    })
});