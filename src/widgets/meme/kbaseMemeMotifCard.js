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
            var self = this;

            if (this.options.motif === null) {
                //throw an error
                return;
            }

            self.motif = this.options.motif;
                                self.$elem.append($("<div />")
                    .append($("<h4 />").append("Motif info")));
            
                                        self.$elem.append($("<div />").
                                    append($("<table/>").addClass("invtable")
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Motif description"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.motif.description)))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Motif width"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.motif.width)))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Number of sites"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.motif.sites.length)))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Motif E-value"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.motif.evalue)))
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
                    .append($("<h4 />").append("Sites")));

            this.sitesTable = $('<table width="100%" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">');
            self.$elem.append($("<div />").attr('id', 'sites-table').append(this.sitesTable));

	    this.sitesTable.dataTable({
		iDisplayLength: 10,
                bFilter: false,
		aoColumns: [
                    { sTitle: "Sequence ID" },      
                    { sTitle: "Start" },      
                    { sTitle: "p-value" },      
                    { sTitle: "" },      
                    { sTitle: "Sequence" },      
                    { sTitle: "" },      
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
            for (var site in self.motif.sites) {
               sitesTableData.push([self.motif.sites[site].source_sequence_id,
                                    self.motif.sites[site].start,
                                    self.motif.sites[site].pvalue,
                                    self.motif.sites[site].left_flank,
                                    "<strong>"+self.motif.sites[site].sequence+"</strong>",
                                    self.motif.sites[site].right_flank]);
            };
            
            this.sitesTable.fnAddData(sitesTableData);
            this.sitesTable.fnAdjustColumnSizing();

            return this;
        },
        getData: function() {
            return {
                type: "MemeMotif",
                id: this.options.motif.id,
                workspace: this.options.workspace_id,
                title: "MEME Motif"
            };
        }
    });
})(jQuery);


