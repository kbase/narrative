(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGWASPopTable",
        parent: "kbaseWidget",
        version: "1.0.0",
        //width: 600,
        options: {
            width: 780,
            type: "KBaseGwasData.GwasPopulation"
        },
        //workspaceURL: "https://kbase.us/services/workspace",
        workspaceURL: "https://kbase.us/services/ws",


        init: function(options) {
            this._super(options);

            var self = this;

            this.workspaceClient = new workspaceService(this.workspaceURL);

            //this.workspaceClient.get_object({"id" : 'arabidopsis_population_atwell_et_al', "type" : this.options.type, "workspace": 'genotype_phenotype'}, 
            this.workspaceClient.get_object({"id" : this.options.id, "type" : this.options.type, "workspace": this.options.ws}, 
                function(data){
                    console.log(data);
                    self.collection = data;
                    //self.$elem.append("<h3>GWAS Population Ecotype Details</h3>");

                    var $domainTable = $("<table/>").addClass("table table-bordered table-striped");                        
                    var ecotypeDetails = self.collection.data.ecotype_details;
                    $domainTable.append('<thead><tr><th>Country</th><th>Ecotype Id</th><th>Native Name</th><th>Region</th><th>Site</th><th>Stock Parent</th></tr></thead>');

                    for (var i=0; i<ecotypeDetails.length && i < 100; i++) {
                        $domainTable.append($("<tr>")
                            .append($("<td>").append(ecotypeDetails[i].country))
                            .append($("<td>").append(ecotypeDetails[i].ecotype_id))
                            .append($("<td>").append(ecotypeDetails[i].nativename))
                            .append($("<td>").append(ecotypeDetails[i].region))
                            .append($("<td>").append(ecotypeDetails[i].site))
                            .append($("<td>").append(ecotypeDetails[i].stockparent)));
                    }
                    self.$elem.append($domainTable);



                   
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
                title: "GWAS Population Ecotype Details"
            };
        }
    });
})( jQuery )
