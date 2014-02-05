(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseTomtomRunParametersCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            title: "TOMTOM run parameters",
            isInCard: false,
            width: 400
        },

        init: function(options) {
            this._super(options);
            if (this.options.tomtomresult === null) {
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
            self.tomtomresult = this.options.tomtomresult;
            
			self.$elem.append($("<div />")
					.append($("<table/>").addClass("kbgo-table")
                                        .append($("<tr/>").append("<td>Query reference</td><td>" + self.tomtomresult.data.params.query_ref + "</td>"))
                                        .append($("<tr/>").append("<td>Target reference</td><td>" + self.tomtomresult.data.params.target_ref + "</td>"))
                                        .append($("<tr/>").append("<td>Threshold</td><td>" + self.tomtomresult.data.params.thresh.toString() + "</td>"))
                                        .append($("<tr/>").append("<td>Distance scoring</td><td>" + self.tomtomresult.data.params.dist + "</td>"))
					.append($("<tr/>").append("<td>Use evalue</td><td>" + self.tomtomresult.data.params.evalue.toString() + "</td>"))
					.append($("<tr/>").append("<td>Use internal</td><td>" + self.tomtomresult.data.params.internal.toString() + "</td>"))
					.append($("<tr/>").append("<td>Minimal overlap</td><td>" + self.tomtomresult.data.params.min_overlap.toString() + "</td>"))
			));

            return this;
        },

        getData: function() {
            return {
                type: "TomtomRunResult",
                id: this.options.tomtomresult.data.id,
                workspace: this.options.workspace_id,
                title: "TOMTOM run parameters"
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
