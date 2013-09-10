(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseCardManager",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
        },

        cards: [],

        init: function(options) {
            this._super(options);

            $.ui.dialog.prototype._makeDraggable = function() {
                this.uiDialog.draggable({
                    containment: false
                });
            };
    
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

            var position = {
                my: "left top",
                at: "right+5% top",
                of: this.cards.length > 0 ? ("#kblpc" + (this.cards.length-1)) : null,
                collision: "fit flip"
            };
            
            if (this.cards.length === 0) {
                position = {
                    my: "left top",
                    at: "left bottom",
                    of: $("#app")
                };
            }

            options.position = position;
            var newCard = this.$elem.append($("<div id='kblpc" + this.cards.length + "'/>")[cardName](options));
            this.cards.push(newCard);
        }

    });
})( jQuery );