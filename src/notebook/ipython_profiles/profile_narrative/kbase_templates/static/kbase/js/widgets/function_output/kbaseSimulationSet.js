
(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseSimulationSet",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            color: "black",
        },

    init: function(options) {
            this._super(options);
            var self = this;

            var container = this.$elem
            var ws = options.ws;
            var name = options.name;

            console.log('ws/name', ws, name)

            container.loading();
            var p = kb.ws.get_objects([{workspace: ws, name: name}])
            $.when(p).done(function(data){
            	var ref = data[0].data.phenotypeset_ref.split("/");
            	var np = kb.ws.get_objects([{wsid: ref[0], objid: ref[1]}])
            	$.when(np).done(function(pdata){
                	container.rmLoading();
                	data[0].data.phenoset = pdata[0].data
                	buildTable(data);
                }).fail(function(e){
                	container.rmLoading();
                	container.append('<div class="alert alert-danger">'+
                                e.error.message+'</div>')
            	});
            }).fail(function(e){
                container.rmLoading();
                container.append('<div class="alert alert-danger">'+
                                e.error.message+'</div>')
            });                    


  
            var container = this.$elem;

            function buildTable(data) {
                var simu = data[0].data
                var simuTable = $('<table class="table table-bordered table-striped" style="width: 100%;">');
                var tabs = container.kbTabs({tabs: [
                                            {name: 'Overview', active: true},
                                            {name: 'Simulation Results', content: simuTable}]
                                          })

                var keys = [
                    {key: 'wsid'},
                    {key: 'ws'},
                    {key: 'cp'},
                    {key: 'cn'},
                    {key: 'fp'},
                    {key: 'fn'},
                    {key: 'ac'},
                    {key: 'sn'},
                    {key: 'sp'},
                    {key: 'owner'},
                    {key: 'date'}
                ];
				
				var cp = 0;
				var cn = 0;
				var fp = 0;
				var fn = 0;
				for (var count in simu.phenotypeSimulations) {
					var sim = simu.phenotypeSimulations[count];
					if (sim.phenoclass == 'CP') {
						cp = cp+1;
					}
					if (sim.phenoclass == 'CN') {
						cn = cn+1;
					}
					if (sim.phenoclass == 'FP') {
						fp = fp+1;
					}
					if (sim.phenoclass == 'FN') {
						fn = fn+1;
					}
					sim.media = simu.phenoset.phenotypes[count].media_ref;
					sim.geneko = "";
					for (var y in simu.phenoset.phenotypes[count].geneko_refs) {
						sim.geneko.concat(simu.phenoset.phenotypes[count].geneko_refs[y].split("/").pop(),";");
					}
					sim.compounds = "";
					for (var y in simu.phenoset.phenotypes[count].additionalcompound_refs) {
						sim.compounds.concat(simu.phenoset.phenotypes[count].additionalcompound_refs[y].split("/").pop(),";");
					}					
				}
				var ac = (cp+cn)/(cp+cn+fp+fn);
				var sn = (cp)/(cp+fn);
				var sp = (cn)/(cn+fp);
				
                var simudata = {
                    wsid: data[0].info[1],
                    ws: data[0].info[7],
                    cp: cp,
                    cn: cn,
                    fp: fp,
                    fn: fn,
                    ac: ac,
                    sn: sn,
                    sp: sp,                   
                    owner: data[0].info[5],
                    date: data[0].info[3],
                };

                var labels = ['Name','Workspace','Correct positives','Correct negatives','False positives','False negatives','Accuracy','Sensitivty','Specificity','Owner','Creation date'];
                var table = kb.ui.objTable('overview-table',simudata,keys,labels);
                tabs.tabContent('Overview').append(table)

                var tableSettings = {
                     "sPaginationType": "bootstrap",
                     "iDisplayLength": 10,
                     "aaData": simu.phenotypeSimulations,
                     "aaSorting": [[ 3, "desc" ]],
                     "aoColumns": [
                       { "sTitle": "Base media", 'mData': function(d) {
                         return d.media;
                       }},
                       { "sTitle": "Additional Compounds", 'mData': function(d) {
                         return d.compounds;
                       }},
                       { "sTitle": "Gene KO", 'mData': function(d) {
                         return d.geneko;
                       }},
                       { "sTitle": "Class", 'mData': function(d) {
                         return d.phenoclass;
                       }},
                       { "sTitle": "Simulated Growth", 'mData': function(d) {
                         return d.simulatedGrowth
                       }},
                       { "sTitle": "Simulated Growth Fraction", 'mData': function(d) {
                         return d.simulatedGrowthFraction
                       }},
                      ],                         
                }

                simuTable.dataTable(tableSettings);
            }

            return this;
            
        }
 

    });
})( jQuery )