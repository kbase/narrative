(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGWASGeneListTable",
        parent: "kbaseWidget",
        version: "1.0.0",
        //width: 600,
        options: {
            width: 1200,
            height: 800,
            type: "KBaseGwasData.GwasGeneList"
        },
        workspaceURL: "https://kbase.us/services/ws",


        init: function(options) {
            this._super(options);

            var self = this;

            this.workspaceClient = new Workspace(this.workspaceURL);

            //this.workspaceClient.get_object({"id" : 'arabidopsis_population_atwell_et_al', "type" : this.options.type, "workspace": 'genotype_phenotype'}, 
            this.workspaceClient.get_objects([{name : this.options.id, workspace: this.options.ws}], 
                function(data){
                    self.collection = data[0];
                    console.log(self.collection);

                    var $contTable = $("<dir/>").css('height', 'auto').css('overflow-y', 'scroll');

                    $contTable.attr('id', 'popTable');

                    var $domainTable = $("<table/>").addClass("table table-bordered table-striped");                        
                    var genes = self.collection.data.genes;
                    $domainTable.append('<thead><tr><th>Chromosome Id</th><th>KBase Chromosome Id</th><th>Gene Id</th><th>KBase Gene Id</th><th>Gene Function</th></tr></thead>');

                    for (var i=0; i<genes.length /*&& i < 100*/; i++) {
                        $domainTable.append($("<tr>")
                            .append($("<td>").append(genes[i][4]))
                            .append($("<td>").append(genes[i][0]))
                            .append($("<td>").append(genes[i][1]))
                            .append($("<td>").append(genes[i][2]))
                            .append($("<td>").append(genes[i][3])));
                    }

                    $contTable.append($domainTable);

                    $domainTable.dataTable();

                    self.$elem.append($contTable);
                },

                self.rpcError
            );

            return this;
        },

        getData: function() {
            return {
                type:this.options.type,
                id: this.options.id,
                workspace: this.options.ws,
                title: "GWAS Gene List Details"
            };
        }
    });
})( jQuery )
