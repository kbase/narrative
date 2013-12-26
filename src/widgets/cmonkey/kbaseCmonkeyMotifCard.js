(function($, undefined) {
    $.KBWidget({
        name: "KBaseCmonkeyMotifCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            title: "cMonkey Motif",
            isInCard: false,
            width: 600,
            height: 800
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
					    	.append("<td>Motif evalue</td><td>" + self.motif.evalue + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Sequence type</td><td>" + self.motif.seq_type + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Motif width</td><td>" + self.motif.pssm_rows.length + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Number of sites</td><td>" + self.motif.sites.length + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Number of hits</td><td>" + self.motif.hits.length + "</td>"))
			));

            //Logo 

            var sitesList = [];
            for (var site in self.motif.sites) {
                sitesList.push(self.motif.sites[site].sequence);
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

            for (var site in self.motif.sites) {
                $sitesTable += "<tr><td>" + self.motif.sites[site].source_sequence_id + "</td><td>" + self.motif.sites[site].start + "</td><td>" + self.motif.sites[site].sequence + "</td></tr>";
            }

            $sitesTable += "</table>";
            self.$elem.append($("<div />").append($sitesTable));

            //Hits
            self.$elem.append($("<div />")
                    .append("<h3>Motif hits</h3>"));

            var $hitsTable = '<table id="hits-table' + self.motif.id + '" class="kbgo-table">';
            $hitsTable += "<tr><td>Sequence ID</td><td>Start</td><td>End</td><td>Strand</td><td>P-value</td></tr>";

            for (var hit in self.motif.hits) {
                $hitsTable += "<tr><td>" + self.motif.hits[hit].sequence_id + "</td><td>" + self.motif.hits[hit].hit_start + "</td><td>" + self.motif.hits[hit].hit_end + "</td><td>" + self.motif.hits[hit].strand + "</td><td>" + self.motif.hits[hit].hit_pvalue + "</td></tr>";
            }

            $hitsTable += "</table>";
            self.$elem.append($("<div />").append($hitsTable));

            //PSSM
            self.$elem.append($("<div />")
                    .append("<h3>Matrix</h3>"));

            var $pssmTable = '<table id="pssm-table' + self.motif.id + '" class="kbgo-table">';
            $pssmTable += "<tr><td>A</td><td>C</td><td>G</td><td>T</td></tr>";

            for (var row in self.motif.pssm_rows) {
                $pssmTable += "<tr><td>" + self.motif.pssm_rows[row][0] + "</td><td>" + self.motif.pssm_rows[row][1] + "</td><td>" + self.motif.pssm_rows[row][2] + "</td><td>" + self.motif.pssm_rows[row][3] + "</td></tr>";
            }

            $pssmTable += "</table>";
            self.$elem.append($("<div />").append($pssmTable));


            return this;
        },
        getData: function() {
            return {
                type: "CmonkeyMotif",
                id: this.options.motif.id,
                workspace: this.options.workspace_id,
                title: "cMonkey Motif"
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


