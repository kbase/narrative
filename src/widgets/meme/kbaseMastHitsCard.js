(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseMastHitsCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            title: "MAST Hits",
            isInCard: false,
            width: 600
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
			var $hitsTable = '<table id="hits-table' + self.mastresult.data.id + '" class="kbgo-table">';
			$hitsTable += "<tr><td>PSPM ID</td><td>Sequence ID</td><td>Strand</td><td>Start</td><td>End</td><td>Score</td><td>p-value</td></tr>";

			for (var hit in self.mastresult.data.hits) {
				$hitsTable+= "<tr><td>" + self.mastresult.data.hits[hit].pspm_id + "</td><td>" + self.mastresult.data.hits[hit].sequence_id + "</td><td>" + self.mastresult.data.hits[hit].strand +
				"</td><td>" + self.mastresult.data.hits[hit].hit_start + "</td><td>" + self.mastresult.data.hits[hit].hit_end + "</td><td>" + self.mastresult.data.hits[hit].score +
				"</td><td>" + self.mastresult.data.hits[hit].hit_pvalue + "</td></tr>";
			}
			
			$hitsTable+= "</table>";
			self.$elem.append($("<div />").append($hitsTable));
			
            return this;
        },

        getData: function() {
            return {
                type: "MastRunResult",
                id: this.options.mastresult.data.id,
                workspace: this.options.workspace_id,
                title: "MAST Hits"
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
