(function($, undefined) {
    $.KBWidget({
        name: "KBaseCmonkeyClusterCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            title: "cMonkey Cluster",
            isInCard: false,
            width: 500,
            height: 550
       },
        init: function(options) {
            this._super(options);
            var self = this;

            if (this.options.cluster === null) {
                //throw an error
                return;
            }

            self.cluster = this.options.cluster;
            
            self.$elem.append($("<div />")
                    .append($("<h4 />").append("Cluster info")));
            
                            self.$elem.append($("<div />").
                                    append($("<table/>").addClass("invtable")
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Cluster ID"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.cluster.id)))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Number of genes"))
                                                    .append($("<td/>").addClass("invtable-emcell").append(self.cluster.gene_ids.length)))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Number of conditions"))
                                                    .append($("<td/>").addClass("invtable-emcell").append(self.cluster.sample_ws_ids.length)))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Number of motifs"))
                                                    .append($("<td/>").addClass("invtable-emcell").append(self.cluster.motifs.length)))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Residual"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.cluster.residual)))
                                            ));


            //Genes
            self.$elem.append($("<div />")
                    .append($("<h4 />").append("Genes"))
                    .append($("<button />").attr('id', 'toggle_genes').addClass("btn btn-default").append("Toggle")));
            
            $("#toggle_genes").click(function(){
                $("#gene_list").toggle();
            });
            
            var $geneList = "";
            for (var gene in self.cluster.gene_ids) {
                $geneList += self.cluster.gene_ids[gene] + ", ";
            }
            self.$elem.append($("<div id='gene_list' style='display:none'/>").append($geneList));

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
                    .append($("<h4 />").append("Conditions"))
                    .append($("<button />").attr('id', 'toggle_conditions').addClass("btn btn-default").append("Toggle")));

            $("#toggle_conditions").click(function(){
                $("#conditions-table").toggle();
            });
            
            this.conditions_table = $('<table width="100%" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">');
            self.$elem.append($("<div />").attr('id', 'conditions-table').css('display', 'none').append(this.conditions_table));

	    this.conditions_table.dataTable({
		iDisplayLength: 10,
                bFilter: false,
		aoColumns: [
                    { sTitle: "Sample name" },      
		],
		bSaveState : true,
		fnStateSave: function (oSettings, oData) {
		    self.tableData = JSON.stringify(oData);
		},
		fnStateLoad: function (oSettings) {
		    return JSON.parse( self.tableData );
		},
		fnDrawCallback: function() {
		}
	    });
            
            var conditionsTableData = [];
            for (var condition in self.cluster.sample_ws_ids) {
               conditionsTableData.push([self.cluster.sample_ws_ids[condition]]);
            };
            
            this.conditions_table.fnAddData(conditionsTableData);
            this.conditions_table.fnAdjustColumnSizing();

            //Motifs

            var $dropdown;
            if (typeof self.cluster.motifs[0] === 'undefined'){
//                $dropdown = $("<div />").append("No motifs in this cluster");
//                self.$elem.append($dropdown);
            } else {
                self.$elem.append($("<div />")
                        .append("<h4>Motifs</h4>"));

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
    });
})(jQuery);


