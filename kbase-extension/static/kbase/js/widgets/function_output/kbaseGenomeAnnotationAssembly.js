
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
            $self.link_ref = $self.obj_ref;

            if(options._obj_info) {
                $self.assembly_info = options._obj_info;
                $self.obj_ref = $self.assembly_info['ws_id'] + '/' + $self.assembly_info['id'] + '/' + $self.assembly_info['version'];
                $self.link_ref = $self.assembly_info['ws_id'] + '/' + $self.assembly_info['name'] + '/' + $self.assembly_info['version'];
            }

            $self.assembly = new AssemblyAPI(Config.url('service_wizard'),{'token':$self.authToken()});
            $self.ws = new Workspace(Config.url('workspace'),{'token':$self.authToken()});
            
            $self.$elem.append($('<div>').attr('align', 'center').append($('<i class="fa fa-spinner fa-spin fa-2x">')));

            // 1) get stats, and show the panel
            var basicInfoCalls = [];
            basicInfoCalls.push(
                $self.assembly.get_stats(this.obj_ref, null)
                        .done(function(stats) {
                            $self.assembly_stats = stats;
                        }));
            basicInfoCalls.push(
                $self.ws.get_object_info_new({objects: [{'ref':this.obj_ref}], includeMetadata:1})
                        .done(function(info) {
                            $self.assembly_obj_info = info[0];
                            $self.link_ref = info[0][6] + '/' + info[0][1] + '/' + info[0][4];
                        }));
            Promise.all(basicInfoCalls)
                .then(function() {
                   $self.renderBasicTable();
                })
                .catch(function(err) {
                    $self.$elem.empty();
                    $self.$elem.append('Error' + JSON.stringify(err));
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
                        gc = String(($self.contig_gc[id]*100).toFixed(2)) + '%';
                    }
                    var contig = {
                        id: id,
                        len: '<!--' + $self.contig_lengths[id] + '-->' + String($self.numberWithCommas($self.contig_lengths[id]))+' bp',
                        gc:  gc
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
            var $overviewTable = $('<table class="table table-striped table-bordered table-hover" style="margin-left: auto; margin-right: auto;"/>');

            function get_table_row(key, value) {
                return $('<tr>').append($('<td>').append(key)).append($('<td>').append(value));
            }

            $overviewTable.append(get_table_row('KBase Object Name',
                '<a href="/#dataview/'+$self.link_ref + '" target="_blank">' + $self.assembly_obj_info[1] +'</a>' ));
                // leave out version for now, because that is not passed into data widgets
                //'<a href="/#dataview/'+$self.link_ref + '" target="_blank">' + $self.assembly_obj_info[1] + ' (v'+$self.assembly_obj_info[4]+')'+'</a>' ));
            $overviewTable.append(get_table_row('Number of Contigs', $self.assembly_stats['num_contigs'] ));
            $overviewTable.append(get_table_row('Total GC Content',  String(($self.assembly_stats['gc_content']*100).toFixed(2)) + '%' ));
            $overviewTable.append(get_table_row('Total Length',      String($self.numberWithCommas($self.assembly_stats['dna_size']))+' bp'  )  );
            

            // Build the tabs
            var $tabs =  new kbaseTabs($tabPane, {
                    tabPosition : 'top',
                    canDelete : true, //whether or not the tab can be removed.
                    tabs : [
                        {
                            tab : 'Assembly Summary',                               //name of the tab
                            content : $('<div>').css('margin-top','15px').append($overviewTable),  //jquery object to stuff into the content
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
            $self.$contigTablePanel = $content;


            // Get contig lengths and gc, render the table
            
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

                    // sort extension for length- is there a better way?
                    if(!$.fn.dataTableExt.oSort['genome-annotation-assembly-hidden-number-stats-pre']) {
                        $.extend( $.fn.dataTableExt.oSort, {
                            "genome-annotation-assembly-hidden-number-stats-pre": function ( a ) {
                                // extract out the first comment if it exists, then parse as number
                                var t = a.split('-->');
                                if(t.length>1) {
                                    var t2 = t[0].split('<!--');
                                    if(t2.length>1) {
                                        return Number(t2[1]);
                                    }
                                }
                                return Number(a);
                            },
                            "genome-annotation-assembly-hidden-number-stats-asc": function( a, b ) {
                                return ((a < b) ? -1 : ((a > b) ? 1 : 0));
                            },
                            "genome-annotation-assembly-hidden-number-stats-desc": function(a,b) {
                                return ((a < b) ? 1 : ((a > b) ? -1 : 0));
                            }
                        } );
                    }

                    ////////////////////////////// Contigs Tab //////////////////////////////
                    var $table = $('<table class="table table-striped table-bordered table-hover" style="width: 100%; border: 1px solid #ddd; margin-left: auto; margin-right: auto;" >');

                    var contigsPerPage = 10;
                    var sDom = 'lft<ip>';
                    if($self.contig_table.length<contigsPerPage) {
                        sDom = 'fti';
                    }

                    var contigsSettings = {
                        "bFilter": true,
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": contigsPerPage,
                        "aaSorting": [[ 1, "desc" ]],
                        
                        "sDom": sDom,

                        "columns": [
                            {sTitle: 'Contig Id', data: "id"},
                            {sTitle: "Length", data: "len"},
                            {sTitle: "GC Content", data: "gc"}
                        ],
                        "columnDefs": [
                            { "type": "genome-annotation-assembly-hidden-number-stats", targets: [1] }
                        ],
                        "data": $self.contig_table,
                        "language": {
                            "lengthMenu": "_MENU_ Contigs per page",
                            "zeroRecords": "No Matching Contigs Found",
                            "info": "Showing _START_ to _END_ of _TOTAL_ Contigs",
                            "infoEmpty": "No Contigs",
                            "infoFiltered": "(filtered from _MAX_)",
                            "search" : "Search Contigs"
                        }
                    };
                    $content.empty();
                    $content.append($('<div>').css('padding','10px 0px').append($table));
                    $table.dataTable(contigsSettings);
                })
                .catch(function(err) {
                    $content.empty();
                    $content.append('Error' + JSON.stringify(err));
                    console.err($self);
                    console.err(err);
                });
            
            return $content.append('<br>').append($('<div>').attr('align', 'center').append($('<i class="fa fa-spinner fa-spin fa-2x">')));
        },

        appendUI: function appendUI($elem) {
          $elem.append("One day, there will be a widget here.")
        },

        numberWithCommas: function(x) {
            //var parts = x.toString().split(".");
            //parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            //return parts.join(".");
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

    });

});
