(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseCardManager",
        parent: "kbaseWidget",
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
                self.addNewCard("KBaseGeneInfo", { featureID: data.feature_id, embedInCard: true });
            });

            this.addNewCard("KBaseGenomeOverview", { genomeID: "kb|g.0", embedInCard: true });
            this.addNewCard("KBaseContigBrowser", { contig: "kb|g.0.c.1",
                                               centerFeature: "kb|g.0.peg.2173", 
                                               showButtons: true,
                                               embedInCard: true,
                                               loadingImage: "../../widgets/images/ajax-loader.gif",
                                             });

            this.addNewCard("KBaseContigBrowser", { contig: "kb|g.0.c.1",
                                               centerFeature: "kb|g.0.peg.4288", 
                                               showButtons: true,
                                               embedInCard: true,
                                               loadingImage: "../../widgets/images/ajax-loader.gif"
                                             });

            return this;
        },

        addNewCard: function(cardName, options) {
            /* NOTE - later, have it manage where the new card comes in here.
             *
             * Should be a way to use the dialog/position jqueryUI stuff.
             * Something like:
             * 
             * $("#id").dialog({
             *      position: {
             *          my: 'top',
             *          at: 'top',
             *          of: $("#initializing element")
             *      }
             * });
             *
             * Would need to pass in whatever's the initializer, i.e. the
             * card that wants to spawn a new one. Or null (or maybe $(window)?)
             * to make it relative to the page.
             */

            this.$elem.append($("<div/>")[cardName](options));
        }

    });
})( jQuery );