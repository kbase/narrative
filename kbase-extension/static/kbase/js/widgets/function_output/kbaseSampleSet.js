/*
Sebastian Le Bras - April 2020
*/
define ([
    'kbwidget',
    'bootstrap',
    'jquery',
    'kbase-client-api',
    'widgets/dynamicTable',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'kbase-generic-client-api',
    'narrativeConfig',
    'bluebird',
    'kb_common/jsonRpc/dynamicServiceClient'
], function(
	KBWidget,
	bootstrap,
	$,
    kbase_client_api,
    DynamicTable,
	kbaseAuthenticatedWidget,
    kbaseTabs,
    GenericClient,
    Config,
    Promise,
    DynamicServiceClient
) {
    'use strict';

    function WidgetState() {
        var UNINITIALIZED = 0;
        var OK = 1;
        var ERROR = 2;
        var state = null;
        var _info = null;
        function ok(stateInfo) {
            state = OK;
            _info = stateInfo;
        }
        function error(stateInfo) {
            state = ERROR;
            _info = stateInfo;
        }
        function isUninitialized() {
            return state === UNINITIALIZED;
        }
        function isOk() {
            return state === OK;
        }
        function isError() {
            return state === ERROR;
        }
        function info() {
            return _info;
        }
        return {
            ok: ok,
            error: error,
            isUninitialized: isUninitialized,
            isOk: isOk,
            isError: isError,
            info: info
        };
    };

    function buildError(err) {
        var errorMessage;
        if (typeof err === 'string') {
            errorMessage = err;
        } else if (err.error) {
            errorMessage = JSON.stringify(err.error);
            if (err.error.message){
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
            .append(errorMessage);
    };

    return KBWidget({
        name: 'kbaseSampleSetView',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            pageLimit: 10,
            default_blank_value: ""
        },
        state: WidgetState(),

        init: function (options) {
            this._super(options);

            // var self = this;
            this.obj_ref = this.options.upas.id;
            this.link_ref = this.obj_ref;

            this.client = new GenericClient(Config.url('service_wizard'), {token: this.authToken()});
            this.ws = new Workspace(Config.url('workspace'),{'token': this.authToken()});

            this.$elem.append($('<div>').attr('align', 'center').append($('<i class="fa fa-spinner fa-spin fa-2x">')));

            this.attachClients();
            // 1) get stats, and show the panel
            var basicInfoCalls = [];
            basicInfoCalls.push(
                Promise.resolve(this.ws.get_objects2({objects: [{'ref': this.obj_ref}]}))
                    .then((obj) => {
                        this.ss_obj_data = obj['data'][0]['data']
                        this.ss_obj_info = obj['data'][0]['info']
                        this.link_ref = this.ss_obj_info[6] + '/' + this.ss_obj_info[0] + '/' + this.ss_obj_info[4];
                    }));

            Promise.all(basicInfoCalls)
                .then(() => {
                    this.renderBasicTable();
                })
                .catch((err) => {
                    console.error('an error occurred! ' + err);
                    this.$elem.empty();
                    this.$elem.append('An unexpected error occured: \nPlease contact KBase <a href="https://kbase.us/new-help-board/">here<a>');
                });

            return this;
        },

        attachClients: function () {
            this.SetAPI = new DynamicServiceClient({
                module: 'SetAPI',
                url: Config.url('service_wizard'),
                token: this.authToken(),
                version: 'dev'
            });
        },

        showError: function (err) {
            this.$elem.empty();
            // This wrapper is required because the output widget displays a "Details..." button
            // with float right; without clearing this button will reside inside the error
            // display area.
            var $errorBox = $('<div>')
                .css('clear', 'both');
            $errorBox.append(buildError(err));
            this.$elem.append($errorBox);
        },

        renderBasicTable: function() {
            var self = this;
            var $container = this.$elem;
            $container.empty();

            var $tabPane = $('<div>');
            $container.append($tabPane);


            // Build the overview table
            var $overviewTable = $('<table class="table table-striped table-bordered table-hover" style="margin-left: auto; margin-right: auto;"/>');

            function get_table_row(key, value) {
                return $('<tr>').append($('<td>').append(key)).append($('<td>').append(value));
            }

            $overviewTable.append(get_table_row('KBase Object Name',
                '<a href="/#dataview/'+self.link_ref + '" target="_blank">' + self.ss_obj_info[1] +'</a>' ));
                // leave out version for now, because that is not passed into data widgets
                //'<a href="/#dataview/'+self.link_ref + '" target="_blank">' + self.ss_obj_info[1] + ' (v'+self.ss_obj_info[4]+')'+'</a>' ));
            $overviewTable.append(get_table_row('Saved by', String(self.ss_obj_info[5])));
            $overviewTable.append(get_table_row('Number of Samples', self.ss_obj_data['samples'].length ));
            $overviewTable.append(get_table_row('Description', self.ss_obj_data['description']));

            self.metadata_headers = [{
                id: 'kbase_sample_id',
                text: 'Sample ID',
                isSortable: false
            }, {
                id: 'name',
                text: 'Sample Name',
                isSortable: true
            }, {
                id: "sample_version",
                text: "version",
                isSortable: true
            }]; // version not in metadata, but included in visualization.
            // get the metadata_keys


            self.SetAPI.callFunc('sample_set_to_samples_info',[{
                ref: self.obj_ref
            }]).then(function(obj) {
                var all_meta_fields = [];
                for (let i = 0; i < obj[0]['samples'].length; i++){
                    all_meta_fields.push(Object.keys(obj[0]['samples'][i]));
                }
                // var all_meta_fields = [for (sample of obj['samples']) Object.keys(sample)];
                var merged_names = [].concat.apply([], all_meta_fields);
                merged_names = merged_names.filter((x,i,a) => a.indexOf(x) === i);
                var remove_fields = ["sample_version", "kbase_sample_id", "is_public", "copied", "name"];
                remove_fields.forEach(function(field) {
                    const index = merged_names.indexOf(field);
                    if (index > -1) {
                      merged_names.splice(index, 1);
                    }
                });
                merged_names.forEach(function(meta_field) {
                    self.metadata_headers.push({
                        id: meta_field,
                        text: self.display_name_format(meta_field),
                        isSortable: true
                    })
                })
            })
            // Build the tabs
            var $tabs = new kbaseTabs($tabPane, {
                tabPosition : 'top',
                canDelete : false, //whether or not the tab can be removed.
                tabs : [
                    {
                        tab : 'Summary',   //name of the tab
                        content : $('<div>').css('margin-top','15px').append($overviewTable),
                        show : true,
                    }, {
                        tab : 'Samples',
                        showContentCallback: function() {
                            return self.addSamplesList();
                        }
                    },
                ],
            });
        },

        addSamplesList: function() {
            var self = this;
            console.log('metadata headers', self.metadata_headers)
            var $content = $('<div>');
            new DynamicTable($content, {
                headers: self.metadata_headers,
                searchPlaceholder: 'Search samples',
                updateFunction: function(pageNum, query, sortColId, sortColDir) {
                    var rows = [];
                    var page_start = pageNum * self.options.pageLimit;
                    var page_limit = self.options.pageLimit;
                    var sorting = null;
                    if (sortColId !== null){
                        sorting = [[sortColId, sortColDir]];
                    }
                    console.log(self.obj_ref)
                    console.log(page_start)
                    console.log(page_limit)
                    console.log(query)
                    console.log(sorting)

                    return self.SetAPI.callFunc('sample_set_to_samples_info',[{
                        ref: self.obj_ref,
                        start: page_start,
                        limit: page_limit,
                        query: query,
                        sort_by: sorting
                    }]).spread((obj) => {
                        for (let j = 0; j < obj['samples'].length; j++){
                            var sample = obj['samples'][j];
                            // check how many id's within this samples
                            for (let i = 0; i < sample['id'].length; i++){
                                var row = [];
                                row.push(sample['kbase_sample_id'])
                                for (const meta_idx in self.metadata_headers){
                                    var meta_header = self.metadata_headers[meta_idx]
                                    var row_str = self.options.default_blank_value;
                                    if (meta_header.id in sample){
                                        row_str = sample[meta_header.id][i]
                                    }
                                    row.push(row_str)
                                }
                                rows.push(row)
                            }
                        }
                        return {
                            rows: rows,
                            start: page_start,
                            query: query,
                            total: obj['num_found']
                        }
                    }).catch(function (err) {
                        console.error(err);
                    });
                },
                style: {'margin-top': '5px'}
            });
            return $content;
        },

        unpack_metadata_to_string: function(metadata){
            var metastr = String(metadata['value']);
            if ('units' in metadata){
                metastr += " " + String(metadata['units']);
            }
            return metastr
        },

        display_name_format: function(field_name){
            return field_name.split('_').join(' ')
        },

        loggedInCallback: function (event, auth) {
            if (!this.state.isOk()) {
                var errorMessage = 'Widget is in invalid state -- cannot render: ' + this.state.info().message;
                console.error(errorMessage);
                this.showError(errorMessage);
                return;
            }
            this.attachClients();
            this.renderBasicTable();
            return this;
        }

    });

});
