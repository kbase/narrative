(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseMastRunParametersCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            title: "MAST run parameters",
            isInCard: false,
            width: 400
        },

        init: function(options) {
            this._super(options);
            if (this.options.mastresult === null) {
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
            self.mastresult = this.options.mastresult;
            
			self.$elem.append($("<div />")
					.append($("<table/>").addClass("kbgo-table")
                                        .append($("<tr/>").append("<td>Query reference</td><td>" + self.mastresult.data.params.query_ref + "</td>"))
                                        .append($("<tr/>").append("<td>Target reference</td><td>" + self.mastresult.data.params.target_ref + "</td>"))
                                        .append($("<tr/>").append("<td>PSPM id</td><td>" + self.mastresult.data.params.pspm_id + "</td>"))
                                        .append($("<tr/>").append("<td>Threshold</td><td>" + self.mastresult.data.params.mt.toString() + "</td>"))
			));

            return this;
        },

        getData: function() {
            return {
                type: "MastRunResult",
                id: this.options.mastresult.data.id,
                workspace: this.options.ws,
                title: "MAST run parameters"
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
