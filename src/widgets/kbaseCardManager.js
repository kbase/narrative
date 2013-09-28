(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseCardManager",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
        },
        cardIndex: 0,
        cards: {},

        init: function(options) {
            this._super(options);

            $.ui.dialog.prototype._makeDraggable = function() {
                this.uiDialog.draggable({
                    containment: false
                });
            };

            // allow html in dialog title bar
            // safe, since they're not user-generated or modified
            // http://stackoverflow.com/questions/14488774/using-html-in-a-dialogs-title-in-jquery-ui-1-10
            $.widget("ui.dialog", $.extend({}, $.ui.dialog.prototype, {
                _title: function(title) {
                    if (!this.options.title ) {
                        title.html("&#160;");
                    } else {
                        title.html(this.options.title);
                    }
                }
            }));

            var self = this;
            $(document).on("kbaseCardClosed", function(event, id) {
                self.cardClosed(id);
            });

            return this;
        },

        cardClosed: function(id) {
            delete this.cards[id];
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
             * When we make a new card, we store it in the manager like this:
             * cards[cardId] = {
             *     card: <the kbaseLandingCard>
             *     data: <the widget embedded in the card>
             * }
             *
             * This implies that each widget to be used in a card needs to expose
             * what its data type is and what the data component is.
             *
             * The data component should be a simple object like this:
             * {
             *     id: object ID,
             *     type: typed object name (Genome, FBAModel, etc. Whatever's registered as the typed object name)
             *     workspace: <optional> the workspace name it's located in.
             * }
             *
             * It should be available as widget.getData()
             */

            var newCardId = "kblpc" + this.cardIndex;

            if (position === null) {
                position = {
                    my: "center",
                    at: "center",
                    of: "window"
                }
            }

            this.$elem.append("<div id='" + newCardId + "'/>");

            var newWidget = $("#" + newCardId)[cardName](options);

            var cardTitle = newWidget.options.title ? newWidget.options.title : "";
            var cardSubtitle = newWidget.options.subtitle ? newWidget.options.subtitle : "";
            var cardWidth = newWidget.options.width ? newWidget.options.width : 300;

            var self = this;
            var newCard = $("#" + newCardId).LandingPageCard({
                position: position,
                title: "<div style='width:100%'><div>" + cardTitle + "</div><span style='font-size: 14px; font-weight: normal'>" + cardSubtitle + "</span><span class='label label-primary pull-right'>test!</span></div>",
                width: cardWidth,
                id: newCardId,
            });

            this.cards[newCardId] = {
                card: newCard,
                widget: newWidget
            };

            this.cardIndex++;
        },

        destroy: function() {
            this.listDataObjects();

            for (var cardId in this.cards) {
                this.cards[cardId].card.LandingPageCard("close");
            }

            $(document).off("kbaseCardClosed");
            this.$elem.empty();
            this.cards = {};
            this.$elem.remove();
        },

        listDataObjects: function() {
            for (var cardId in this.cards) {
                console.log(this.cards[cardId].widget.getData());
            }
        },

        exportAllCardsToWorkspace: function(workspace) {
            for (var cardId in this.cards) {
                sendCardToWorkspace(cardId, workspace);
            }
        },

        exportCardToWorkspace: function(cardId, workspace) {
            this.cards[cardId].widget.exportToWorkspace(workspace);
        }
    });
})( jQuery );