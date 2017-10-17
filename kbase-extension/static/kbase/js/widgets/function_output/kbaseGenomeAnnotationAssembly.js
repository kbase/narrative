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
        name: 'kbaseGenomeAnnotationAssembly',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            pageLimit: 10

        },

        init: function init(options) {
            this._super(options);

            var self = this;
            self.obj_ref = self.options.wsNameOrId + '/' + self.options.objNameOrId;
            self.link_ref = self.obj_ref;

            if(options._obj_info) {
                self.assembly_info = options._obj_info;
                self.obj_ref = self.assembly_info['ws_id'] + '/' + self.assembly_info['id'] + '/' + self.assembly_info['version'];
                self.link_ref = self.assembly_info['ws_id'] + '/' + self.assembly_info['name'] + '/' + self.assembly_info['version'];
            }

            self.client = new GenericClient(Config.url('service_wizard'), {token: self.authToken()});
            self.ws = new Workspace(Config.url('workspace'),{'token':self.authToken()});

            self.$elem.append($('<div>').attr('align', 'center').append($('<i class="fa fa-spinner fa-spin fa-2x">')));

            // 1) get stats, and show the panel
            var basicInfoCalls = [];
            basicInfoCalls.push(
                Promise.resolve(self.client.sync_call('AssemblyAPI.get_stats', [this.obj_ref]))
                    .then(function(stats) {
                        self.assembly_stats = stats[0];
                    }));
            basicInfoCalls.push(
                Promise.resolve(self.ws.get_object_info_new({objects: [{'ref':this.obj_ref}], includeMetadata:1}))
                    .then(function(info) {
                        self.assembly_obj_info = info[0];
                        self.link_ref = info[0][6] + '/' + info[0][1] + '/' + info[0][4];
                    }));
            Promise.all(basicInfoCalls)
                .then(function() {
                    self.renderBasicTable();
                })
                .catch(function(err) {
                    console.error('an error occurred! ' + err);
                    self.$elem.empty();
                    self.$elem.append('Error' + JSON.stringify(err));
                });

            return this;
        },


        processContigData: function() {
            var self = this;

            var contig_table = [];
            for (var id in self.contig_lengths) {
                if (self.contig_lengths.hasOwnProperty(id)) {
                    var gc='unknown';
                    if(self.contig_lengths.hasOwnProperty(id)) {
                        gc = String((self.contig_gc[id]*100).toFixed(2)) + '%';
                    }
                    var contig = {
                        id: id,
                        len: '<!--' + self.contig_lengths[id] + '-->' + String(self.numberWithCommas(self.contig_lengths[id]))+' bp',
                        gc:  gc
                    };
                    contig_table.push(contig);
                }
            }
            self.contig_table = contig_table;
            //console.log(contig_table);
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
                '<a href="/#dataview/'+self.link_ref + '" target="_blank">' + self.assembly_obj_info[1] +'</a>' ));
                // leave out version for now, because that is not passed into data widgets
                //'<a href="/#dataview/'+self.link_ref + '" target="_blank">' + self.assembly_obj_info[1] + ' (v'+self.assembly_obj_info[4]+')'+'</a>' ));
            $overviewTable.append(get_table_row('Number of Contigs', self.assembly_stats['num_contigs'] ));
            $overviewTable.append(get_table_row('Total GC Content',  String((self.assembly_stats['gc_content']*100).toFixed(2)) + '%' ));
            $overviewTable.append(get_table_row('Total Length',      String(self.numberWithCommas(self.assembly_stats['dna_size']))+' bp'  )  );


            // Build the tabs
            var $tabs = new kbaseTabs($tabPane, {
                tabPosition : 'top',
                canDelete : true, //whether or not the tab can be removed.
                tabs : [
                    {
                        tab : 'Assembly Summary',   //name of the tab
                        content : $('<div>').css('margin-top','15px').append($overviewTable),  //jquery object to stuff into the content
                        canDelete : false, //override the canDelete param on a per tab basis
                        show : true,
                    }, {
                        tab : 'Contigs',
                        canDelete : false,
                        showContentCallback: function() {
                            return self.addContigList();
                        }
                    },
                ],
            });
        },

        addContigList: function() {
            var self = this;
            var $content = $('<div>');
            new DynamicTable($content, {
                headers: [{
                    id: 'contig_id',
                    text: 'Contig ID',
                    isSortable: true
                }, {
                    id: 'length',
                    text: 'Length (bp)',
                    isSortable: true
                }, {
                    id: 'gc',
                    text: 'GC Content',
                    isSortable: true
                }],
                searchPlaceholder: 'Search contigs',
                updateFunction: function(pageNum, query, sortColId, sortColDir) {
                    var sortBy = [];
                    if (sortColId && sortColDir !== 0) {
                        sortBy.push([sortColId, sortColDir < 0 ? 0 : 1]);
                    }
                    return Promise.resolve(self.client.sync_call('AssemblyAPI.search_contigs', [{
                        ref: self.obj_ref,
                        query: query,
                        sort_by: sortBy,
                        start: pageNum * self.options.pageLimit
                    }]))
                    .then(function(results) {
                        results = results[0];
                        var rows = [];
                        results.contigs.forEach(function(contig) {
                            rows.push([contig.contig_id, contig.length, contig.gc]);
                        });
                        return {
                            rows: rows,
                            start: results.start,
                            query: results.query,
                            total: results.num_found,
                        };
                    });
                },
                style: {'margin-top': '5px'}
            });
            return $content;
        },

        numberWithCommas: function(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
    });

});
