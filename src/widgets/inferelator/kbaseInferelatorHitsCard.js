(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseInferelatorHitsCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            title: "Inferelator Hits",
            isInCard: false,
            height: 500,
            width: 500
        },

        init: function(options) {
            this._super(options);
            if (this.options.inferelatorrunresult === null) {
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
            self.inferelatorrunresult = this.options.inferelatorrunresult;
			var $hitsTable = '<table id="hits-table' + self.inferelatorrunresult.data.id + '" class="kbgo-table">';
			$hitsTable += "<tr><td>Bi-cluster ID</td><td>Regulator ID</td><td>Coeff</td></tr>";

			for (var hit in self.inferelatorrunresult.data.hits) {
				$hitsTable+= "<tr><td>" + self.inferelatorrunresult.data.hits[hit].bicluster_id + "</td><td>" + self.inferelatorrunresult.data.hits[hit].tf_id + "</td><td>" + self.inferelatorrunresult.data.hits[hit].coeff +
				"</td></tr>";
			}
			
			$hitsTable+= "</table>";
			self.$elem.append($("<div />").append($hitsTable));
			
            return this;
        },

        getData: function() {
            return {
                type: "InferelatorRunResult",
                id: this.options.inferelatorrunresult.data.id,
                workspace: this.options.workspace_id,
                title: "Inferelator Hits"
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
