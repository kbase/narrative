(function($, undefined) {
    $.KBWidget({
        name: "KBaseMemeMotifCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            title: "MEME Motif",
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
                    .append("<h2>Motif " + self.motif.id + "</h2>"));

            self.$elem.append($("<div />")
                    .append($("<table/>").addClass("kbgo-table")
                            .append($("<tr/>")
                                    .append("<td>Motif description</td><td>" + self.motif.description + "</td>"))
                            .append($("<tr/>")
                                    .append("<td>Motif width</td><td>" + self.motif.width + "</td>"))
                            .append($("<tr/>")
                                    .append("<td>Number of sites</td><td>" + self.motif.sites.length + "</td>"))
                            .append($("<tr/>")
                                    .append("<td>Motif E-value</td><td>" + self.motif.evalue + "</td>"))
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
            $sitesTable += "<tr><td>Sequence ID</td><td>Start</td><td>p-value</td><td>&nbsp;</td><td>Site sequence</td><td>&nbsp;</td></tr>";

            for (var site in self.motif.sites) {
                $sitesTable += "<tr><td>" + self.motif.sites[site].source_sequence_id + "</td><td>" + self.motif.sites[site].start + "</td><td>" + self.motif.sites[site].pvalue + "</td><td>" + self.motif.sites[site].left_flank + "</td><td>" + self.motif.sites[site].sequence + "</td><td>" + self.motif.sites[site].right_flank + "</td></tr>";
            }

            $sitesTable += "</table>";
            self.$elem.append($("<div />").append($sitesTable));

            return this;
        },
        getData: function() {
            return {
                type: "MemeRunResult",
                id: this.options.meme_run_result_id,
                workspace: this.options.workspace_id,
                title: "MEME Motif"
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


