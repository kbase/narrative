
define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
        'kbase-client-api',
		'jquery-dataTables',
		'kbaseAuthenticatedWidget',
		'kbaseTable',
        'kbaseTabs',
        'AssemblyAPI-client-api',
        'narrativeConfig',
        'bluebird'
	], function(
		KBWidget,
		bootstrap,
		$,
        kbase_client_api,
		jquery_dataTables,
		kbaseAuthenticatedWidget,
		kbaseTable,
        kbaseTabs,
        AssemblyAPI_client_api,
        Config,
        Promise
	) {
    'use strict';

    return KBWidget({
        name: "kbaseGenomeAnnotationAssembly",
        parent : kbaseAuthenticatedWidget,
        version: "1.0.0",
        options: {


        },

        init: function init(options) {
            this._super(options);

            var $self = this;
            $self.obj_ref = $self.options.wsNameOrId + '/' + $self.options.objNameOrId;

            $self.assembly = new AssemblyAPI(Config.url('service_wizard'),{'token':$self.authToken()});
            $self.ws = new Workspace(Config.url('workspace'),{'token':$self.authToken()});
            
            //$self.$elem.append($('<div>').append($('<i class="fa-li fa fa-spinner fa-spin">')));
            $self.$elem.append('loading...');

            // 1) get stats, and show the panel
            var basicInfoCalls = [];
            basicInfoCalls.push(
                $self.assembly.get_stats(this.obj_ref, null)
                        .done(function(stats) {
                            $self.assembly_stats = stats;
                        }));
                        //.catch(function(error) {
                        //    console.error(error);
                        //});
            basicInfoCalls.push(
                $self.ws.get_object_info_new({objects: [{'ref':this.obj_ref}], includeMetadata:1})
                        .done(function(info) {
                            $self.assembly_obj_info = info[0];
                        }));
            Promise.all(basicInfoCalls)
                .then(function() {
                   //console.log('basics assembly info:');
                   //console.log($self.assembly_stats);
                   //console.log($self.assembly_obj_info);
                   $self.renderBasicTable();
                });


            

            return this;
        },


        processContigData: function() {
            var $self = this;

            var contig_table = [];
            for (var id in $self.contig_lengths) {
                if ($self.contig_lengths.hasOwnProperty(id)) {
                    var gc='unknown';
                    if($self.contig_lengths.hasOwnProperty(id)) {
                        gc = $self.contig_gc[id]
                    }
                    var contig = {
                        id: id,
                        len: ($self.contig_lengths[id]),
                        gc: gc.toFixed(4)
                    };
                    contig_table.push(contig);
                }
            }
            $self.contig_table = contig_table;
            //console.log(contig_table);
        },


        renderBasicTable: function() {
            var $self = this;
            var $container = this.$elem;
            $container.empty();

            var $tabPane = $('<div>');
            $container.append($tabPane);


            // Build the overview table
            var $overviewTable = $('<table class="table table-striped table-bordered" \
                style="margin-left: auto; margin-right: auto;"/>');

            function get_table_row(key, value) {
                return $('<tr>').append($('<td>').append(key)).append($('<td>').append(value));
            }


            $overviewTable.append(get_table_row('Name',$self.assembly_obj_info[1]));

            $overviewTable.append(get_table_row('Number of Contigs',$self.assembly_stats['num_contigs'] ));
            $overviewTable.append(get_table_row('Total GC Content',$self.assembly_stats['gc_content'].toFixed(3) ));
            $overviewTable.append(get_table_row('Total Length (kb)',($self.assembly_stats['dna_size']/1000).toFixed(2)));
                


            // Build the tabs
            var $tabs =  new kbaseTabs($tabPane, {
                    tabPosition : 'top',
                    canDelete : true, //whether or not the tab can be removed.
                    tabs : [
                        {
                            tab : 'Assembly Summary',                               //name of the tab
                            content : $('<div>').append($overviewTable),  //jquery object to stuff into the content
                            canDelete : false,                             //override the canDelete param on a per tab basis
                            show : true,      
                        }, {
                            tab : 'Contigs',
                            canDelete : false,
                            showContentCallback: function() { return $self.addContigList(); } // if you don't want to show the content right away, add a callback method that returns the content...
                        },
                    ],
                }
            );

        },

        addContigList: function() {
            var $self = this;
            var $content = $('<div>');


            // 2) get contig lengths and gc, render the table
            
            $self.assembly_stats = {};
            $self.contig_lengths = [];
            $self.contig_gc = [];

            var loadingCalls = [];
            loadingCalls.push(
                $self.assembly.get_contig_lengths(this.obj_ref, null)
                            .done(function(lengths) {
                                $self.contig_lengths = lengths;
                            }));
            loadingCalls.push(
                $self.assembly.get_contig_gc_content(this.obj_ref, null)
                    .done(function(gc) {
                                $self.contig_gc = gc;
                            }));

            Promise.all(loadingCalls)
                .then(function() {
                    $self.processContigData();

                    ////////////////////////////// Contigs Tab //////////////////////////////
                    var $table = $('<table cellpadding="0" cellspacing="0" \
                                        class="table table-striped" \
                                        style="border: 0px; width: 100%; margin-left: 0px; margin-right: 0px;">');

                    var contigsSettings = {
                            "sPaginationType": "full_numbers",
                            "iDisplayLength": 10,
                            "aaSorting": [[ 1, "desc" ]],
                            "aoColumns": [
                                          {sTitle: "Contig Id", mData: "id"},
                                          {sTitle: "Length (bp)", mData: "len"},
                                          {sTitle: "GC Content", mData: "gc"}
                                          ],
                                          "aaData": $self.contig_table,
                                          "oLanguage": {
                                              "sSearch": "Search contigs:",
                                              "sEmptyTable": "No contigs found."
                                          }
                    };
                    $content.empty();
                    $content.append($table);
                    $table.dataTable(contigsSettings);
                });
            

            //return $content.append($('<div>').append($('<i class="fa-li fa fa-spinner fa-spin">')));
            return $content.append('loading');
        },

        appendUI: function appendUI($elem) {
          $elem.append("One day, there will be a widget here.")
        },

    });

});
