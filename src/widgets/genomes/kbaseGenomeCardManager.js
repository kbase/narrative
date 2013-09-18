/**
 * Made to work with the landing page.
 * This initializes all card positions relative to the #app div.
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGenomeCardManager",
        parent: "KBaseCardManager",
        version: "1.0.0",
        options: {
            genomeID: null,
            workspaceID: null
        },

        init: function(options) {
            this._super(options);
    
            var self = this;
            $(document).on("featureClick", function(event, data) {
                self.addNewCard("KBaseGeneInfo", 
                    { 
                        featureID: data.feature.feature_id, 
                    },
                    {
                        my: "left top",
                        at: "center",
                        of: data.featureElement
                    }
                );
            });

            $(document).on("contigSelected", function(event, data) {
                self.addNewCard("KBaseContigBrowser",
                    {
                        contig: data.contig,
                        showButtons: true,
                        loadingImage: "../../widgets/images/ajax-loader.gif"
                    },
                    {
                        my: "left top",
                        at: "center",
                        of: data.event
                    }
                );
            });

            this.addNewCard("KBaseWikiDescription",
                {
                    genomeID: this.options.genomeID,
                },
                {
                    my: "left top",
                    at: "left bottom",
                    of: "#app"
                }
            );

            this.addNewCard("KBaseWikiDescription",
                {
                    genomeID: "kb|g.20848"
                },
                {
                    my: "left top",
                    at: "left bottom",
                    of: "#app"
                }
            );

            this.addNewCard("KBaseGenomeOverview", 
                { 
                    genomeID: this.options.genomeID,
                },
                {
                    my: "left top",
                    at: "left bottom",
                    of: "#app"
                }
            );


            this.addNewCard("KBaseContigBrowser", 
                { 
                    contig: "kb|g.0.c.1",
                    centerFeature: "kb|g.0.peg.2173", 
                    showButtons: true,
                    loadingImage: "../../widgets/images/ajax-loader.gif",
                },
                {
                    my: "left top",
                    at: "left+330 bottom",
                    of: "#app",
                    collision: "fit"
                });

            this.addNewCard("KBaseContigBrowser", 
                { 
                    contig: "kb|g.0.c.1",
                    centerFeature: "kb|g.0.peg.4288", 
                    showButtons: true,
                    loadingImage: "../../widgets/images/ajax-loader.gif"
                },
                {
                    my: "left top",
                    at: "left+330 bottom+200",
                    of: "#app"
                });

            return this;
        },

        destroy: function() {
            this._super();
            $(document).off("featureClick");
            $(document).off("contigSelected");
        }
    });
})( jQuery );