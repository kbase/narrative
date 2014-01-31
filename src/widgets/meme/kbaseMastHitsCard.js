(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseMastHitsCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            title: "MAST Hits",
            isInCard: false,
            height: 630,
            width: 600
        },

        init: function(options) {
            this._super(options);
            var self = this;

            if (this.options.inferelatorrunresult === null) {
                //throw an error
                return;
            }

            self.mastresult = this.options.mastresult;

            this.hits_table = $('<table width="100%" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">');
            self.$elem.append($("<div />").attr('id', 'hits-table').append(this.hits_table));

	    this.hits_table.dataTable({
		iDisplayLength: 10,
		aoColumns: [
                    { sTitle: "PSPM ID" },      
                    { sTitle: "Sequence ID" },      
                    { sTitle: "Strand" },      
                    { sTitle: "Start" },      
                    { sTitle: "End" },
                    { sTitle: "Score" },      
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
            for (var hit in self.mastresult.data.hits) {
               hitsTableData.push([self.mastresult.data.hits[hit].pspm_id,
                                    self.mastresult.data.hits[hit].seq_id,
                                    self.mastresult.data.hits[hit].strand,
                                    self.mastresult.data.hits[hit].hit_start,
                                    self.mastresult.data.hits[hit].hit_end,
                                    self.mastresult.data.hits[hit].score,
                                    self.mastresult.data.hits[hit].hit_pvalue]);
            };
            
            this.hits_table.fnAddData(hitsTableData);
            this.hits_table.fnAdjustColumnSizing();

            return this;

        },

        getData: function() {
            return {
                type: "MastRunResult",
                id: this.options.mastresult.data.id,
                workspace: this.options.workspace_id,
                title: "MAST Hits"
            };
        }

    });
})( jQuery );
