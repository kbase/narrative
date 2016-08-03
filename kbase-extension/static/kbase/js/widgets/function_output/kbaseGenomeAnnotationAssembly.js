
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

            var assembly = new AssemblyAPI(Config.url('service_wizard'),{'token':$self.authToken()});
            var ws = new Workspace(Config.url('workspace'),{'token':$self.authToken()});
            
            $self.$elem.append('loading...');

            // 1) get stats, and show the panel
            var basicInfoCalls = [];
            basicInfoCalls.push(
                assembly.get_stats(this.obj_ref, null)
                        .done(function(stats) {
                            $self.assembly_stats = stats;
                        }));
                        //.catch(function(error) {
                        //    console.error(error);
                        //});
            basicInfoCalls.push(
                ws.get_object_info_new({objects: [{'ref':this.obj_ref}], includeMetadata:1})
                        .done(function(info) {
                            $self.assembly_obj_info = info[0];
                        }));
            Promise.all(basicInfoCalls)
                .then(function() {
                   console.log('basics assembly info:');
                   console.log($self.assembly_stats);
                   console.log($self.assembly_obj_info);
                   $self.renderBasicTable();
                });


            // 2) get contig lengths and gc, render the table
            /*
            $self.assembly_stats = {};
            $self.contig_lengths = [];
            $self.contig_gc = [];

            var loadingCalls = [];
            loadingCalls.push(
                assembly.get_contig_lengths(this.obj_ref, null)
                            .done(function(lengths) {
                                $self.contig_lengths = lengths;
                            }));
            loadingCalls.push(
                assembly.get_contig_gc_content(this.obj_ref, null)
                    .done(function(gc) {
                                $self.contig_gc = gc;
                            }));

            Promise.all(loadingCalls)
                .then(function() {
                    $self.processContigDataAndRender();
                });
            */

            return this;
        },


        processContigDataAndRender: function() {
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
                        len: $self.contig_lengths[id],
                        gc: gc
                    };
                    contig_table.push(contig);
                }
            }
            console.log(contig_table);

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
                            tab : 'Summary',                                     //name of the tab
                            content : $('<div>').append($overviewTable),  //jquery object to stuff into the content
                            canDelete : false,                             //override the canDelete param on a per tab basis
                            show : true,      
                        }, {
                            tab : 'Contigs',
                            canDelete : false,                               //boolean. This tab gets shown by default. If not specified, the first tab is shown
                            showContentCallback: function() {console.log('here');} // if you don't want to show the content right away, add a callback method that returns the content...
                        },
                    ],
                }
            );





                    /*////////////////////////////// Contigs Tab //////////////////////////////
                    $('#'+pref+'contigs').append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'contigs-table" \
                    class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;"/>');
                    var contigsData = [];

                    for (var pos in cs.contigs) {
                        var contig = cs.contigs[pos];
                        contigsData.push({name: contig.id, length: contig.length});
                    }
                    var contigsSettings = {
                            "sPaginationType": "full_numbers",
                            "iDisplayLength": 10,
                            "aaSorting": [[ 1, "desc" ]],
                            "aoColumns": [
                                          {sTitle: "Contig name", mData: "name"},
                                          {sTitle: "Length", mData: "length"}
                                          ],
                                          "aaData": [],
                                          "oLanguage": {
                                              "sSearch": "Search contig:",
                                              "sEmptyTable": "No contigs found."
                                          }
                    };
                    var contigsTable = $('#'+pref+'contigs-table').dataTable(contigsSettings);
                    contigsTable.fnAddData(contigsData);*/


        },

        appendUI: function appendUI($elem) {
          $elem.append("One day, there will be a widget here.")
        },

    });

});
