(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGenomeCardManager",
        parent: "KBaseCardManager",
        version: "1.0.0",
        options: {
        },

        init: function(options) {
            this._super(options);

            $.ui.dialog.prototype._makeDraggable = function() {
                this.uiDialog.draggable({
                    containment: false
                });
            };
    
            var self = this;
            $(document).on("featureClick", function(event, data) {
                self.addNewCard("KBaseGeneInfo", { 
                    featureID: data.feature_id, 
                    embedInCard: true 
                });
            });

            this.addNewCard("KBaseGenomeOverview", { 
                genomeID: "kb|g.0", 
                embedInCard: true 
            });

            this.addNewCard("KBaseContigBrowser", { 
                contig: "kb|g.0.c.1",
                centerFeature: "kb|g.0.peg.2173", 
                showButtons: true,
                embedInCard: true,
                loadingImage: "../../widgets/images/ajax-loader.gif",
            });

            this.addNewCard("KBaseContigBrowser", { 
                contig: "kb|g.0.c.1",
                centerFeature: "kb|g.0.peg.4288", 
                showButtons: true,
                embedInCard: true,
                loadingImage: "../../widgets/images/ajax-loader.gif"
            });

            return this;
        },
    });
})( jQuery );