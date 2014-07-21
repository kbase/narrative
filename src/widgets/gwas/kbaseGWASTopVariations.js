(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGWASTopVariations",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            width: 400,
            type:"KBaseGwasData.GwasTopVariations"
        },
        workspaceURL: "https://kbase.us/services/ws",


        init: function(options) {
            this._super(options);

            var self = this;

            this.workspaceClient = new Workspace(this.workspaceURL);

            this.workspaceClient.get_objects([{name : this.options.id, workspace: this.options.ws}], 
                function(data){
                    self.collection = data[0];
                    //console.log(data[0].data);
                    self.$elem.append($("<div />").
                    append($("<table/>").addClass("kbgo-table")
                        .append($("<tr/>").append("<td>Kinship Id</td><td>" + self.collection.data.GwasPopulationKinship_obj_id+ "</td>"))
                        .append($("<tr/>").append("<td>Structure Id</td><td>" + self.collection.data.GwasPopulationStructure_obj_id+ "</td>"))
                        .append($("<tr/>").append("<td>Trait Id</td><td>" + self.collection.data.GwasPopulationTrait_obj_id+ "</td>"))
                        .append($("<tr/>").append("<td>Variation Id</td><td>" + self.collection.data.GwasPopulationVariation_obj_id+ "</td>"))
                        .append($("<tr/>").append("<td>Gwas Population Object</td><td>" + self.collection.data.GwasPopulation_obj_id+ "</td>"))
                        .append($("<tr/>").append("<td>Assay</td><td>" + self.collection.data.assay+ "</td>"))
                        .append($("<tr/>").append("<td>KBase Genome Id</td><td>" + self.collection.data.genome.kbase_genome_id + "</td>"))
                        .append($("<tr/>").append("<td>KBase Genome Name</td><td>" + self.collection.data.genome.kbase_genome_name + "</td>"))
                        .append($("<tr/>").append("<td>Source</td><td>" + self.collection.data.genome.source_genome_name + "</td>"))
                        .append($("<tr/>").append("<td>Originator</td><td>" + self.collection.data.originator + "</td>"))
                        .append($("<tr/>").append("<td>Population Size</td><td>" + self.collection.data.num_population+ "</td>"))
                        .append($("<tr/>").append("<td>Protocol</td><td>" + self.collection.data.protocol+ "</td>"))
                        .append($("<tr/>").append("<td>Comments</td><td>" + self.collection.data.comment+ "</td>"))
                    ));
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
                title: "GWAS Top Variation Details"
            };
        }
    });
})( jQuery )
