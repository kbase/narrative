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
            self.bicluster = this.options.bicluster[0];
			console.log(self.bicluster)
            self.bicluster_type = this.options.bicluster[1].bicluster_type;
            
            self.$elem.append($("<div />")
						.append($("<table/>").addClass("kbgo-table")
					    .append($("<tr/>")
					    	.append("<td>ID</td><td>" + self.bicluster.bicluster_id + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Cluster type</td><td>" + self.bicluster_type + "</td>"))
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
					    	append("<td>TF criterion value</td><td>" + self.bicluster.TF_crit + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Orthology criterion value</td><td>" + self.bicluster.ortho_crit + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Full criterion value</td><td>" + self.bicluster.full_crit + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Fraction of missing data</td><td>" + self.bicluster.miss_frxn + "</td>"))
			));

			//Heatmap
			self.$elem.append($("<div />")
                    .append("<h3>Display heatmap</h3>")
					.append($("<button />").attr('id', 'toggle_heatmap').addClass("btn btn-default").append("Toggle")));

			$("#toggle_heatmap").click(function() {
                $("#heatmap").toggle();
            });

			self.$elem.append($("<div id='heatmap' style='display:none'/>"));

			var DataTable = ["DataTable", [{"bicluster_id":"kb|bicluster.4314","num_genes":173,"num_conditions":75,"condition_ids":["29","30","37","38","42","44"],"condition_labels":["In-frame deletion mutant for ORF SO3389_WT_stationary anoxic_vs._WT_aerobic mid-log","In-frame deletion mutant for ORF SO3389_WT_aerobic biofilm_vs._WT_aerobic mid-log (planktonic)","In-frame deletion mutant for ORF SO3389_Mutant_stationary anoxic (102 h)_vs._Mutant_mid-log anoxic","In-frame deletion mutant for ORF SO3389_WT_stationary anoxic_vs._WT_10 h into anoxic","Salt:NaCl_0.6_120_vs._0_120","BU0_A_BU0_A_null_vs._mean gene expression in 207 S.oneidensis experiments (M3d v4 Build 2)_null"],"gene_ids":["kb|g.371.peg.362","kb|g.371.peg.180","kb|g.371.peg.1427","kb|g.371.peg.1854","kb|g.371.peg.1241"],"gene_labels":["199208","199336","199412","199413","199414"],"exp_mean":1.2781754203886797,"score":0.9944320883479909,"miss_frxn":-1.0,"data":[[0.847005,0.729055,-1.4168,-1.52138,-1.64155,-1.16694],[0.817856,1.10411,-2.86187,-2.81284,-1.40497,-1.4577],[0.825148,0.807097,-3.23414,-6.40135,-1.5801,-2.97321],[0.856129,0.865829,-1.16332,-0.509081,-1.93448,-2.32617],[0.856129,0.865829,-1.16332,-0.509081,-1.93448,-2.32617]]}]]
			
			var datatable = DataTable[1][0]

			var dataflat = 	[]
			var datadict = []
			for (var y = 0; y < datatable.data.length; y+=1) {
				for (var x = 0; x < datatable.data[0].length; x+=1) {
					datadict.push({
						"condition": x,
						"gene": y,
						"expression": datatable.data[y][x]
					});
					dataflat.push(datatable.data[y][x])
				}
			}
					
			var genes = datatable.gene_labels,
				conditions = datatable.condition_labels;
				
			var margin = { top: 300, right: 0, bottom: 100, left: 100 },
			  width = conditions.length*100 - margin.left - margin.right,
			  height = genes.length*100 - margin.top - margin.bottom,
			  gridSize = Math.floor(width / 20),
			  legendElementWidth = gridSize*2,
			  //colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"];
			  colors = ["#ff0000","#ff9966","#ffffff","#3399ff","#0000ff"]
			
			  /*var colorScale = function(d) {
				if (d < 0) return "#ff0000";
				return "#0000ff";
			  };
			  */
			var colorScale = function(d) {
				if (d > 2) return "#ff0000";
				if (d > 0 && d <= 2) return "#ff9966"
				if (d == 0) return "#ffffff";
				if (d < 0 && d >= -2) return "#3399ff"
				if (d < -2) return "#0000ff";
			};

			var svg = d3.select("#heatmap").append("svg")
				  .attr("width", width + margin.left + margin.right)
				  .attr("height", height + margin.top + margin.bottom)
				  .append("g")
				  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			var geneLabels = svg.selectAll(".geneLabel")
				  .data(genes)
				  .enter().append("text")
					.text(function (d) { return d; })
					.attr("x", 0)
					.attr("y", function (d, i) { return i * gridSize; })
					.style("text-anchor", "end")
					.attr("transform", "translate(-6," + gridSize / 1.5 + ")")
					//.attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "geneLabel mono axis axis-workweek" : "geneLabel mono axis"); });

			  var conditionLabels = svg.selectAll(".conditionLabel")
				  .data(conditions)
				  .enter().append("text")
					.text(function(d) { return d; })
					.attr("x", function(d, i) { return i * gridSize; })
					.attr("y", 0)
					.style("text-anchor", "start")
					.attr("transform", function(d, i) { 
						return "scale(0.6)translate(" + (i)*gridSize/1.5 + "," + -gridSize/2 +")" +
						"rotate(-45 "+ ((i + 0.5) * gridSize) + " " + (-6) +")";
					} )
					.attr("class", "conditionLabel mono axis axis-condition-up")
					//.attr("class", function(d,i) { return ((i >= 0 && i <= 8) ? "conditionLabel mono axis axis-worktime" : "conditionLabel mono axis"); });
			
			  var heatMap = svg.selectAll(".gene")
				  .data(datadict)
				  .enter().append("rect")
				  .attr("y", function(d) { return (d.gene) * gridSize; })
				  .attr("x", function(d) { return (d.condition) * gridSize; })
				  .attr("rx", 4)
				  .attr("ry", 4)
				  .attr("class", "gene bordered")
				  .attr("width", gridSize)
				  .attr("height", gridSize)
				  .style("fill", colors[2]);

			  heatMap.transition().duration(1000)
				  .style("fill", function(d) { return colorScale(d.expression); });

			  heatMap.append("title").text(function(d) { return d.expression; });
			  
			  var legend = svg.selectAll(".legend")
				  .data(["-Inf",-2,0,2,"Inf"], function(d) { return d; })
				  .enter().append("g")
				  .attr("class", "legend");

			  legend.append("rect")
				.attr("x", function(d, i) { return legendElementWidth * i; })
				.attr("y", height+gridSize)
				.attr("width", legendElementWidth)
				.attr("height", gridSize / 2)
				.style("fill", function(d, i) { return colors[i]; });

			  legend.append("text")
				//.mouseover(function(d) {d.c
				.attr("class", "mono")
				.text(function(d) { return d; })
				.attr("x", function(d, i) { return legendElementWidth * i; })
				.attr("y", height + gridSize*2)
				.attr("transform",function(d, i) { return "scale(0.5,0.8)translate(" + (i)*legendElementWidth+","+35+")" })
			
			//d3.select("#heatmap").append(svg)
			
            //Genes
            self.$elem.append($("<div />")
                    .append("<h3>List of genes</h3>")
					.append($("<button />").attr('id', 'toggle_genes').addClass("btn btn-default").append("Toggle")));

			$("#toggle_genes").click(function() {
                $("#gene_list").toggle();
            });

            var $genesTable = '<table id="genes-table' + self.bicluster.id + '" class="kbgo-table">';
            $genesTable += "<tr><th>Gene ID</th><th>Gene label</th></tr>";

            for (var i = 0; i < self.bicluster.num_genes; i++) {
                $genesTable += "<tr><td>" + self.bicluster.gene_ids[i] + "</td><td>" + self.bicluster.gene_labels[i] + "</td></tr>";
            }

            $genesTable += "</table>";
			
            self.$elem.append($("<div id='gene_list' style='display:none'/>").append($genesTable));
			
            //Conditions
            self.$elem.append($("<div />")
                    .append("<h3>List of conditions</h3>")
					.append($("<button />").attr('id', 'toggle_conditions').addClass("btn btn-default").append("Toggle")));
			
			$("#toggle_conditions").click(function() {
                $("#condition_list").toggle();
            });
			
            var $conditionsTable = '<table id="conditions-table' + self.bicluster.id + '" class="kbgo-table">';
            $conditionsTable += "<tr><th>Condition ID</th><th>Condition label</th></tr>";

            for (var i = 0; i < self.bicluster.num_conditions; i++) {
                $conditionsTable += "<tr><td>" + self.bicluster.condition_ids[i] + "</td><td>" + self.bicluster.condition_labels[i] + "</td></tr>";
            }

            $conditionsTable += "</table>";

            self.$elem.append($("<div id='condition_list' style='display:none'/>").append($conditionsTable));
            
            //Enriched terms
            self.$elem.append($("<div />")
                    .append("<h3>List of enriched terms</h3>")
					.append($("<button />").attr('id', 'toggle_terms').addClass("btn btn-default").append("Toggle")));
					
			$("#toggle_terms").click(function() {
                $("#term_list").toggle();
            });
			
            var $termsTable = '<table id="terms-table' + self.bicluster.id + '" class="kbgo-table">';
            $termsTable += "<tr><th>Key</th><th>Value</th></tr>";

            for (var enrichedTerm in self.bicluster.enriched_terms) {
                $termsTable += "<tr><td>" + enrichedTerm.key + "</td><td>" + enrichedTerm.value + "</td></tr>";
            }

            $termsTable += "</table>";
			
            self.$elem.append($("<div id='term_list' style='display:none'/>").append($termsTable));

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


