(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGWASPop",
        parent: "kbaseWidget",
        version: "1.0.0",
        //width: 600,
        options: {
            width: 400,
            type: "KBaseGwasData.GwasPopulation"
        },
        //workspaceURL: "https://kbase.us/services/workspace",
        workspaceURL: "https://kbase.us/services/ws",


        init: function(options) {
            this._super(options);

            var self = this;

            this.workspaceClient = new Workspace(this.workspaceURL);

            console.log(this.options);


            // this.workspaceClient.get_object({"id" : 'arabidopsis_population_atwell_et_al', "type" : this.options.type, "workspace": 'genotype_phenotype'}, 
            //this.workspaceClient.get_object({"id" : this.options.id, "type" : this.options.type, "workspace": this.options.ws}, 
            this.workspaceClient.get_objects([{name : this.options.id, workspace: this.options.ws}], 
                function(data){
                    self.collection = data[0];
                    console.log(data[0]);
                    self.$elem.append($("<div />").
                    append($("<table/>").addClass("kbgo-table")
                        .append($("<tr/>").append("<td>ID</td><td>" + self.collection.data.genome.kbase_genome_id + "</td>"))
                        .append($("<tr/>").append("<td>Name</td><td>" + self.collection.data.genome.kbase_genome_name + "</td>"))
                        .append($("<tr/>").append("<td>Source</td><td>" + self.collection.data.genome.source + "</td>"))
                        .append($("<tr/>").append("<td>Source Name</td><td>" + self.collection.data.genome.source_genome_name + "</td>"))
                        .append($("<tr/>").append("<td>Description</td><td>" + self.collection.data.GwasPopulation_description + "</td>"))
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
                title: "GWAS Population Details"
            };
        }
    });
})( jQuery )
