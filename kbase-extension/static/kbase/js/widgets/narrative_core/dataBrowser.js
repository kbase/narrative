/**
 * The data browser that shows up in the slideout under My Data and Shared With Me.
 *
 * Some hacks in here to get this working without it taking a catastrophic amount of time to build.
 */

define([
    'bluebird',
    'narrativeConfig',
    'kbase-generic-client-api',
    'common/runtime',
    'util/timeFormat',
    'kbase/js/widgets/narrative_core/kbaseDataCard',
], function(
    Promise,
    Config,
    GenericClient,
    Runtime,
    TimeFormat,
    kbaseDataCard
) {
    'use strict';

    class DataBrowser {
        constructor(node, options) {
            this.node = node;
            this.dataSet = options.dataSet;
            this.$importStatus = options.$importStatus;
            this.wsName = options.ws_name;
            this.objectCountLimit = 30000; //Config.get('data_panel').ws_max_objs_to_fetch || 30000;
            this.state = {
                data: [],
                wsIdFilter: null,   // int for ws id
                typeFilter: null,   // string for type to filter
                searchFilter: null, // string for search filter
            };

            this.$messageHeader = $('<div>').addClass('alert alert-warning alert-dismissable')
                .append($('<button>')
                    .attr({type: 'button',
                        'aria-label': 'close'})
                    .addClass('close')
                    .append($('<span aria-hidden="true">&times;</span>'))
                    .click(() => {
                        this.$messageHeader.slideUp(400);
                    }))
                .append($('<span id="kb-data-panel-msg">'))
                .hide();
            this.$contentPanel = $('<div>');
            this.loadingDiv = this.createLoadingDiv();
            this.$filterRow = $('<div class="row">');
            this.$scrollPanel = $('<div>').css({height: '550px', 'overflow-x': 'hidden', 'overflow-y': 'auto'});
            node.append(this.loadingDiv.loader)
                .append(this.$contentPanel
                        .append(this.$filterRow)
                        .append(this.$messageHeader)
                        .append(this.$scrollPanel));
            this.setLoading(true);

            this.serviceClient = new GenericClient(
                Config.url('service_wizard'),
                {token: Runtime.make().authToken()}
            );
        }

        createLoadingDiv() {
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

        changeState(newState) {
            this.state = {...this.state, ...newState};
            let updateWsList = false,
                updateTypeList = false;
            if (newState.hasOwnProperty('wsIdFilter') || newState.hasOwnProperty('typeFilter')) {
                this.state.searchFilter = '';
            }
            if (this.state.typeFilter === null) {
                updateTypeList = true;
            }
            this.setLoading(true);
            this.updateView(updateWsList, updateTypeList);
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
                    if (resetWorkspaces) {
                        this.workspaces = data.workspace_display;
                    }
                    if (resetTypes) {
                        this.types = this.processTypes(data.type_counts);
                    }
                    this.createFilters(data);
                    this.render(data, []);
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
            let types = {};
            Object.keys(typeCounts).forEach(t => {
                const unversioned = t.split('-')[0];
                const typeName = unversioned.split('.')[1];
                if (!types.hasOwnProperty(typeName)) {
                    types[typeName] = {
                        count: typeCounts[t],
                        full: [unversioned]
                    };
                }
                else {
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
                params = {data_set: this.dataSet};
            if (this.state.wsIdFilter) {
                command = 'NarrativeService.list_workspace_data';
                params = {workspace_ids: [this.state.wsIdFilter]};
            }
            if (this.state.typeFilter) {
                params.types = this.state.typeFilter;
            }
            const otherParams = {
                include_type_counts: 1,
                simple_types: 0,
                ignore_narratives: 1,
                limit: this.objectCountLimit
            }
            params = {...params, ...otherParams};
            return Promise.resolve(this.serviceClient.sync_call(command, [params]))
                .then(data => data[0]);
        }

        // This function takes data to render and
        // a container to put data in.
        // It produces a scrollable dataset
        /**
         *
         * @param {object} data - keys objects, workspace_display
         * @param {jquery node} container
         * @param {*} selected
         * @param {*} template
         */
        render(data, selected) {
            var setDataIconTrigger = $._data($(document)[0], 'events')['setDataIcon'];
            if (setDataIconTrigger) {
                this.renderOnIconsReady(data, selected);
            } else {
                setTimeout(function () {
                    this.renderOnIconsReady(data, selected);
                }, 100);
            }
        }

        /**
         *
         * @param {object} data
         * @param {jquery node} container
         * @param {*} selected
         * @param {*} template - not used?
         */
        renderOnIconsReady(data, selected) {
            var headerMessage = '';
            if (data.limit_reached && data.limit_reached === 1) {
                headerMessage = 'You have access to over <b>' + this.objectCountLimit + '</b> data objects, so we\'re only showing a sample. Please use the Types or Narratives selectors above to filter.';
            }
            this.setHeaderMessage(headerMessage);

            var start = 0,
                numRows = 30;

            // remove items from only current container being rendered
            this.$scrollPanel.empty();

            if (data.objects.length == 0) {
                this.$scrollPanel.append($('<div>').addClass('kb-data-list-type').css({margin: '15px', 'margin-left': '35px'}).append('No data found'));
                this.setLoading(false);
                return;
            }

            var rows = this.buildMyRows(data, start, numRows);
            this.$scrollPanel.append(rows);
            this.events(this.$scrollPanel, selected);

            // infinite scroll
            var currentPos = numRows;
            this.$scrollPanel.unbind('scroll');
            this.$scrollPanel.on('scroll', () => {
                if (this.$scrollPanel.scrollTop() + this.$scrollPanel.innerHeight() >= this.$scrollPanel[0].scrollHeight &&
                    currentPos < data.objects.length) {
                    var rows = this.buildMyRows(data, currentPos, numRows);
                    this.$scrollPanel.append(rows);
                    currentPos += numRows;
                }
                this.events(this.$scrollPanel, selected);
            });
            this.setLoading(false);
        }

        copyObjects(objs, nar_ws_name) {
            importStatus.html('Adding <i>' + objs.length + '</i> objects to narrative...');

            var proms = [];
            for (var i in objs) {
                var ref = objs[i].ref;
                proms.push(
                    this.serviceClient.sync_call(
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

        events(panel, selected) {
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

                    var proms = this.copyObjects(selected, narWSName);
                    $.when.apply($, proms).done(() => {
                        importStatus.html('');
                        var status = $('<span class="text-success">done.</span>');
                        importStatus.append(status);
                        status.delay(1000).fadeOut();

                        // update sidebar data list
                        this.trigger('updateDataList.Narrative');
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

        filterData(data, f) {
            if (data.length == 0)
                return [];

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

        /**
         *
         * @param {object} data - keys objects, workspace_display
         *  keys - ws_id, obj_id, name, ver, saved_by, type, timestamp
         * @param {Int} start
         * @param {Int} numRows
         * @param {*} template
         */
        buildMyRows(data, start, numRows, template) {
            // add each set of items to container to be added to DOM
            var rows = $('<div class="kb-import-items">');
            var loadedData = {};
            $(document).trigger('dataLoadedQuery.Narrative', [
                false, 0,
                function (data) {
                    Object.keys(data).forEach(function (type) {
                        data[type].forEach(function (obj) {
                            loadedData[obj[1]] = true;
                        });
                    });
                }
            ]);
            for (var i = start; i < Math.min(start + numRows, data.objects.length); i++) {
                let obj = data.objects[i];
                obj.relativeTime = TimeFormat.getTimeStampStr(obj.timestamp);
                obj.narrativeName = data.workspace_display[obj.ws_id].display;
                // var mod_type = obj[2].split('-')[0];
                // var item = {id: obj[0],
                //     name: obj[1],
                //     mod_type: mod_type,
                //     version: obj[4],
                //     kind: mod_type.split('.')[1],
                //     module: mod_type.split('.')[0],
                //     wsID: obj[6],
                //     ws: obj[7],
                //     info: obj, // we need to have this all on hand!
                //     relativeTime: TimeFormat.getTimeStampStr(obj[3])}; //use the same one as in data list for consistencey  kb.ui.relativeTime( Date.parse(obj[3]) ) }

                if (template) {
                    rows.append(template(obj));
                }
                else {
                    rows.append(this.rowTemplate(obj, loadedData));
                }
            }
            return rows;
        }

        /**
         *
         * @param {object} data - objects, workspace_display
         * @param {jquery node} container
         * @param {jquery node} filterContainer
         */
        createFilters(data, container) {
            // possible filter inputs
            let type, ws, query;

            // create filter (search)
            const filterInput = $('<input type="text" class="form-control kb-import-search" placeholder="Search data...">');
            const searchFilter = $('<div class="col-sm-4">').append(filterInput);

            // create workspace filter
            const wsInput = $('<select class="form-control kb-import-filter">')
                            .append('<option>All Narratives...</option>');
            const sortedWsKeys = Object.keys(this.workspaces).sort((a, b) => {
                return this.workspaces[a].display.localeCompare(this.workspaces[b].display);
            });
            sortedWsKeys.forEach(wsId => {
                const $option = $('<option data-id="' + wsId + '">' +
                    this.workspaces[wsId].display + ' (' + this.workspaces[wsId].count + ')' +
                    '</option>');
                if (this.state.wsIdFilter == wsId) {
                    $option.prop('selected', true);
                }
                wsInput.append($option);
            });
            var wsFilter = $('<div class="col-sm-4">').append(wsInput);

            // event for ws dropdown
            wsInput.change((e) => {
                let wsId = $(e.target).children('option:selected').data('id');
                this.changeState({wsIdFilter: wsId, typeFilter: null});
            });

            // create type filter
            var typeInput = $('<select class="form-control kb-import-filter">');
            typeInput.append('<option>All types...</option>');

            Object.keys(this.types).sort().forEach(t => {
                typeInput.append('<option data-type="' + t + '">' +
                    t + ' (' + this.types[t].count + ')' +
                    '</option>');
            });

            var typeFilter = $('<div class="col-sm-3">').append(typeInput);
            // event for type dropdown
            typeInput.change((e) => {
                const type = $(e.target).children('option:selected').data('type');
                const types = this.types[type].full;
                this.changeState({typeFilter: types});
            });

            // event for filter (search)
            filterInput.keyup((e) => {
                query = $(e.target).val();
                this.changeState({searchFilter: query});
            });

            var $refreshBtnDiv = $('<div>').addClass('col-sm-1').css({'text-align': 'center'}).append(
                $('<button>')
                    .css({'margin-top': '12px'})
                    .addClass('btn btn-xs btn-default')
                    .click(() => {
                        this.$scrollPanel.empty();
                        this.setLoading(true);
                        this.updateView();
                    })
                    .append($('<span>')
                        .addClass('fa fa-refresh')));
            this.$filterRow.empty()
                .append(searchFilter, typeFilter, wsFilter, $refreshBtnDiv);
        }

        rowTemplate(obj) {
            var btnClasses = 'btn btn-xs btn-default';
            var $btnToolbar = $('<div>').addClass('btn-toolbar narrative-data-panel-btnToolbar');
            var $openLandingPage = $('<span>')
                .addClass(btnClasses)
                .append($('<span>').addClass('fa fa-binoculars'))
                .click((e) => {
                    e.stopPropagation();
                    window.open(Config.url('landing_pages') + obj.ws_id + '/' + obj.obj_id);
                });

            var $openProvenance = $('<span>')
                .addClass(btnClasses)
                //.tooltip({title:'View data provenance and relationships', 'container':'body'})
                .append($('<span>').addClass('fa fa-sitemap fa-rotate-90'))
                .click((e) => {
                    e.stopPropagation();
                    window.open('/#objgraphview/' + obj.ws_id + '/' + obj.obj_id);
                });
            $btnToolbar.append($openLandingPage).append($openProvenance);

            const isCopy = this.loadedData && this.loadedData[obj.name];
            const actionButtonText = (isCopy) ? ' Copy' : ' Add';

            return kbaseDataCard.apply(this, [{
                narrative: obj.narrativeName,
                actionButtonText: actionButtonText,
                moreContent: $btnToolbar,
                max_name_length: 50,
                object_info: [obj.obj_id, obj.name, obj.type, obj.timestamp, obj.ver, obj.saved_by, obj.narrativeName, 'ws_name', 'hash', 'size'],
                ws_name: this.wsName
            }]);
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
