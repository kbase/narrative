(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGWASTraitTable",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            type: "KBaseGwasData.GwasPopulationTrait",
            width: 1200
        },

        workspaceURL: "https://kbase.us/services/ws",

        init: function(options) {
            this._super(options);

            var self = this;

            this.workspaceClient = new Workspace(this.workspaceURL);

            this.workspaceClient.get_objects([{name : this.options.id, workspace: this.options.ws}], 
                function(data){
                    
                    self.collection = data[0];

                    var id = self.collection.data.GwasPopulation_obj_id;

                    var innerSelf = self;

                    self.workspaceClient.get_objects([{name: id, workspace: self.options.ws}], function(data2){

                        innerSelf.collection = data2[0];

                        var $contTable = $("<dir/>").css('height', 'auto').css('overflow-y', 'scroll');

                        $contTable.attr('id', 'popTable');

                        var $domainTable = $("<table/>").addClass("table table-bordered table-striped");                        
                        var ecotypeDetails = innerSelf.collection.data.ecotype_details;
                        $domainTable.append('<thead><tr><th>Country</th><th>Ecotype Id</th><th>Native Name</th><th>Region</th><th>Site</th><th>Stock Parent</th></tr></thead>');

                        for (var i=0; i<ecotypeDetails.length /*&& i < 100*/; i++) {
                            $domainTable.append($("<tr>")
                                .append($("<td>").append(ecotypeDetails[i].country))
                                .append($("<td>").append(ecotypeDetails[i].ecotype_id))
                                .append($("<td>").append(ecotypeDetails[i].nativename))
                                .append($("<td>").append(ecotypeDetails[i].region))
                                .append($("<td>").append(ecotypeDetails[i].site))
                                .append($("<td>").append(ecotypeDetails[i].stockparent)));
                        }

                        $contTable.append($domainTable);

                        $domainTable.dataTable();

                        innerSelf.$elem.append($contTable);

                    });

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
                title: "GWAS Population Trait Distribution"
            };
        }
    });
})( jQuery )
