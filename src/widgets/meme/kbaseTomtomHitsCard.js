(function($, undefined) {
    $.KBWidget({
        name: "KBaseTomtomHitsCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            title: "TOMTOM Hits",
            isInCard: false,
            width: "auto"
        },
        init: function(options) {
            this._super(options);
            var self = this;

            if (this.options.inferelatorrunresult === null) {
                //throw an error
                return;
            }

            self.tomtomresult = this.options.tomtomresult;

            this.hits_table = $('<table width="100%" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">');
            self.$elem.append($("<div />").attr('id', 'hits-table').append(this.hits_table));

            this.hits_table.dataTable({
                iDisplayLength: 10,
                aoColumns: [
                    {sTitle: "Query ID"},
                    {sTitle: "Target ID"},
                    {sTitle: "Offset"},
                    {sTitle: "p-value"},
                    {sTitle: "q-value"},
                    {sTitle: "E-value"},
                    {sTitle: "Strand"},
                    {sTitle: "Query consensus"},
                    {sTitle: "Target consensus"},
                ],
                bSaveState: true,
                fnStateSave: function(oSettings, oData) {
                    self.tableData = JSON.stringify(oData);
                },
                fnStateLoad: function(oSettings) {
                    return JSON.parse(self.tableData);
                },
                fnDrawCallback: function() {
                }
            });

            var hitsTableData = [];
            for (var hit in self.tomtomresult.data.hits) {
                hitsTableData.push([self.tomtomresult.data.hits[hit].query_pspm_id,
                    self.tomtomresult.data.hits[hit].target_pspm_id,
                    self.tomtomresult.data.hits[hit].optimal_offset,
                    self.tomtomresult.data.hits[hit].pvalue,
                    self.tomtomresult.data.hits[hit].qvalue,
                    self.tomtomresult.data.hits[hit].evalue,
                    self.tomtomresult.data.hits[hit].strand,
                    self.tomtomresult.data.hits[hit].query_consensus,
                    self.tomtomresult.data.hits[hit].target_consensus]);
            }
            ;

            this.hits_table.fnAddData(hitsTableData);
            this.hits_table.fnAdjustColumnSizing();


            return this;

        },
        getData: function() {
            return {
                type: "TomtomRunResult",
                id: this.options.tomtomresult.data.id,
                workspace: this.options.workspace_id,
                title: "TOMTOM Hits"
            };
        }

    });
})(jQuery);
