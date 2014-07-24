
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
                container.rmLoading();
                buildTable(data);
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
                                            {name: 'SimulationSet', content: simuTable}]
                                          })

                var keys = [
                    {key: 'wsid'},
                    {key: 'ws'},
                    {key: 'kbid'},
                    {key: 'source'},
                    {key: 'type'},
                    {key: 'errors'},
                    {key: 'owner'},
                    {key: 'date'}
                ];

                var simudata = {
                    wsid: data[0].info[1],
                    ws: data[0].info[7],
                    kbid: simu.id,
                    source: simu.phenoclass,
                    type: simu.simulatedGrowth,
                    errors: simu.simulatedGrowthFraction,
                    owner: data[0].creator,
                    date: data[0].created,
                };

                var labels = ['Name','Workspace','KBID','Type','Errors','Owner','Creation date'];
                var table = kb.ui.objTable('overview-table',simudata,keys,labels);
                tabs.tabContent('Overview').append(table)

                var tableSettings = {
                     "sPaginationType": "bootstrap",
                     "iDisplayLength": 10,
                     "aaData": simu.phenotypeSimulations,
                     "aaSorting": [[ 3, "desc" ]],
                     "aoColumns": [
                       { "sTitle": "Name", 'mData': 'id'},
                       { "sTitle": "phenoclass", 'mData': function(d) {
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