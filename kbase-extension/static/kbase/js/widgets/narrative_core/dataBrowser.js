/**
 * The data browser that shows up in the slideout under My Data and Shared With Me.
 */

define([
    'bluebird',
    'narrativeConfig',
    'kbase-generic-client-api',
    'common/runtime',
    'util/timeFormat',
    'kbase/js/widgets/narrative_core/kbaseDataCard',
    'api/dataProvider',
], (Promise, Config, GenericClient, Runtime, TimeFormat, kbaseDataCard, DataProvider) => {
    'use strict';

    const OBJECT_COUNT_LIMIT = Config.get('data_panel').ws_max_objs_to_fetch || 30000;
    const RENDER_CHUNK = 30; // 30 objects per scroll

    class DataBrowser {
        constructor(node, options) {
            this.node = node;
            this.dataSet = options.dataSet;
            this.$importStatus = options.$importStatus;
            this.wsName = options.ws_name;
            this.state = {
                wsIdFilter: null, // int for ws id
                typeFilter: null, // string for type to filter
                searchFilter: null, // string for search filter
            };

            this.$messageHeader = $('<div>')
                .addClass('alert alert-warning alert-dismissable')
                .append(
                    $('<button>')
                        .attr({ type: 'button', 'aria-label': 'close' })
                        .addClass('close')
                        .append($('<span aria-hidden="true">&times;</span>'))
                        .click(() => {
                            this.$messageHeader.slideUp(400);
                        })
                )
                .append($('<span id="kb-data-panel-msg">'))
                .hide();
            this.$contentPanel = $('<div>');
            this.loadingDiv = this.createLoadingDiv();
            this.$filterRow = $('<div class="row">');
            this.$scrollPanel = $('<div>').css({
                height: '550px',
                'overflow-x': 'hidden',
                'overflow-y': 'auto',
            });
            node.append(this.loadingDiv.loader).append(
                this.$contentPanel
                    .append(this.$filterRow)
                    .append(this.$messageHeader)
                    .append(this.$scrollPanel)
            );
            this.setLoading(true);

            this.serviceClient = new GenericClient(Config.url('service_wizard'), {
                token: Runtime.make().authToken(),
            });
        }

        createLoadingDiv() {
            const minValue = 5;
            const $progressBar = $('<div>')
                .addClass('progress-bar progress-bar-striped active')
                .attr({
                    role: 'progressbar',
                    'aria-valuenow': minValue,
                    'aria-valuemin': '0',
                    'aria-valuemax': '100',
                })
                .css({
                    width: minValue + '%',
                    transition: 'none',
                });

            const $loadingDiv = $('<div>')
                .addClass('row')
                .css({ margin: '15px', 'margin-left': '35px', height: '550px' })
                .append($('<div class="progress">').append($progressBar))
                .hide();

            const setValue = function (value) {
                if (value >= minValue) {
                    $progressBar.css('width', value + '%').attr('aria-valuenow', value);
                }
            };

            const reset = function () {
                setValue(minValue);
            };

            return {
                loader: $loadingDiv,
                progressBar: $progressBar,
                setValue: setValue,
                reset: reset,
            };
        }

        changeState(newState) {
            Object.assign(this.state, newState);
            // this.state = {...this.state, ...newState};
            let updateWsList = false,
                updateTypeList = false;
            if (this.state.typeFilter === null) {
                updateTypeList = true;
            }
            if (newState.hasOwnProperty('wsIdFilter') || newState.hasOwnProperty('typeFilter')) {
                this.state.searchFilter = '';
                this.setLoading(true);
                this.updateView(updateWsList, updateTypeList);
            }
            if (newState.hasOwnProperty('searchFilter')) {
                this.render();
            }
        }

        /**
         * Updates view according to the state.
         * If resetWorkspaces is true, then it uses the set of workspaces
         * from fetch data (and the current filter state, so watch for that) to
         * populate the Narratives filter dropdown.
         */
        updateView(resetWorkspaces, resetTypes) {
            this.fetchData()
                .then((data) => {
                    this.data = data;
                    if (resetWorkspaces) {
                        this.workspaces = data.workspace_display;
                    }
                    if (resetTypes) {
                        this.types = this.processTypes(data.type_counts);
                    }
                    this.createFilters();
                    this.render();
                })
                .catch((error) => {
                    console.error('ERROR ', error);
                });
        }

        /**
         * Turns this:
         * {
         *      Module1.Type : 5,
         *      Module2.Type : 5,
         *      Module3.OtherType: 1
         * }
         * into this:
         * {
         *      Type: {
         *          count: 10,
         *          full: [Module1.Type, Module2.Type]
         *      },
         *      OtherType: {
         *          count: 1,
         *          full: [Module3.OtherType]
         *      }
         * }
         * @param {object} typeCounts
         */
        processTypes(typeCounts) {
            const types = {};
            Object.keys(typeCounts).forEach((t) => {
                const unversioned = t.split('-')[0];
                const typeName = unversioned.split('.')[1];
                if (!types.hasOwnProperty(typeName)) {
                    types[typeName] = {
                        count: typeCounts[t],
                        full: [unversioned],
                    };
                } else {
                    types[typeName].count += typeCounts[t];
                    if (!types[typeName].full.includes(unversioned)) {
                        types[typeName].full.push(unversioned);
                    }
                }
            });
            return types;
        }

        /**
         * Fetches and pre-processes data based on the current state.
         * This uses the wsIdFilter and typeFilter to make the service query,
         * then returns a promise with that query.
         *
         * The searchFilter value is only applied after lookup.
         */
        fetchData() {
            let command = 'NarrativeService.list_all_data',
                params = { data_set: this.dataSet };
            if (this.state.wsIdFilter) {
                command = 'NarrativeService.list_workspace_data';
                params = { workspace_ids: [this.state.wsIdFilter] };
            }
            if (this.state.typeFilter) {
                params.types = this.types[this.state.typeFilter].full || [];
            }
            const otherParams = {
                include_type_counts: 1,
                simple_types: 0,
                ignore_narratives: 1,
                limit: OBJECT_COUNT_LIMIT,
            };
            Object.assign(params, otherParams);
            // params = {...params, ...otherParams};
            return Promise.resolve(this.serviceClient.sync_call(command, [params])).then(
                (data) => data[0]
            );
        }

        /**
         * Resets the rendering, renders all the things from scratch.
         * @param {object} data
         * @param {jquery node} container
         * @param {*} selected
         * @param {*} template - not used?
         */
        render() {
            let headerMessage = '';
            if (this.data.limit_reached && this.data.limit_reached === 1) {
                headerMessage =
                    'You have access to over <b>' +
                    OBJECT_COUNT_LIMIT +
                    "</b> data objects, so we're only showing a sample. Please use the Types or Narratives selectors above to filter.";
            }
            this.setHeaderMessage(headerMessage);
            this.state.objectPointer = 0; // resets the pointer to the first element in the data list.

            // remove items from only current container being rendered
            this.$scrollPanel.empty();

            if (this.data.objects.length == 0) {
                this.$scrollPanel.append(
                    $('<div>')
                        .addClass('kb-data-list-type')
                        .css({ margin: '15px', 'margin-left': '35px' })
                        .append('No data found')
                );
                this.setLoading(false);
                return;
            }

            this.buildNextRows().then((rows) => {
                this.$scrollPanel.append(rows);

                // infinite scroll
                this.$scrollPanel.unbind('scroll');
                this.$scrollPanel.on('scroll', () => {
                    if (
                        this.$scrollPanel.scrollTop() + this.$scrollPanel.innerHeight() >=
                            this.$scrollPanel[0].scrollHeight &&
                        this.state.objectPointer < this.data.objects.length
                    ) {
                        this.buildNextRows().then((rows) => this.$scrollPanel.append(rows));
                    }
                });
                this.setLoading(false);
            });
        }

        /**
         *
         * @param {object} data - keys objects, workspace_display
         *  keys - ws_id, obj_id, name, ver, saved_by, type, timestamp
         * @param {Int} start
         * @param {Int} numRows
         * @param {*} template
         */
        buildNextRows() {
            //}, start, numRows) {
            // add each set of items to container to be added to DOM
            const rows = $('<div class="kb-import-items">');
            return DataProvider.getDataByName().then((loadedData) => {
                for (
                    let count = 0;
                    this.state.objectPointer < this.data.objects.length && count < RENDER_CHUNK;
                    this.state.objectPointer++
                ) {
                    const obj = this.data.objects[this.state.objectPointer];
                    if (this.testFilter(obj)) {
                        obj.relativeTime = TimeFormat.getTimeStampStr(obj.timestamp);
                        obj.narrativeName = this.data.workspace_display[obj.ws_id].display;

                        rows.append(this.rowTemplate(obj, loadedData.hasOwnProperty(obj.name)));
                        count++;
                    }
                }
                return rows;
            });
        }

        /**
         * Returns true if this passes the state's string filter, false otherwise.
         * @param {Object} obj - a data object
         */
        testFilter(obj) {
            if (!this.state.searchFilter) {
                return true;
            }
            const query = this.state.searchFilter;

            return (
                obj.name.toLowerCase().indexOf(query) != -1 ||
                obj.type.toLowerCase().indexOf(query) != -1 ||
                obj.saved_by.toLowerCase().indexOf(query) != -1
            );
        }

        buildWorkspaceFilter() {
            // create workspace filter
            const wsInput = $('<select class="form-control kb-import-filter">').append(
                '<option>All Narratives...</option>'
            );
            const sortedWsKeys = Object.keys(this.workspaces).sort((a, b) => {
                return this.workspaces[a].display.localeCompare(this.workspaces[b].display);
            });
            sortedWsKeys.forEach((wsId) => {
                let name = this.workspaces[wsId].display;
                if (!this.data.limit_reached || this.data.limit_reached !== 1) {
                    name += ' (' + this.workspaces[wsId].count + ')';
                }
                const $option = $('<option data-id="' + wsId + '">' + name + '</option>');
                if (this.state.wsIdFilter == wsId) {
                    $option.prop('selected', true);
                }
                wsInput.append($option);
            });
            const wsFilter = $('<div class="col-sm-4">').append(wsInput);

            // event for ws dropdown
            wsInput.change((e) => {
                const wsId = $(e.target).children('option:selected').data('id');
                this.changeState({ wsIdFilter: wsId, typeFilter: null });
            });
            return wsFilter;
        }

        buildTypeFilter() {
            // create type filter
            const typeInput = $('<select class="form-control kb-import-filter">').append(
                    '<option>All types...</option>'
                ),
                typeFilter = $('<div class="col-sm-3">').append(typeInput);

            Object.keys(this.types)
                .sort()
                .forEach((t) => {
                    const $option = $(
                        '<option data-type="' +
                            t +
                            '">' +
                            t +
                            ' (' +
                            this.types[t].count +
                            ')' +
                            '</option>'
                    );
                    if (this.state.typeFilter === t) {
                        $option.prop('selected', true);
                    }
                    typeInput.append($option);
                });

            // event for type dropdown
            typeInput.change((e) => {
                const type = $(e.target).children('option:selected').data('type');
                this.changeState({ typeFilter: type });
            });
            return typeFilter;
        }

        createFilters() {
            // create filter (search)
            const filterInput = $(
                    '<input type="text" class="form-control kb-import-search" placeholder="Search data...">'
                ),
                searchFilter = $('<div class="col-sm-4">').append(filterInput);
            // event for filter (search)
            filterInput.keyup((e) => {
                const query = $(e.target).val();
                this.changeState({ searchFilter: query.toLowerCase() });
            });

            const wsFilter = this.buildWorkspaceFilter(),
                typeFilter = this.buildTypeFilter();

            const $refreshBtnDiv = $('<div>')
                .addClass('col-sm-1')
                .css({ 'text-align': 'center' })
                .append(
                    $('<button>')
                        .css({ 'margin-top': '12px' })
                        .addClass('btn btn-xs btn-default')
                        .click(() => {
                            this.$scrollPanel.empty();
                            this.setLoading(true);
                            this.updateView();
                        })
                        .append($('<span>').addClass('fa fa-refresh'))
                );

            this.$filterRow.empty().append(searchFilter, typeFilter, wsFilter, $refreshBtnDiv);
        }

        /**
         *
         * @param {object} obj
         * @param {boolean} nameExists true if an object with this name already exists in the current Narrative
         */
        rowTemplate(obj, nameExists) {
            const btnClasses = 'btn btn-xs btn-default';
            const $btnToolbar = $('<div>').addClass('btn-toolbar narrative-data-panel-btnToolbar');
            const $openLandingPage = $('<span>')
                .addClass(btnClasses)
                .append($('<span>').addClass('fa fa-binoculars'))
                .click((e) => {
                    e.stopPropagation();
                    window.open(Config.url('landing_pages') + obj.ws_id + '/' + obj.obj_id);
                });

            const $openProvenance = $('<span>')
                .addClass(btnClasses)
                //.tooltip({title:'View data provenance and relationships', 'container':'body'})
                .append($('<span>').addClass('fa fa-sitemap fa-rotate-90'))
                .click((e) => {
                    e.stopPropagation();
                    window.open('/#objgraphview/' + obj.ws_id + '/' + obj.obj_id);
                });
            $btnToolbar.append($openLandingPage).append($openProvenance);

            const actionButtonText = nameExists ? ' Copy' : ' Add';

            return kbaseDataCard.apply(this, [
                {
                    narrative: obj.narrativeName,
                    actionButtonText: actionButtonText,
                    copyFunction: () => this.doObjectCopy(obj),
                    moreContent: $btnToolbar,
                    max_name_length: 50,
                    object_info: [
                        obj.obj_id,
                        obj.name,
                        obj.type,
                        obj.timestamp,
                        obj.ver,
                        obj.saved_by,
                        obj.narrativeName,
                        'ws_name',
                        'hash',
                        'size',
                    ],
                },
            ]);
        }

        /**
         * Makes a copy of the object in the current workspace by calling to NarrativeService.
         * Returns a Promise around that copy function.
         * @param {} obj
         */
        doObjectCopy(obj) {
            return this.serviceClient.sync_call('NarrativeService.copy_object', [
                {
                    ref: obj.ws_id + '/' + obj.obj_id,
                    target_ws_name: this.wsName,
                },
            ]);
        }

        setHeaderMessage(message) {
            if (message) {
                this.$messageHeader.find('#kb-data-panel-msg').html(message);
                this.$messageHeader.show();
            } else {
                this.$messageHeader.hide();
            }
        }

        // the existing .loading() .rmLoading() puts the loading icon in the wrong place
        setLoading(show) {
            if (show) {
                this.$contentPanel.hide();
                this.loadingDiv.loader.show();
            } else {
                this.loadingDiv.loader.hide();
                this.loadingDiv.reset();
                this.$contentPanel.show();
            }
        }
    }
    return DataBrowser;
});
