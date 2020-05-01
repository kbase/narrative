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
    'bluebird'
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
    Promise
) {
    'use strict';

    return KBWidget({
        name: 'kbaseSampleSetView',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            pageLimit: 10,
            default_blank_value: ""
        },

        init: function (options) {
            this._super(options);

            // var self = this;
            this.obj_ref = this.options.upas.id;
            this.link_ref = this.obj_ref;

            if(options._obj_info) {
                this.ss_info = options._obj_info;
                this.obj_ref = this.ss_info['ws_id'] + '/' + this.ss_info['id'] + '/' + this.ss_info['version'];
                this.link_ref = this.ss_info['ws_id'] + '/' + this.ss_info['name'] + '/' + this.ss_info['version'];
            }

            this.client = new GenericClient(Config.url('service_wizard'), {token: this.authToken()});
            this.ws = new Workspace(Config.url('workspace'),{'token': this.authToken()});

            this.$elem.append($('<div>').attr('align', 'center').append($('<i class="fa fa-spinner fa-spin fa-2x">')));

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
                id: "sample_version",
                text: "version",
                isSortable: true
            }]; // version not in metadata, but included in visualization.
            // get the metadata_keys
            self.client.sync_call('SampleService.get_sample', [{
                id: self.ss_obj_data['samples'][0]['id']
            }]).then(function(sample){
                if (sample.length > 0 && 'node_tree' in sample[0] && sample[0]['node_tree'].length > 0){
                    var node_tree = sample[0]['node_tree'][0]
                    Object.keys(node_tree['meta_controlled']).concat(Object.keys(node_tree['meta_user'])).forEach( function(metakey){
                        self.metadata_headers.push({
                            id: metakey.split(" ").join('_'),
                            text: metakey,
                            isSortable: true
                        })
                    })
                } else {
                    console.error('Error: Could not load the first sample for metadata headers: ' + err);
                }
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
            var $content = $('<div>');
            new DynamicTable($content, {
                headers: [{
                    id: 'name',
                    text: 'Sample Name',
                    isSortable: true
                }, {
                    id: 'sample_id',
                    text: 'Sample ID',
                    isSortable: false
                }].concat(self.metadata_headers),
                searchPlaceholder: 'Search samples',
                updateFunction: function(pageNum, query, sortColId, sortColDir) {
                    var rows = [];
                    var sample_slice = self.ss_obj_data['samples'].slice(
                        pageNum * self.options.pageLimit, (pageNum + 1) * self.options.pageLimit
                    );
                    var sample_queries = [];
                    var sample_data = [];
                    sample_slice.forEach(function (sample_info) {
                        var sample_query_params = {
                            id: sample_info['id']
                        }
                        if ("version" in sample_info){
                            sample_query_params['version'] = sample_info['version']
                        }
                        sample_queries.push(
                            Promise.resolve(self.client.sync_call('SampleService.get_sample', [sample_query_params])).then(function(sample){
                                let samp_data = {};
                                samp_data['version'] = String(sample[0]['version'])
                                for (let i = 0; i < sample[0]['node_tree'].length; i++){
                                    for (const meta_key in sample[0]['node_tree'][i]['meta_controlled']){
                                        samp_data[meta_key] = self.unpack_metadata_to_string(
                                            sample[0]['node_tree'][i]['meta_controlled'][meta_key]
                                        );
                                    }
                                    for (const meta_key in sample[0]['node_tree'][i]['meta_user']){
                                        samp_data[meta_key] = self.unpack_metadata_to_string(
                                            sample[0]['node_tree'][i]['meta_user'][meta_key]
                                        );
                                    }
                                }
                                sample_data.push(samp_data)
                            })
                        )
                        var row = [sample_info['name'], sample_info['id']];
                        rows.push(row);
                    });
                    return Promise.all(sample_queries).then(function(){
                        for (let j = 0; j < rows.length; j++){
                            var row = rows[j];
                            for (const meta_idx in self.metadata_headers){
                                var meta_header = self.metadata_headers[meta_idx]
                                var row_str = self.options.default_blank_value;
                                if (meta_header.text in sample_data[j]){
                                    row_str = sample_data[j][meta_header.text]
                                }
                                row.push(row_str);
                            }
                            rows[j] = row
                        }
                        return {
                            rows: rows,
                            start: pageNum * self.options.pageLimit,
                            query: query,
                            total: self.ss_obj_data['samples'].length
                        }
                    })
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

    });

});
