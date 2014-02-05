(function($, undefined) {
    $.KBWidget({
        name: "KBaseCmonkeyClusterCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            title: "cMonkey Cluster",
            isInCard: false,
            width: 600,
            height: 700
       },
        init: function(options) {
            this._super(options);
            if (this.options.cluster === null) {
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
            self.cluster = this.options.cluster;
            
            
            self.$elem.append($("<div />")
						.append($("<table/>").addClass("kbgo-table")
					    .append($("<tr/>")
					    	.append("<td>Cluster id</td><td>" + self.cluster.id + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Cluster residual</td><td>" + self.cluster.residual + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Number of genes</td><td>" + self.cluster.gene_ids.length + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Number of conditions</td><td>" + self.cluster.sample_ws_ids.length + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Number of motifs</td><td>" + self.cluster.motifs.length + "</td>"))
			));

            //Genes
            self.$elem.append($("<div />")
                    .append("<h3>List of genes</h3>"));
            
            var $geneList = "";
            for (var gene in self.cluster.gene_ids) {
                $geneList += self.cluster.gene_ids[gene] + ", ";
            }
            self.$elem.append($("<div />").append($geneList));

/*
            var $genesTable = '<table id="genes-table' + self.cluster.id + '" class="kbgo-table">';
            $genesTable += "<tr><td>Gene ID</td></tr>";

            for (var gene in self.cluster.gene_ids) {
                $genesTable += "<tr><td>" + self.cluster.gene_ids[gene] + "</td></tr>";
            }

            $genesTable += "</table>";
            self.$elem.append($("<div />").append($genesTable));
*/
            //Conditions
            self.$elem.append($("<div />")
                    .append("<h3>List of conditions</h3>"));

            var $conditionsTable = '<table id="conditions-table' + self.cluster.id + '" class="kbgo-table">';
            $conditionsTable += "<tr><td>Condition</td></tr>";

            for (var condition in self.cluster.sample_ws_ids) {
                $conditionsTable += "<tr><td>" + self.cluster.sample_ws_ids[condition] + "</td></tr>";
            }

            $conditionsTable += "</table>";
            self.$elem.append($("<div />").append($conditionsTable));
            
            //Motifs

                self.$elem.append($("<div />")
                        .append("<h3>List of motifs</h3>"));

            var $dropdown;
            if (typeof self.cluster.motifs[0] === 'undefined'){
                $dropdown = $("<div />").append("No motifs in this cluster");
                self.$elem.append($dropdown);
            } else {
                $dropdown = $("<select />");
                for (var motif in self.cluster.motifs) {
                       $dropdown.append("<option id='" + motif + "'> id = "+self.cluster.motifs[motif].id+"; width = " + self.cluster.motifs[motif].pssm_rows.length + "; evalue = " + self.cluster.motifs[motif].evalue + " </option>");
                }
                self.$elem.append($dropdown);
                    self.$elem.append($("<button class='btn btn-default'>Show Motif</button>")
                        .on("click", 
                            function(event) {
                                $(self.$elem.selector + " > select option:selected").each(function() {
    //                              console.log(event);
                                    self.trigger("showCmonkeyMotif", { motif: self.cluster.motifs[$(this).attr("id")], event: event });
                                });
                            })
                        );
            };

            return this;
        },
        getData: function() {
            return {
                type: "CmonkeyCluster",
                id: this.options.cluster.id,
                workspace: this.options.workspace_id,
                title: "cMonkey cluster"
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


