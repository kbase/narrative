/**
 * Just a simple example widget to display promconstraints
 * 
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "kbasePromConstraint",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            color: "black",
        },

        init: function(options) {
            this._super(options);
            var self = this;
            var ws = options.ws;
            var name = options.name;            

            console.log('ws/name', ws, name)
            var container = this.$elem;

            container.loading();
            var p = kb.ws.get_objects([{workspace: ws, name: name}]);
            $.when(p).done(function(data){
                var reflist = data[0].refs;
                reflist.push(data[0].data.genome_ref);

                var prom = kb.ui.translateRefs(reflist);
                $.when(prom).done(function(refhash) {
                    container.rmLoading();

                    buildTable(data, refhash)
                })
            }).fail(function(e){
                container.rmLoading();
                container.append('<div class="alert alert-danger">'+
                                e.error.message+'</div>')
            });


            function buildTable(data, refhash) {
                // setup tabs
                var pcTable = $('<table class="table table-bordered table-striped" style="width: 100%;">');

                var tabs = container.kbTabs({tabs: [
                                            {name: 'Overview', active: true},
                                            {name: 'PROM Constraint', content: pcTable}]
                                          })

                // Code to displaying overview data
                var keys = [
                    {key: 'wsid'},
                    {key: 'ws'},
                    {key: 'kbid'},
                    {key: 'source'},
                    {key: 'genome'},
		    {key: 'expression'},
		    {key: 'regulome'},
                    {key: 'type'},
                    {key: 'errors'},
                    {key: 'owner'},
                    {key: 'date'}
                ];
                var phenooverdata = {
                    wsid: data[0].info[1],
                    ws: data[0].info[7],
                    kbid: data[0].data.id,
                    source: data[0].data.source,
                    genome: refhash[data[0].data.genome_ref].link, //data[0].data.genome_ref, 
		    expression: refhash[data[0].data.expression_series_ref].link,
		    //		    regulome: refhash[data[0].data.regulome_ref].link,
                    type: data[0].data.type,
                    errors: data[0].data.importErrors,
                    owner: data[0].creator,
                    date: data[0].created,
                };
                var labels = ['Name','Workspace','KBID','Source','Genome','Expression Series','Regulome','Type','Errors','Owner','Creation date'];
                var table = kb.ui.objTable('overview-table',phenooverdata,keys,labels);
                tabs.tabContent('Overview').append(table)

		    // reformat the promconstraint into one row per TF/TG pair
                var promc = data[0].data;
		var pcdata = [];

		console.log(promc);
		for (var i=0; i < promc.transcriptionFactorMaps.length; i++) {
		    var pair = promc.transcriptionFactorMaps[i];
		    for (var j=0; j < pair.targetGeneProbs.length; j++) {
			var tgProbs = pair.targetGeneProbs[j];
			pcdata.push([pair.transcriptionFactor_ref,tgProbs.target_gene_ref,tgProbs.probTGonGivenTFoff,tgProbs.probTGonGivenTFon]);
		    }
		}
		console.log(pcdata);

		// create a table from the reformatted promconstraint data
                var tableSettings = {
                     "sPaginationType": "bootstrap",
                     "iDisplayLength": 10,
                     "aaData": pcdata,
                     "aaSorting": [[ 0, "asc" ]],
                     "aoColumns": [
		{ "sTitle": "Transcription Factor", 'mData': function (d) { return d[0]}},
                       { "sTitle": "Target Gene", 'mData': function (d) { return d[1]}},
                       { "sTitle": "Prob TG On | TF off", 'mData': function (d) { return d[2]}},
                       { "sTitle": "Prob TG On | TF on", 'mData': function (d) { return d[3]}},
                     ],                         
                     "oLanguage": {
                         "sEmptyTable": "No objects in workspace",
                         "sSearch": "Search: "
                     }
                }
                var table = pcTable.dataTable(tableSettings);

	    }
    

            return this;
        }
    });
})( jQuery )