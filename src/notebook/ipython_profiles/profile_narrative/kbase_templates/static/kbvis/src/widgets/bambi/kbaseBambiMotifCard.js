(function($, undefined) {
    $.KBWidget({
        name: "KBaseBambiMotifCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            title: "BAMBI Motif",
            isInCard: false,
            width: 900
        },
        init: function(options) {
            this._super(options);
            if (this.options.motif === null) {
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
            self.motif = this.options.motif;
            self.$elem.append($("<div />")
						.append($("<table/>").addClass("kbgo-table")
					    .append($("<tr/>")
					    	.append("<td>Motif description</td><td>" + self.motif.description + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Motif width</td><td>" + self.motif.width + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Motif block width</td><td>" + self.motif.block_width + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Motif gap width</td><td>" + self.motif.gap_width + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Number of sites</td><td>" + self.motif.motif_sites.length + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Motif inf. content</td><td>" + self.motif.information_content + "</td>"))
			));

            //Logo 

            var sitesList = [];
            for (var site in self.motif.motif_sites) {
                sitesList.push(self.motif.motif_sites[site].sequence);
            }
            ;

            self.$elem.append($("<div />")
                    .attr("id", "motif-logo"))
                    .append(Logo(150, 300, sitesList));

            //Sites
            self.$elem.append($("<div />")
                    .append("<h3>List of sites</h3>"));

            var $sitesTable = '<table id="sites-table' + self.motif.id + '" class="kbgo-table">';
            $sitesTable += "<tr><td>Sequence ID</td><td>Start</td><td>Site sequence</td></tr>";

            for (var site in self.motif.motif_sites) {
                $sitesTable += "<tr><td>" + self.motif.motif_sites[site].source_sequence_id + "</td><td>" + self.motif.motif_sites[site].start + "</td><td>" + self.motif.motif_sites[site].sequence + "</td></tr>";
            }

            $sitesTable += "</table>";
            self.$elem.append($("<div />").append($sitesTable));

            return this;
        },
        getData: function() {
            return {
                type: "BambiRunResult",
                id: this.options.motif.id,
                workspace: this.options.workspace_id,
                title: "BAMBI Motif"
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
})(jQuery);


