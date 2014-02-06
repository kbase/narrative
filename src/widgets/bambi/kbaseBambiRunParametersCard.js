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

        init: function(options) {
            this._super(options);
            var self = this;

            if (this.options.collection === null) {
                //throw an error
                return;
            }

            self.collection = this.options.collection;

                                    self.$elem.append($("<div />")
                                .append($("<table/>").addClass("invtable")
                                        .append($("<tr/>")
                                                .append($("<td />").append("BAMBI Version"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.version)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Command line"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.command_line)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Minimal length of a motif"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.run_parameters.min_motif_length)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Maximal length of a motif"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.run_parameters.max_motif_length)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Minimal length of a motif block"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.run_parameters.min_motif_block_length)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Maximal length of a motif block"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.run_parameters.max_motif_block_length)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Minimal length of a motif gap"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.run_parameters.min_motif_gap_length)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Maximal length of a motif gap"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.run_parameters.max_motif_gap_length)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Initialize probability of sequence w/o motif"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.run_parameters.initial_rho0)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Initialize probability of sequence with motif"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.run_parameters.initial_rho1)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Background probability of nucleotids [A,T,G,C]"))
                                                .append($("<td />").addClass("invtable-boldcell").append("[" + self.collection.data.run_parameters.pa  
							+ "," + self.collection.data.run_parameters.pt  
							+ "," + self.collection.data.run_parameters.pg  
							+ "," + self.collection.data.run_parameters.pc  
							+ "]")))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Number of BAMBI runs to be executed"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.run_parameters.number_of_runs)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Search for additional sites using the predicted motif"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.run_parameters.search_for_minor_sites)))
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
