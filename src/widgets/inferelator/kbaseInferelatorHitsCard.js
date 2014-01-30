(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseInferelatorHitsCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            title: "Inferelator Hits",
            isInCard: false,
            height: 600,
            width: 720
        },

        init: function(options) {
            this._super(options);
            var self = this;

            if (this.options.inferelatorrunresult === null) {
                //throw an error
                return;
            }

            self.inferelatorrunresult = this.options.inferelatorrunresult;

            this.hits_table = $('<table width="100%" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">');
            self.$elem.append($("<div />").attr('id', 'hits-table').append(this.hits_table));

	    this.hits_table.dataTable({
		iDisplayLength: 10,
		aoColumns: [
                    { sTitle: "Bi-cluster ID" },      
                    { sTitle: "Regulator ID" },      
                    { sTitle: "Coeff." },      
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
            for (var hit in self.inferelatorrunresult.data.hits) {
               hitsTableData.push([self.inferelatorrunresult.data.hits[hit].bicluster_id,
                                    self.inferelatorrunresult.data.hits[hit].tf_id,
                                    self.inferelatorrunresult.data.hits[hit].coeff]);
            };
            
            this.hits_table.fnAddData(hitsTableData);
            this.hits_table.fnAdjustColumnSizing();


            return this;
        },

        getData: function() {
            return {
                type: "InferelatorRunResult",
                id: this.options.inferelatorrunresult.data.id,
                workspace: this.options.workspace_id,
                title: "Inferelator Hits"
            };
        },

    });
})( jQuery );
