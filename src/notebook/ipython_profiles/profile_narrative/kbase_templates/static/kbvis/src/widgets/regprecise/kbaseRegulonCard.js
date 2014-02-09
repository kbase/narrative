(function($, undefined) {
    $.KBWidget({
        name: "KBaseRegulonCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            title: "Regulon",
            isInCard: false,
            width: "auto",
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
            self.regulon = this.options.regulon;
            
            self.$elem.append($("<div />")
                    .append("<h3>Regulon Info</h3>"));
            
            self.$elem.append($("<div />")
						.append($("<table/>").addClass("kbgo-table")
					    .append($("<tr/>")
					    	.append("<td>Regulon ID</td><td>" + self.regulon.regulon_id + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Regulator name</td><td>" + self.regulon.regulator.regulator_name + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Regulator ID</td><td>" + self.regulon.regulator.regulator_id + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Regulation type</td><td>" + self.regulon.regulator.regulation_type + "</td>"))
					    .append($("<tr/>").
					    	append("<td>Taxonomy</td><td>" + self.regulon.regulator.taxonomy + "</td>"))
					    .append($("<tr/>").
					    	append("<td>TF family</td><td>" + self.regulon.regulator.tf_family + "</td>"))
					    .append($("<tr/>").
					    	append("<td>RFAM ID</td><td>" + self.regulon.regulator.rfam_id + "</td>"))
			));

            //Logo 
            if (self.regulon.regulator.regulation_type === "TF"){
                var sitesList = [];
                for (var operon in self.regulon.operons) {
                    for (var site in self.regulon.operons[operon].sites) {
                        sitesList.push(self.regulon.operons[operon].sites[site].sequence);
                    }
                };
                
                self.$elem.append($("<div />")
                        .attr("id", "motif-logo"))
                        .append(Logo(150, 300, sitesList));
            };


            //TFs
            self.$elem.append($("<div />")
                    .append("<h3>Transcription factors</h3>"));
            
            var $tfList = "";
            for (var tf in self.regulon.tfs) {
                $tfList += self.regulon.tfs[tf].locus_tag + " (name : " + self.regulon.tfs[tf].name + "; ID : "+ self.regulon.tfs[tf].transcription_factor_id + ")<br>";
            }
            self.$elem.append($("<div />").append($tfList));

            //Effectors
            self.$elem.append($("<div />")
                    .append("<h3>List of effectors</h3>"));

            var $effectorsTable = '<table id="effectors-table' + self.regulon.regulon_id + '" class="kbgo-table">';
            $effectorsTable += "<tr><td>Effector ID</td><td>Name</td><td>Class</td></tr>";

            for (var effector in self.regulon.effectors) {
                $effectorsTable += "<tr><td>" + self.regulon.effectors[effector].effector_id + "</td><td>" + self.regulon.effectors[effector].effector_name + "</td><td>" + self.regulon.effectors[effector].effector_class + "</td></tr>";
            }

            $effectorsTable += "</table>";
            self.$elem.append($("<div />").append($effectorsTable));
            
            //Operons
                self.$elem.append($("<div />")
                        .append("<h3>List of operons</h3>"));

            var $operonsTable = '<table id="operons-table' + self.regulon.regulon_id + '" class="kbgo-table">';
            $operonsTable += '<tr><td rowspan = "2">Operon ID</td><td colspan = "3">Genes</td><td colspan = "4">Sites</td></tr>';
            $operonsTable += '<tr><td>Gene ID</td><td>Gene name</td><td>Locus tag</td><td>Site ID</td><td>Position</td><td>Score</td><td>Sequence</td>';

            for (var operon in self.regulon.operons) {
                
                var $rows = (self.regulon.operons[operon].genes.length > self.regulon.operons[operon].sites.length)? self.regulon.operons[operon].genes.length : self.regulon.operons[operon].sites.length;

                $operonsTable += '</tr><tr><td rowspan = "' + $rows + '">' + self.regulon.operons[operon].operon_id + "</td>";

                if ((typeof self.regulon.operons[operon].genes[0] !== 'undefined') && (typeof self.regulon.operons[operon].sites[0] !== 'undefined')){
                    $operonsTable += "<td>" + self.regulon.operons[operon].genes[0].gene_id + "</td><td>" + self.regulon.operons[operon].genes[0].name + "</td><td>" + self.regulon.operons[operon].genes[0].locus_tag + "</td><td>" + self.regulon.operons[operon].sites[0].regulatory_site_id + "</td><td>" + self.regulon.operons[operon].sites[0].position + "</td><td>" + self.regulon.operons[operon].sites[0].score.toFixed(4) + "</td><td>" + self.regulon.operons[operon].sites[0].sequence + "</td>";
                }
                else if (typeof self.regulon.operons[operon].genes[0] !== 'undefined'){
                    $operonsTable += "<td>"+ self.regulon.operons[operon].genes[0].gene_id + "</td><td>" + self.regulon.operons[operon].genes[0].name + "</td><td>" + self.regulon.operons[operon].genes[0].locus_tag + '</td><td colspan = "4"></td>';
                }
                else if (typeof self.regulon.operons[operon].sites[0] !== 'undefined') {
                    $operonsTable += '<td colspan = "3"></td><td>' + self.regulon.operons[operon].sites[0].regulatory_site_id + "</td><td>" + self.regulon.operons[operon].sites[0].position + "</td><td>" + self.regulon.operons[operon].sites[0].score.toFixed(4) + "</td><td>" + self.regulon.operons[operon].sites[0].sequence + "</td>";
                }
                
                for (var i = 1; i < $rows ; i ++) {
                    if ((typeof self.regulon.operons[operon].genes[i] !== 'undefined') && (typeof self.regulon.operons[operon].sites[i] !== 'undefined')){
                        $operonsTable += "</tr><tr><td>"+ self.regulon.operons[operon].genes[i].gene_id + "</td><td>" + self.regulon.operons[operon].genes[i].name + "</td><td>" + self.regulon.operons[operon].genes[i].locus_tag + "</td><td>" + self.regulon.operons[operon].sites[i].regulatory_site_id + "</td><td>" + self.regulon.operons[operon].sites[i].position + "</td><td>" + self.regulon.operons[operon].sites[i].score.toFixed(4) + "</td><td>" + self.regulon.operons[operon].sites[i].sequence + "</td>";
                    }
                    else if (typeof self.regulon.operons[operon].genes[i] !== 'undefined'){
                        $operonsTable += "</tr><tr><td>"+ self.regulon.operons[operon].genes[i].gene_id + "</td><td>" + self.regulon.operons[operon].genes[i].name + "</td><td>" + self.regulon.operons[operon].genes[i].locus_tag + '</td><td colspan = "4"></td>';
                    }
                    else if (typeof self.regulon.operons[operon].sites[i] !== 'undefined') {
                        $operonsTable += '</tr><tr><td colspan = "3"></td><td>' + self.regulon.operons[operon].sites[i].regulatory_site_id + "</td><td>" + self.regulon.operons[operon].sites[i].position + "</td><td>" + self.regulon.operons[operon].sites[i].score.toFixed(4) + "</td><td>" + self.regulon.operons[operon].sites[i].sequence + "</td>";
                    }
                }
            }
                $operonsTable += "</tr></table>";

            self.$elem.append($("<div />").append($operonsTable));

            self.$elem.append($("<div />")
                    .append("<h3>&nbsp;</h3>"));

            return this;
        },
        getData: function() {
            return {
                type: "Regulon",
                id: this.options.regulon.regulon_id,
                workspace: this.options.workspace_id,
                title: "Regulon"
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


