(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseTomtomHitsCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            title: "TOMTOM Hits",
            isInCard: false,
            width: 1000
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
			var $hitsTable = '<table id="hits-table' + self.tomtomresult.data.id + '" class="kbgo-table">';
			$hitsTable += "<tr><td>Query ID</td><td>Target ID</td><td>Offset</td><td>p-value</td><td>q-value</td><td>E-value</td><td>Strand</td><td>Query consensus</td><td>Target consensus</td></tr>";

			for (var hit in self.tomtomresult.data.hits) {
				$hitsTable+= "<tr><td>" + self.tomtomresult.data.hits[hit].query_pspm_id + "</td><td>" + self.tomtomresult.data.hits[hit].target_pspm_id + "</td><td>" + self.tomtomresult.data.hits[hit].optimal_offset +
				"</td><td>" + self.tomtomresult.data.hits[hit].pvalue + "</td><td>" + self.tomtomresult.data.hits[hit].qvalue + "</td><td>" + self.tomtomresult.data.hits[hit].evalue +
				"</td><td>" + self.tomtomresult.data.hits[hit].strand + "</td><td>" + self.tomtomresult.data.hits[hit].query_consensus + "</td><td>" + self.tomtomresult.data.hits[hit].target_consensus +"</td></tr>";
			}
			
			$hitsTable+= "</table>";
			self.$elem.append($("<div />").append($hitsTable));
			
            return this;
        },

        getData: function() {
            return {
                type: "TomtomRunResult",
                id: this.options.tomtomresult.data.id,
                workspace: this.options.workspace_id,
                title: "TOMTOM Hits"
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
