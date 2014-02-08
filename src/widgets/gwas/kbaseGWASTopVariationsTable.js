(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGWASTopVariationsTable",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            width: 800,
            type:"KBaseGwasData.GwasTopVariations"
        },
        workspaceURL: "https://kbase.us/services/ws",


        init: function(options) {
            this._super(options);

            var self = this;

            this.workspaceClient = new Workspace(this.workspaceURL);

            this.workspaceClient.get_objects([{name : this.options.id, workspace: this.options.ws}], 
                function(data){
                    self.collection = data[0];
                    var config = self.collection.data.contigs;
                    var variations = self.collection.data.variations;


                    var $contTable = $("<dir/>").css('height', 'auto').css('overflow-y', 'scroll');

                    $contTable.attr('id', 'popTable');

                    var $domainTable = $("<table/>").addClass("table table-bordered table-striped");                        

                    $domainTable.append('<thead><tr><th>Chromosome Id</th><th>Position</th><th>pvalue</th></tr></thead>');

                    for (var i=0; i<variations.length; i++) {
                        $domainTable.append($("<tr>")
                            .append($("<td>").append( (config[ ((variations[i])[0]) ]).id))
                            .append($("<td>").append(variations[i][1]))
                            .append($("<td>").append(parseFloat(variations[i][3]).toExponential())));
                    }

                    $contTable.append($domainTable);

                    $domainTable.dataTable();

                    self.$elem.append($contTable);
                },

                self.rpcError
            );

            return this;
        },

        getData: function() {
            return {
                type:this.options.type,
                id: this.options.id,
                workspace: this.options.ws,
                title: "GWAS Top Variations"
            };
        }
    });
})( jQuery )
