(function($, undefined) {
    $.KBWidget({
        name: "KBaseRegulonCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            title: "Regulon",
            isInCard: false,
            width: 600,
            height: 600
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

            self.$elem.append($("<div />").append($("<h4 />").append("Regulon Info")));

            self.$elem.append($("<div />").
                    append($("<table/>").addClass("invtable")
                            .append($("<tr/>")
                                    .append($("<td/>").append("Regulon ID"))
                                    .append($("<td/>").addClass("invtable-boldcell").append(self.regulon.regulon_id)))
                            .append($("<tr/>")
                                    .append($("<td/>").append("Regulation type"))
                                    .append($("<td/>").addClass("invtable-boldcell").append(self.regulon.regulator.regulation_type)))
                            .append($("<tr/>")
                                    .append($("<td/>").append("Regulator name"))
                                    .append($("<td/>").addClass("invtable-boldcell").append(self.regulon.regulator.regulator_name)))
                            .append($("<tr/>")
                                    .append($("<td/>").append("Regulator ID"))
                                    .append($("<td/>").addClass("invtable-emcell").append(self.regulon.regulator.regulator_id)))
                            .append($("<tr/>")
                                    .append($("<td/>").append("Taxonomy"))
                                    .append($("<td/>").addClass("invtable-emcell").append(self.regulon.regulator.taxonomy)))
                            .append($("<tr/>")
                                    .append($("<td/>").append("TF family"))
                                    .append($("<td/>").addClass("invtable-emcell").append(self.regulon.regulator.tf_family)))
                            .append($("<tr/>")
                                    .append($("<td/>").append("RFAM ID"))
                                    .append($("<td/>").addClass("invtable-emcell").append(self.regulon.regulator.rfam_id)))
                            ));



            //Logo 
            if (self.regulon.regulator.regulation_type === "TF") {
                var sitesList = [];
                var multibox = false;
                var reg = /[^A-Za-z]/;
                for (var operon in self.regulon.operons) {
                    for (var site in self.regulon.operons[operon].sites) {
                        if (reg.test(self.regulon.operons[operon].sites[site].sequence)) {
                            multibox = true;
                            break;
                        } else {
                            sitesList.push(self.regulon.operons[operon].sites[site].sequence);
                        }
                        ;
                    }
                }
                ;

                if (multibox) {
                    self.$elem.append("<div id='motif-logo'>Logo not available for multi-box motifs</div>");
                } else {
                    self.$elem.append($("<div />")
                            .attr("id", "motif-logo"))
                            .append(Logo(150, 300, sitesList));
                }
                ;
            }
            ;


            //TFs
            self.$elem.append($("<div />")
                    .append("<h4>Transcription factors</h4>"));

            var $tfList = "";
            for (var tf in self.regulon.tfs) {
                $tfList += '<a class="flink">'+self.regulon.tfs[tf].transcription_factor_id +'</a> (';
                if (typeof self.regulon.tfs[tf].name !== 'undefined'){
                    $tfList += self.regulon.tfs[tf].name + ", ";
                };
                if (typeof self.regulon.tfs[tf].locus_tag !== 'undefined'){
                    $tfList += self.regulon.tfs[tf].locus_tag;
                };
                $tfList += ")<br />";
            }
            self.$elem.append($("<div />").append($tfList));

            //Effectors
            self.$elem.append($("<div />")
                    .append("<h4>Effectors</h4>"));

//            var $effectorsTable = '<table id="effectors-table' + self.regulon.regulon_id + '" class="kbgo-table">';
            //$effectorsTable += "<tr><td>Effector ID</td><td>Name</td><td>Class</td></tr>";

//            for (var effector in self.regulon.effectors) {
//                $effectorsTable += "<tr><td>" + self.regulon.effectors[effector].effector_id + "</td><td>" + self.regulon.effectors[effector].effector_name + "</td><td>" + self.regulon.effectors[effector].effector_class + "</td></tr>";
//            }

//            $effectorsTable += "</table>";
//            self.$elem.append($("<div />").append($effectorsTable));

            this.effectors_table = $('<table width="100%" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">');
            self.$elem.append($("<div />").append(this.effectors_table));

	    this.effectors_table.dataTable({
		iDisplayLength: 10,
                bFilter: false,
		aoColumns: [
                    { sTitle: "Effector ID" },      
                    { sTitle: "Name" },
                    { sTitle: "Class" },
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
            
            var effectorTableData = [];
            for (var effector in self.regulon.effectors) {
               effectorTableData.push([self.regulon.effectors[effector].effector_id,
                                       self.regulon.effectors[effector].effector_name,
                                       self.regulon.effectors[effector].effector_class]);
            };
            
            this.effectors_table.fnAddData(effectorTableData);
            this.effectors_table.fnAdjustColumnSizing();


            //Operons
            self.$elem.append($("<div />")
                    .append("<h4>Operons</h4>"));

            this.operons_table = $('<table width="100%" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">');
            self.$elem.append($("<div />").append(this.operons_table));


	    this.operons_table.dataTable({
		iDisplayLength: 10,
                bFilter: false,
		aoColumns: [
                    { sTitle: "Operon ID" },      
                    { sTitle: "Gene ID" },
                    { sTitle: "Gene Name" },
                    { sTitle: "Locus tag" },
		],
		bSaveState : true,
		fnStateSave: function (oSettings, oData) {
		    self.tableData = JSON.stringify(oData);
		},
		fnStateLoad: function (oSettings) {
		    return JSON.parse( self.tableData );
		},
		fnDrawCallback: function() {
		    $('a.flink').unbind('click').bind('click',function(e) {
			self.trigger("showFeature", {featureID : this.innerHTML,
						     event : e });
		    });

		}
	    });
            
            var operonsTableData = [];
            for (var operon in self.regulon.operons) {
                for (var gene in self.regulon.operons[operon].genes) {
                    if (typeof self.regulon.operons[operon].genes[gene].name === 'undefined'){
                        self.regulon.operons[operon].genes[gene].name = "";
                    };
                    if (typeof self.regulon.operons[operon].genes[gene].locus_tag === 'undefined'){
                        self.regulon.operons[operon].genes[gene].locus_tag = "";
                    };
                    operonsTableData.push([self.regulon.operons[operon].operon_id,
                                        '<a class="flink">'+self.regulon.operons[operon].genes[gene].gene_id+'</a>',
                                        self.regulon.operons[operon].genes[gene].name,
                                        self.regulon.operons[operon].genes[gene].locus_tag]);
                };
            };
            
            this.operons_table.fnAddData(operonsTableData);
            this.operons_table.fnAdjustColumnSizing();


            //Sites
            self.$elem.append($("<div />")
                    .append("<h4>Sites</h4>"));


            this.sites_table = $('<table width="100%" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">');
            self.$elem.append($("<div />").append(this.sites_table));


	    this.sites_table.dataTable({
		iDisplayLength: 10,
                bFilter: false,
		aoColumns: [
                    { sTitle: "Operon ID" },      
                    { sTitle: "Position" },
                    { sTitle: "Score" },
                    { sTitle: "Sequence" },
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
            
            var sitesTableData = [];
            for (var operon in self.regulon.operons) {
                for (var site in self.regulon.operons[operon].sites) {
                    sitesTableData.push([self.regulon.operons[operon].operon_id,
                                       self.regulon.operons[operon].sites[site].position,
                                       self.regulon.operons[operon].sites[site].score.toFixed(4),
                                       self.regulon.operons[operon].sites[site].sequence]);
                };
            };
            
            this.sites_table.fnAddData(sitesTableData);
            this.sites_table.fnAdjustColumnSizing();




//            self.$elem.append($("<div />")
//                    .append("<h4>List of operons</h4>"));
//
//            var $operonsTable = '<table id="operons-table' + self.regulon.regulon_id + '" class="kbgo-table">';
//            $operonsTable += '<tr><td rowspan = "2">Operon ID</td><td colspan = "3">Genes</td><td colspan = "4">Sites</td></tr>';
//            $operonsTable += '<tr><td>Gene ID</td><td>Gene name</td><td>Locus tag</td><td>Site ID</td><td>Position</td><td>Score</td><td>Sequence</td>';
//
//            for (var operon in self.regulon.operons) {
//
//                var $rows = (self.regulon.operons[operon].genes.length > self.regulon.operons[operon].sites.length) ? self.regulon.operons[operon].genes.length : self.regulon.operons[operon].sites.length;
//
//                $operonsTable += '</tr><tr><td rowspan = "' + $rows + '">' + self.regulon.operons[operon].operon_id + "</td>";
//
//                if ((typeof self.regulon.operons[operon].genes[0] !== 'undefined') && (typeof self.regulon.operons[operon].sites[0] !== 'undefined')) {
//                    $operonsTable += "<td>" + self.regulon.operons[operon].genes[0].gene_id + "</td><td>" + self.regulon.operons[operon].genes[0].name + "</td><td>" + self.regulon.operons[operon].genes[0].locus_tag + "</td><td>" + self.regulon.operons[operon].sites[0].regulatory_site_id + "</td><td>" + self.regulon.operons[operon].sites[0].position + "</td><td>" + self.regulon.operons[operon].sites[0].score.toFixed(4) + "</td><td>" + self.regulon.operons[operon].sites[0].sequence + "</td>";
//                }
//                else if (typeof self.regulon.operons[operon].genes[0] !== 'undefined') {
//                    $operonsTable += "<td>" + self.regulon.operons[operon].genes[0].gene_id + "</td><td>" + self.regulon.operons[operon].genes[0].name + "</td><td>" + self.regulon.operons[operon].genes[0].locus_tag + '</td><td colspan = "4"></td>';
//                }
//                else if (typeof self.regulon.operons[operon].sites[0] !== 'undefined') {
//                    $operonsTable += '<td colspan = "3"></td><td>' + self.regulon.operons[operon].sites[0].regulatory_site_id + "</td><td>" + self.regulon.operons[operon].sites[0].position + "</td><td>" + self.regulon.operons[operon].sites[0].score.toFixed(4) + "</td><td>" + self.regulon.operons[operon].sites[0].sequence + "</td>";
//                }
//
//                for (var i = 1; i < $rows; i++) {
//                    if ((typeof self.regulon.operons[operon].genes[i] !== 'undefined') && (typeof self.regulon.operons[operon].sites[i] !== 'undefined')) {
//                        $operonsTable += "</tr><tr><td>" + self.regulon.operons[operon].genes[i].gene_id + "</td><td>" + self.regulon.operons[operon].genes[i].name + "</td><td>" + self.regulon.operons[operon].genes[i].locus_tag + "</td><td>" + self.regulon.operons[operon].sites[i].regulatory_site_id + "</td><td>" + self.regulon.operons[operon].sites[i].position + "</td><td>" + self.regulon.operons[operon].sites[i].score.toFixed(4) + "</td><td>" + self.regulon.operons[operon].sites[i].sequence + "</td>";
//                    }
//                    else if (typeof self.regulon.operons[operon].genes[i] !== 'undefined') {
//                        $operonsTable += "</tr><tr><td>" + self.regulon.operons[operon].genes[i].gene_id + "</td><td>" + self.regulon.operons[operon].genes[i].name + "</td><td>" + self.regulon.operons[operon].genes[i].locus_tag + '</td><td colspan = "4"></td>';
//                    }
//                    else if (typeof self.regulon.operons[operon].sites[i] !== 'undefined') {
//                        $operonsTable += '</tr><tr><td colspan = "3"></td><td>' + self.regulon.operons[operon].sites[i].regulatory_site_id + "</td><td>" + self.regulon.operons[operon].sites[i].position + "</td><td>" + self.regulon.operons[operon].sites[i].score.toFixed(4) + "</td><td>" + self.regulon.operons[operon].sites[i].sequence + "</td>";
//                    }
//                }
//            }
//            $operonsTable += "</tr></table>";
//
//            self.$elem.append($("<div />").append($operonsTable));
//
//            self.$elem.append($("<div />")
//                    .append("<h3>&nbsp;</h3>"));

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


