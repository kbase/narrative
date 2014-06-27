(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGWASPopTable",
        parent: "kbaseWidget",
        version: "1.0.0",
        //width: 600,
        options: {
            width: 780,
            height: 390,
            type: "KBaseGwasData.GwasPopulation"
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

                    var domainTable = $("<table/>").addClass("table table-bordered table-striped").attr("id", "popTable");                        
                    var ecotypeDetails = self.collection.data.ecotype_details;

                    var innerHTML = "<thead><tr><th>Country</th><th>Ecotype Id</th><th>Native Name</th><th>Region</th><th>Site</th><th>Stock Parent</th></tr></thead><tbody>";

                    for (var i = 0; i < ecotypeDetails.length; i++) {
                        innerHTML = innerHTML +
                            "<tr>" +
                            "<td>" + ecotypeDetails[i].country + "</td>" +
                            "<td>" + ecotypeDetails[i].ecotype_id + "</td>" +
                            "<td>" + ecotypeDetails[i].nativename + "</td>" +
                            "<td>" + ecotypeDetails[i].region + "</td>" +
                            "<td>" + ecotypeDetails[i].site + "</td>" +
                            "<td>" + ecotypeDetails[i].stockparent + "</td>" +
                            "</tr>";
                    }
                    innerHTML += "</tbody>";

                    //make the table contents what we just created as a string
                    domainTable.html(innerHTML);

                    self.$elem.append(domainTable);

                    $("#popTable").dataTable({"iDisplayLength": 4, "bLengthChange": false})
                    $("#popTable_wrapper").css("overflow-x","hidden");
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
