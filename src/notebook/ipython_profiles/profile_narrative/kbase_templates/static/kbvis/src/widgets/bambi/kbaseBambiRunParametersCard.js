(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseBambiRunParametersCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            title: "BAMBI run parameters",
            isInCard: false,
            width: 780
        },

//        workspaceURL: "https://kbase.us/services/workspace",

        init: function(options) {
            this._super(options);
            if (this.options.collection === null) {
                //throw an error
                return;
            }

            this.$messagePane = $("<div/>")
                                .addClass("kbwidget-message-pane")
                                .addClass("kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

//            this.workspaceClient = new workspaceService(this.workspaceURL);

            return this.render();
        },

        render: function(options) {

            var self = this;
            self.collection = this.options.collection;
            
			self.$elem.append($("<div />")
					.append($("<table/>").addClass("kbgo-table")

				   	.append($("<tr/>").append("<td>BAMBI Version</td><td>" + self.collection.data.version + "</td>"))
				   	//.append($("<tr/>").append("<td>Input file (temporary)</td><td>" + self.collection.data.input_file_name + "</td>"))
				   	.append($("<tr/>").append("<td>Command line</td><td>" + self.collection.data.command_line + "</td>"))


					.append($("<tr/>").append("<td>Minimal length of a motif </td><td>" + self.collection.data.run_parameters.min_motif_length  + "</td>"))
					.append($("<tr/>").append("<td>Maximal length of a motif </td><td>" + self.collection.data.run_parameters.max_motif_length  + "</td>"))
					.append($("<tr/>").append("<td>Minimal length of a motif block</td><td>" + self.collection.data.run_parameters.min_motif_block_length  + "</td>"))
					.append($("<tr/>").append("<td>Maximal length of a motif block </td><td>" + self.collection.data.run_parameters.max_motif_block_length  + "</td>"))
					.append($("<tr/>").append("<td>Minimal length of a motif gap</td><td>" + self.collection.data.run_parameters.min_motif_gap_length  + "</td>"))
					.append($("<tr/>").append("<td>Maximal length of a motif gap</td><td>" + self.collection.data.run_parameters.max_motif_gap_length  + "</td>"))

					.append($("<tr/>").append("<td>Initialize probability of sequence w/o motif </td><td>" + self.collection.data.run_parameters.initial_rho0  + "</td>"))
					.append($("<tr/>").append("<td>Initialize probability of sequence with motif</td><td>" + self.collection.data.run_parameters.initial_rho1  + "</td>"))
					.append($("<tr/>").append("<td>Background probability of nucleotids [A,T,G,C] </td><td>" 
							+ "[" + self.collection.data.run_parameters.pa  
							+ "," + self.collection.data.run_parameters.pt  
							+ "," + self.collection.data.run_parameters.pg  
							+ "," + self.collection.data.run_parameters.pc  
							+ "]"
							+ "</td>"))
					.append($("<tr/>").append("<td>Number of BAMBI runs to be executed </td><td>" + self.collection.data.run_parameters.number_of_runs  + "</td>"))
					.append($("<tr/>").append("<td>Search for additional sites using the predicted motif </td><td>" + self.collection.data.run_parameters.search_for_minor_sites  + "</td>"))

			));

            return this;
        },

        getData: function() {
            return {
                type: "BambiRunResult",
                id: this.options.bambi_run_result_id,
                workspace: this.options.workspace_id,
                title: "BAMBI run parameters"
            };
        },


        showMessage: function(message) {
            var span = $("<span/>").append(message);

            this.$messagePane.append(span);
            this.$messagePane.removeClass("kbwidget-hide-message");
        },

        hideMessage: function() {
            this.$messagePane.addClass("kbwidget-hide-message");
            this.$messagePane.empty();
        },

        rpcError: function(error) {
            console.log("An error occurred: " + error);
        }
	
    });
})( jQuery );
