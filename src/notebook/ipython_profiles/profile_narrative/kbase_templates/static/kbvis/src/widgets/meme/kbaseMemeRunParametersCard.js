(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseMemeRunParametersCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            title: "MEME run parameters",
            isInCard: false,
            width: 780
        },


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

            return this.render();
        },

        render: function(options) {

            var self = this;
            self.collection = this.options.collection;
            
			self.$elem.append($("<div />")
					.append($("<table/>").addClass("kbgo-table")
				    .append($("<tr/>").append("<td>MEME Version</td><td>" + self.collection.data.version + "</td>"))
//				    .append($("<tr/>").append("<td>Input file (temporary)</td><td>" + self.collection.data.input_file_name + "</td>"))
				    .append($("<tr/>").append("<td>Command line</td><td>" + self.collection.data.command_line + "</td>"))
					.append($("<tr/>").append("<td>Source reference</td><td>" + self.collection.data.params.source_ref + "</td>"))
					.append($("<tr/>").append("<td>Source ID</td><td>" + self.collection.data.params.source_id + "</td>"))
					.append($("<tr/>").append("<td>Mode of distribution</td><td>" + self.collection.data.mod + "</td>"))
					.append($("<tr/>").append("<td>Number of motifs</td><td>" + self.collection.data.nmotifs + "</td>"))
					.append($("<tr/>").append("<td>Minimal motif width</td><td>" + self.collection.data.minw + "</td>"))
					.append($("<tr/>").append("<td>Maximal motif width</td><td>" + self.collection.data.maxw + "</td>"))
					.append($("<tr/>").append("<td>Minimal number of sites</td><td>" + self.collection.data.minsites + "</td>"))
					.append($("<tr/>").append("<td>Maximal number of sites</td><td>" + self.collection.data.maxsites + "</td>"))
					.append($("<tr/>").append("<td>Strands</td><td>" + self.collection.data.strands + "</td>"))
			));

            return this;
        },

        getData: function() {
            return {
                type: "MemeRunResult",
                id: this.options.meme_run_result_id,
                workspace: this.options.workspace_id,
                title: "MEME run parameters"
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
