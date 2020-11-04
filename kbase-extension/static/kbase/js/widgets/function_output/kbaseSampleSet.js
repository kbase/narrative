/*
Sebastian Le Bras, David Lyon - April 2020
*/
define([
    'kbwidget',
    'jquery',
    'widgets/dynamicTable',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'narrativeConfig',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_service/client/workspace',
], function (
    KBWidget,
    $,
    DynamicTable,
    kbaseAuthenticatedWidget,
    kbaseTabs,
    Config,
    DynamicServiceClient,
    Workspace
) {
    'use strict';

    const kbaseSampleSetView = KBWidget({
        name: 'kbaseSampleSetView',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            pageLimit: 10,
            default_blank_value: ''
        },

        init: function (options) {
            this._super(options);

            this.obj_ref = this.options.upas.id;

            // Connect to services
            this.attachClients();

            // Render
            this.render();

            return this;
        },

        loggedInCallback: function () {
            this.attachClients();
            this.render();
        },

        attachClients: function () {
            this.workspace = new Workspace(Config.url('workspace'), { 'token': this.authToken() });
            this.services = {
                SetAPI: new DynamicServiceClient({
                    module: 'SetAPI',
                    url: Config.url('service_wizard'),
                    token: this.authToken(),
                    version: 'dev'
                })
            };
        },

        render: function () {

            // Init DOM
            this.$elem.empty();

            const $summaryTab = $('<div>').css('margin-top', '15px');
            this.renderSummary($summaryTab);

            const $samplesTab = $('<div>');
            this.renderSamples($samplesTab);

            const $tabPane = $('<div>').appendTo(this.$elem);
            new kbaseTabs($tabPane, {
                tabPosition: 'top',
                canDelete: false, //whether or not the tab can be removed.
                tabs: [
                    {
                        tab: 'Summary',   //name of the tab
                        content: $summaryTab,
                        show: true,
                    }, {
                        tab: 'Samples',
                        content: $samplesTab
                    },
                ],
            });
        },


        renderSummary: async function ($container) {
            const $spinner = buildSpinner();
            try {
                // Clear and render spinner
                $container.empty();
                $spinner.appendTo($container);

                // Await data
                const { objLink, objName, savedBy, numSamples, desc } = await this.loadSummary();

                // Build table
                const $overviewTable = $('<table>')
                    .addClass('table table-striped table-bordered table-hover')
                    .css({
                        'margin-left': 'auto',
                        'margin-right': 'auto'
                    });

                // Build rows
                const rows = [
                    ['KBase Object Name', `<a href="/#dataview/${objLink}" target="_blank">${objName}</a>`],
                    ['Saved by', savedBy],
                    ['Number of Samples', numSamples],
                    ['Description', desc]
                ];
                rows.forEach(([key, value]) => {
                    $overviewTable.append($(`<tr><td>${key}</td><td>${value}</td></tr>`));
                });

                // Attach table to the container
                $container.append($overviewTable);

            } catch (err) {
                console.error('an error occurred! ' + err);
                $container.append(buildError(err));
            } finally {
                $spinner.remove();
            }
        },

        renderSamples: async function ($container) {
            const $spinner = buildSpinner();
            try {
                // Clear and render spinner
                $container.empty();
                $spinner.appendTo($container);

                // Await data
                const headers = await this.loadHeaders();

                // Build and attach to container
                const $samplesTable = $('<div>');
                new DynamicTable($samplesTable, {
                    headers: headers,
                    searchPlaceholder: 'Search samples',
                    updateFunction: this.loadSampleRows.bind(this, headers),
                    style: { 'margin-top': '5px' }
                });
                $container.append($samplesTable);

            } catch (err) {
                console.error('an error occurred! ' + err);
                $container.append(buildError(err));
            } finally {
                $spinner.remove();
            }
        },

        loadSummary: async function () {
            const obj = await this.workspace.get_objects2({ objects: [{ 'ref': this.obj_ref }] });
            const ss_obj_data = obj['data'][0]['data'];
            const ss_obj_info = obj['data'][0]['info'];

            return {
                objLink: ss_obj_info[6] + '/' + ss_obj_info[0] + '/' + ss_obj_info[4],
                objName: ss_obj_info[1],
                savedBy: String(ss_obj_info[5]),
                numSamples: ss_obj_data['samples'].length,
                desc: ss_obj_data['description']
            };
        },

        loadHeaders: async function () {
            const fixedHeaders = [{
                id: 'kbase_sample_id',
                text: 'Sample ID',
                isSortable: false
            }, {
                id: 'name',
                text: 'Sample Name',
                isSortable: true
            }, {
                id: 'sample_version',
                text: 'version',
                isSortable: true
            }];

            // pull unique list of other header strings from samples
            const obj = await this.services.SetAPI.callFunc('sample_set_to_samples_info', [{
                ref: this.obj_ref
            }]);

            const allFields = [];
            const ignoredFields = ['sample_version', 'kbase_sample_id', 'is_public', 'copied', 'name'];
            obj[0]['samples'].forEach(sample => {
                Object.keys(sample)
                    .filter(field => ignoredFields.indexOf(field) === -1 && allFields.indexOf(field) === -1)
                    .forEach(field => allFields.push(field));
            });

            const allHeaders = fixedHeaders.concat(
                allFields.map(field => ({
                    id: field,
                    text: formatFieldName(field),
                    isSortable: true
                }))
            );

            return allHeaders;
        },

        loadSampleRows: async function (headers, pageNum, query, sortColId, sortColDir) {
            var page_start = pageNum * this.options.pageLimit;
            var page_limit = this.options.pageLimit;
            var sorting = null;
            if (sortColId !== null) {
                sorting = [[sortColId, sortColDir]];
            }

            const [obj] = await this.services.SetAPI.callFunc('sample_set_to_samples_info', [{
                ref: this.obj_ref,
                start: page_start,
                limit: page_limit,
                query: query,
                sort_by: sorting
            }]);

            // Build table rows
            const rows = [];
            obj['samples'].forEach(sample => {
                // Count number of replicates in the sample, some values are static, so just look at arrays.
                const numReplicates = Math.max(
                    ...Object.values(sample).map(val => Array.isArray(val) ? val.length : 1)
                );
                // Create one row per replicate
                for (let i = 0; i < numReplicates; i++) {
                    const replicate_data = {};
                    Object.keys(sample).forEach(key => {
                        // check if this value varries across replicates
                        const value_varies = Array.isArray(sample[key]);
                        replicate_data[key] = value_varies ? sample[key][i] : sample[key];
                    });
                    rows.push(headers.map(({ id }) => replicate_data[id]));
                }
            });

            return {
                rows: rows,
                start: page_start,
                query: query,
                total: obj['num_found']
            };
        }
    });

    function buildSpinner() {
        return $('<div>').attr('align', 'center').append($('<i class="fa fa-spinner fa-spin fa-2x">'));
    }

    function formatFieldName(fieldName) {
        return fieldName.split('_').join(' ');
    }

    function buildError(err) {
        var errorMessage;
        if (typeof err === 'string') {
            errorMessage = err;
        } else if (err.error) {
            errorMessage = JSON.stringify(err.error);
            if (err.error.message) {
                errorMessage = err.error.message;
                if (err.error.error) {
                    errorMessage += '<br><b>Trace</b>:' + err.error.error;
                }
            } else {
                errorMessage = JSON.stringify(err.error);
            }
        } else {
            errorMessage = err.message;
        }
        return $('<div>')
            .addClass('alert alert-danger')
            .append(errorMessage)
            .append('<div><br/>You may contact the KBase team <a href="https://www.kbase.us/support/">here</a> with the information above.</div>');
    }

    return kbaseSampleSetView;
});
