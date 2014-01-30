(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGWASVarTable",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            width: 500,
            type:"KBaseGwasData.GwasPopulationVariation"
        },
        workspaceURL: "https://kbase.us/services/ws",


        init: function(options) {
            this._super(options);

            var self = this;
            console.log('inside init function')

            this.workspaceClient = new Workspace(this.workspaceURL);

            this.workspaceClient.get_objects([{name : this.options.id, workspace: this.options.ws}], 
                function(data){
                    self.collection = data[0];
                    self.$elem.append($("<div />").
                    append($("<table/>").addClass("kbgo-table")
                        .append($("<tr/>").append("<td>Gwas Population Object</td><td>" + self.collection.data.GwasPopulation_obj_id+ "</td>"))
                        .append($("<tr/>").append("<td>assay</td><td>" + self.collection.data.assay + "</td>"))
                        .append($("<tr/>").append("<td>filetype</td><td>" + self.collection.data.filetype + "</td>"))
                        .append($("<tr/>").append("<td>kbase_genome_id</td><td>" + self.collection.data.genome.kbase_genome_id + "</td>"))
                        .append($("<tr/>").append("<td>kbase_genome_name</td><td>" + self.collection.data.genome.kbase_genome_name + "</td>"))
                        .append($("<tr/>").append("<td>source_genome_name</td><td>" + self.collection.data.genome.source_genome_name + "</td>"))
                        .append($("<tr/>").append("<td>originator</td><td>" + self.collection.data.originator + "</td>"))
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
                title: "GWAS Variation Details"
            };
        }
    });
})( jQuery )
