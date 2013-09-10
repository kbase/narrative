(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseCardManager",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
        },
        cardIndex: 0,
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

        addNewCard: function(cardName, options, position) {
            /** position = optional. if none given, it puts the new card in the center of the page **/

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

            /*
             * 1. make the widget.
             * 2. make the card from the widget.
             * 3. manipulate its position.
             */

            var newCardId = "kblpc" + this.cardIndex;

            if (position === null) {
                position = {
                    my: "center",
                    at: "center",
                    of: "window"
                }
            }

            // var cardPosition = {
            //     my: "left top-42",
            //     at: "right+5% top",
            //     of: (this.cards.length > 0 ? this.cards[this.cards.length-1].$elem.selector : null), //($("#kblpc" + (this.cards.length-1) + ":parent")) : null),
            //     collision: "fit flip"
            // };

            // if (this.cards.length === 0) {
            //     cardPosition = {
            //         my: "left top",
            //         at: "left bottom",
            //         of: $("#app")
            //     };
            // }

            this.$elem.append("<div id='" + newCardId + "'/>");

            var newWidget = $("#" + newCardId)[cardName](options);
            var cardTitle = newWidget.options.title ? newWidget.options.title : "";
            var cardWidth = newWidget.options.width ? newWidget.options.width : 300;

            var newCard = $("#" + newCardId).LandingPageCard({
                position: position,
                title: cardTitle,
                width: cardWidth,
                close: function(event, ui) {
                }
            });

            this.cards.push(newCard);
        }

    });
})( jQuery );