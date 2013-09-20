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
        registeredEvents: ["featureClick", "showContig", "showDomains", "showOperons", "showBiochemistry"],

        init: function(options) {
            this._super(options);
    
            var self = this;
            $(document).on("showDomains", function(event, data) {
                console.log("domains!");
                console.log(data);
            });

            $(document).on("showOperons", function(event, data) {
                console.log("operons!");
                console.log(data);

            });

            $(document).on("showBiochemistry", function(event, data) {
                console.log("biochem!");
                console.log(data);
            });

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

                self.addNewCard("KBaseGeneInstanceInfo",
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

            $(document).on("showContig", function(event, data) {
                self.addNewCard("KBaseContigBrowser",
                    {
                        contig: data.contig,
                        showButtons: true,
                        loadingImage: "../../widgets/images/ajax-loader.gif",
                        centerFeature: data.centerFeature
                    },
                    {
                        my: "left top",
                        at: "center",
                        of: data.event
                    }
                );
            });

            this.addNewCard("KBaseGenomeOverview", 
                { 
                    genomeID: this.options.genomeID,
                    loadingImage: "../../widgets/images/ajax-loader.gif",
                    isInCard: true
                },
                {
                    my: "left top",
                    at: "left bottom",
                    of: "#app"
                }
            );

            this.addNewCard("KBaseWikiDescription",
                {
                    genomeID: this.options.genomeID,
                    loadingImage: "../../widgets/images/ajax-loader.gif",
                },
                {
                    my: "left top",
                    at: "left+330 bottom",
                    of: "#app"
                }
            );

            return this;
        },

        destroy: function() {
            this._super();
            for (var i=0; i<this.registeredEvents.length; i++) {
                $(document).off(registeredEvents[i]);
            }
        }
    });
})( jQuery );