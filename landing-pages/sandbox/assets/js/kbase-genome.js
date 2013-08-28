(function( $, undefined ) {
    $(function() {
        // Let the cards expand the desktop size when dragged.
        $.ui.dialog.prototype._makeDraggable = function() { 
            this.uiDialog.draggable({
                containment: false,
            });
        };

        /* Initialize the landing page with a few open cards */

        addNewCard("KBaseGenomeOverview", { genomeID: "kb|g.0", embedInCard: true });
        addNewCard("KBaseContigBrowser", { contig: "kb|g.0.c.1",
                                           centerFeature: "kb|g.0.peg.2173", 
                                           showButtons: true,
                                           embedInCard: true,
                                           loadingImage: "../../widgets/images/ajax-loader.gif"
                                         });


        addNewCard("KBaseContigBrowser", { contig: "kb|g.0.c.1",
                                           centerFeature: "kb|g.0.peg.4288", 
                                           showButtons: true,
                                           embedInCard: true,
                                           loadingImage: "../../widgets/images/ajax-loader.gif"
                                         });

    });

    var addNewCard = function(cardName, options) {
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

         /**
          * Will probably need some card management and tracking here, too.
          */

        $("#landing-page-container").append($("<div/>")[cardName](options));

    };

})( jQuery );