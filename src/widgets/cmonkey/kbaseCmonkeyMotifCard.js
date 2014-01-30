(function($, undefined) {
    $.KBWidget({
        name: "KBaseCmonkeyMotifCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            title: "cMonkey Motif",
            isInCard: false,
            width: 600,
            height: 600
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
                                                    .append($("<td/>").append("Motif evalue"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.motif.evalue)))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Sequence type"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.motif.seq_type)))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Motif width"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.motif.pssm_rows.length)))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Number of sites"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.motif.sites.length)))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Number of hits"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.motif.hits.length)))
                                            ));


            //Logo 

            var sitesList = [];
            for (var site in self.motif.sites) {
                sitesList.push(self.motif.sites[site].sequence);
            };

            self.$elem.append($("<div />")
                    .attr("id", "motif-logo"))
                    .append(Logo(150, 300, sitesList));

            //Sites
            self.$elem.append($("<div />")
                    .append($("<h4 />").append("Sites"))
                    .append($("<button />").attr('id', 'toggle_sites').addClass("btn btn-default").append("Toggle")));

            $("#toggle_sites").click(function(){
                $("#sites-table").toggle();
            });
            
            this.sitesTable = $('<table width="100%" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">');
            self.$elem.append($("<div />").attr('id', 'sites-table').append(this.sitesTable));

	    this.sitesTable.dataTable({
		iDisplayLength: 10,
                bFilter: false,
		aoColumns: [
                    { sTitle: "Gene ID" },      
                    { sTitle: "Start" },      
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
            for (var site in self.motif.sites) {
               sitesTableData.push([self.motif.sites[site].source_sequence_id,
                                    self.motif.sites[site].start,
                                    self.motif.sites[site].sequence]);
            };
            
            this.sitesTable.fnAddData(sitesTableData);
            this.sitesTable.fnAdjustColumnSizing();

            //Hits
            self.$elem.append($("<div />")
                    .append($("<h4 />").append("Hits"))
                    .append($("<button />").attr('id', 'toggle_hits').addClass("btn btn-default").append("Toggle")));

            $("#toggle_hits").click(function(){
                $("#hits-table").toggle();
            });
            
            this.hitsTable = $('<table width="100%" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">');
            self.$elem.append($("<div />").attr('id', 'hits-table').css('display', 'none').append(this.hitsTable));

	    this.hitsTable.dataTable({
		iDisplayLength: 10,
                bFilter: false,
		aoColumns: [
                    { sTitle: "Gene ID" },      
                    { sTitle: "Start" },      
                    { sTitle: "End" },      
                    { sTitle: "Strand" },      
                    { sTitle: "p-value" },      
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
            
            var hitsTableData = [];
            for (var hit in self.motif.hits) {
               hitsTableData.push([self.motif.hits[hit].seq_id,
                                    self.motif.hits[hit].hit_start,
                                    self.motif.hits[hit].hit_end,
                                    self.motif.hits[hit].strand,
                                    self.motif.hits[hit].hit_pvalue]);
            };
            
            this.hitsTable.fnAddData(hitsTableData);
            this.hitsTable.fnAdjustColumnSizing();

            //PSSM

            self.$elem.append($("<div />")
                    .append($("<h4 />").append("Matrix"))
                    .append($("<button />").attr('id', 'toggle_pssm').addClass("btn btn-default").append("Toggle")));

            $("#toggle_pssm").click(function(){
                $("#pssm-table").toggle();
            });
            
            this.pssmTable = $('<table width="100%" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">');
            self.$elem.append($("<div />").attr('id', 'pssm-table').css('display', 'none').append(this.pssmTable));

	    this.pssmTable.dataTable({
		iDisplayLength: 10,
                bFilter: false,
		aoColumns: [
                    { sTitle: "A" },      
                    { sTitle: "C" },      
                    { sTitle: "G" },      
                    { sTitle: "T" },      
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
            
            var pssmTableData = [];
            for (var row in self.motif.pssm_rows) {
               pssmTableData.push([self.motif.pssm_rows[row][0],
                                    self.motif.pssm_rows[row][1],
                                    self.motif.pssm_rows[row][2],
                                    self.motif.pssm_rows[row][3]]);
            };
            
            this.pssmTable.fnAddData(pssmTableData);
            this.pssmTable.fnAdjustColumnSizing();


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

    });
})(jQuery);


