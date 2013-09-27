/**
 * Made to work with the landing page.
 * This initializes all card positions relative to the #app div.
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseCardLayoutManager",
        parent: "KBaseCardManager",
        version: "1.0.0",
        options: {
            template: null,
            data: {},
        },

        init: function(options) {
            this._super(options);
    
            var self = this;
            this.registerEvents();
            this.showInitialCards();
            return this;
        },

        showInitialCards: function() {
            if (this.options.template.toLowerCase() === "genome")
                this.showGenomeCards();
            // else if (this.options.template.toLowerCase() === "hello")
            //     this.showHelloCards();
            else {
                // throw an error. modal dialog, maybe?
            }
        },

        /**
         * This is just left in here as an example stub. Not actually used.
         */
        showHelloCards: function() {
            this.addNewCard("HelloWidget",
                {
                    color: this.options.data.color,
                },
                {
                    my: "left top",
                    at: "left bottom",
                    of: "#app"
                }
            );

        },

        showGenomeCards: function() {
            this.addNewCard("KBaseGenomeOverview", 
                { 
                    genomeID: this.options.data.genomeID,
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
                    genomeID: this.options.data.genomeID,
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

        /**
         * Registers all events that this manager should know about.
         * Also makes a list of all registered events, stored in this.registeredEvents[], so they
         * can be unregistered.
         */
        registerEvents: function() {
            var self = this;

            this.registeredEvents = ["featureClick", "showContig", "showDomains", "showOperons", "showBiochemistry"];

            /**
             * Event: showDomains
             * ------------------
             * Adds new KBaseGeneDomains card.
             */
            $(document).on("showDomains", function(event, data) {
                self.addNewCard("KBaseGeneDomains",
                {
                    featureID: data.featureID
                },
                {
                    my: "left top",
                    at: "center",
                    of: data.event
                });
            });

            /**
             * Event: showOperons
             * ------------------
             * Adds new KBaseGeneOperon card, based on the feature that was clicked.
             */
            $(document).on("showOperons", function(event, data) {
                self.addNewCard("KBaseGeneOperon",
                {
                    featureID: data.featureID,
                    loadingImage: "../../widgets/images/ajax-loader.gif",
                },
                {
                    my: "left top",
                    at: "center",
                    of: data.event
                });
            });

            /**
             * Event: showBiochemistry
             * -----------------------
             * Adds new KBaseGeneBiochemistry card, based on a feature ID.
             */            
            $(document).on("showBiochemistry", function(event, data) {
                self.addNewCard("KBaseGeneBiochemistry",
                {
                    featureID: data.featureID
                },
                {
                    my: "left top",
                    at: "center",
                    of: data.event
                });
            });

            /**
             * Event: featureClick
             * -------------------
             * Adds cards based on clicking on a feature.
             */
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

            /**
             * Event: showContig
             * -----------------
             * Adds new KBaseContigBrowser card for a given contig ID,
             * and centered on a feature (if one's available).
             */
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

            $(document).on("helloClick", function(event, data) {
                window.alert(data.message);
            })
        },

        destroy: function() {
            this._super();
            for (var i=0; i<this.registeredEvents.length; i++) {
                $(document).off(this.registeredEvents[i]);
            }
        }
    });
})( jQuery );