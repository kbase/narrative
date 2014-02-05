(function($, undefined) {
    $.KBWidget({
        name: "KBaseMAKBiclusterCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            title: "MAK Bicluster",
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
            self.bicluster = this.options.bicluster;
            
            
            self.$elem.append($("<div />")
						.append($("<table/>").addClass("kbgo-table")
					    .append($("<tr/>")
					    	.append("<td>ID</td><td>" + self.bicluster.bicluster_id + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Cluster type</td><td>" + self.bicluster.bicluster_type + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Number of genes</td><td>" + self.bicluster.num_genes + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Number of conditions</td><td>" + self.bicluster.num_conditions + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Expression mean</td><td>" + self.bicluster.exp_mean + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Expression mean criterion value</td><td>" + self.bicluster.exp_mean_crit + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Expression criterion value</td><td>" + self.bicluster.exp_crit + "</td>"))
					    .append($("<tr/>").
					    	append("<td>PPI criterion value</td><td>" + self.bicluster.ppi_crit + "</td>"))
					    .append($("<tr/>").
					    	append("<td>TF criterion value</td><td>" + self.bicluster.tf_crit + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Orthology criterion value</td><td>" + self.bicluster.ortho_crit + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Full criterion value</td><td>" + self.bicluster.full_crit + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Fraction of missing data</td><td>" + self.bicluster.miss_frxn + "</td>"))
			));

            //Genes
            self.$elem.append($("<div />")
                    .append("<h3>List of genes</h3>"));
            
            var $genesTable = '<table id="genes-table' + self.bicluster.id + '" class="kbgo-table">';
            $genesTable += "<tr><th>Gene ID</th><th>Gene label</th></tr>";

            for (var i = 0; i < self.bicluster.num_genes; i++) {
                $genesTable += "<tr><td>" + self.bicluster.gene_ids[i] + "</td><td>" + self.bicluster.gene_labels[i] + "</td></tr>";
            }

            $genesTable += "</table>";
            self.$elem.append($("<div />").append($genesTable));

            //Conditions
            self.$elem.append($("<div />")
                    .append("<h3>List of conditions</h3>"));

            var $conditionsTable = '<table id="conditions-table' + self.bicluster.id + '" class="kbgo-table">';
            $conditionsTable += "<tr><th>Condition ID</th><th>Condition label</th></tr>";

            for (var i = 0; i < self.bicluster.num_conditions; i++) {
                $conditionsTable += "<tr><td>" + self.bicluster.condition_ids[i] + "</td><td>" + self.bicluster.condition_labels[i] + "</td></tr>";
            }

            $conditionsTable += "</table>";
            self.$elem.append($("<div />").append($conditionsTable));
            
            //Enriched terms
            self.$elem.append($("<div />")
                    .append("<h3>List of enriched terms</h3>"));

            var $termsTable = '<table id="terms-table' + self.bicluster.id + '" class="kbgo-table">';
            $termsTable += "<tr><th>Key</th><th>Value</th></tr>";

            for (var enrichedTerm in self.bicluster.enriched_terms) {
                $termsTable += "<tr><td>" + enrichedTerm.key + "</td><td>" + enrichedTerm.value + "</td></tr>";
            }

            $termsTable += "</table>";
            self.$elem.append($("<div />").append($termsTable));

            self.$elem.append($("<div />")
                    .append("&nbsp;"));

            return this;
        },
        getData: function() {
            return {
                type: "MAKBicluster",
                id: this.options.bicluster.id,
                workspace: this.options.workspace_id,
                title: "MAK Bicluster"
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


