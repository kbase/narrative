/**
 * Made to work with the landing page.
 * This initializes all card positions relative to the #app div.
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseCardLayoutManager",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            template: null,
            data: {},
        },
        cardIndex: 0,
        cards: {},

        /**
         * Initializes this widget
         */
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

            this.render();
            this.registerEvents();
            this.showInitialCards();
            return this;
        },

        /**
         * Renders the control box panel.
         * This is optional, so it's (currently) kept separate from the init function.
         */
        render: function(options) {
            this.initControlBox();
            $("#app").append(this.$controlBox);
            
            return this;
        },

        /**
         * Initializes the control panel menu that sits in the upper-right corner.
         * Currently only has one working function - show the data manager.
         *
         * Soon, there'll be a way to save and load the card layouts.
         */
        initControlBox: function() {
            var self = this;
            var makeMenuItem = function(text, action) {
                var $item = $("<li />")
                            .attr("role", "presentation")
                            .append($("<a />")
                                    .attr("role", "menuitem")
                                    .attr("tabindex", "-1")
                                    .append(text)
                                    .on("click", $.proxy(self, action) )
                                    );
                return $item;
            };


            var $dropdown = $("<div/>")
                            .addClass("dropdown")
                            .addClass("pull-right")
                            .append($("<button>")
                                    .attr("data-toggle", "dropdown")
                                    .addClass("btn btn-primary")
                                    .append("<span class='glyphicon glyphicon-cog'/> <span class='caret'></span>")
                                    )
                            .append($("<ul>")
                                    .addClass("dropdown-menu pull-right")
                                    .attr("role", "menu")
                                    .attr("aria-labelledby", "dLabel")
                                    .append(makeMenuItem("Manage Data", "toggleDataManager"))
                                    .append(makeMenuItem("Save Layout", "saveLayout").addClass("disabled"))
                                    .append(makeMenuItem("Load Layout", "loadLayout").addClass("disabled"))
                                    );

            this.$dataManager = this.makeDataManager();

            this.$dataManager.hide();

            this.$controlBox = $("<div class='container'/>")
                               .addClass("kblpc-control-box")
                               .append($("<div class='row'>").append($dropdown))
                               .append(this.$dataManager);
        },

        /**
         * Builds the data manager panel.
         */
        makeDataManager: function() {
            var self = this;
            var $header = $("<div/>")
                          .addClass("panel-heading")
                          .append($("<span/>")
                                  .addClass("panel-title")
                                  .append("Data Manager ")
                                 )
                          .append($("<a/>")
                                  .append($("<span/>")
                                          .addClass("glyphicon glyphicon-remove pull-right")
                                          .on("click", function(event) { self.toggleDataManager(self); })
                                          )
                                 );

            var $body = $("<div/>")
                        .addClass("panel-body")
                        .append("<div/>");

            var $dm = $("<div/>")
                      .addClass("row")
                      .append($("<div/>")
                              .addClass("panel panel-default")
                              .append($header)
                              .append($body));

            return $dm;
        },

        updateDataManager: function() {
            if (!this.$dataManager)
                return;

            // get the loaded data
            var data = this.getDataObjects();

            // shuffle it into a hash of unique ids.
            var dataHash = {};
            $.each(data, function(i, obj) {
                // accessors to make this legible.
                var t = obj.type;
                var id = obj.id;

                if (dataHash[t]) {
                    if ($.inArray(id, dataHash[t]) === -1) {
                        dataHash[t].push(id);
                    }
                }
                else
                    dataHash[t] = [id];
            });

            // now we have a hash of all data present.
            // make some html out of it.
            var dataTypes = [];
            for (var k in dataHash) {
                if (dataHash.hasOwnProperty(k))
                    dataTypes.push(k);
            }
            dataTypes.sort();

            var $dm = this.$dataManager.find(".panel-body");

            /**
             * Each datatype gets its own block ($dataBlock)
             * Each block has a header and a dataSet.
             * The header does some funkiness where it toggles which way the pointer chevron is pointing.
             * When the header is clicked it toggles the display of its corresponding dataset.
             */
            $.each(dataTypes, function(i, type) {
                var underscoreType = type.replace(" ", "_");

                // try to find $kblpc-underscoreType
                var $dataBlock = $dm.find(".kblpc-manager-dataset[data-type='" + type + "']");
                if ($dataBlock.length === 0) {
                    $dataBlock = $("<div/>")
                                     .addClass("kblpc-manager-dataset")
                                     .attr("data-type", type);

                    var $chevron = $("<span/>")
                                   .addClass("glyphicon glyphicon-chevron-down");

                    var $dataHeader = $("<div/>")
                                      .addClass("row")
                                      .append($("<a/>")
                                              .attr("data-toggle", "collapse")
                                              .attr("data-target", "#kblpc-" + underscoreType)
                                              .append($chevron)
                                              .append(" " + type + " (<span id='kblpc-count'>" + dataHash[type].length + "</span>)")
                                            );
                    var $dataSet = $("<div/>")
                                   .attr("id", "kblpc-" + underscoreType)
                                   .attr("data-type", type)
                                   .addClass("row collapse in")
                                   .on("hidden.bs.collapse", { chevron: $chevron }, 
                                        function(event) {
                                            event.data.chevron.toggleClass("glyphicon-chevron-down");
                                            event.data.chevron.toggleClass("glyphicon-chevron-right");
                                        }
                                    )
                                   .on("shown.bs.collapse", { chevron: $chevron }, 
                                        function(event) {
                                            event.data.chevron.toggleClass("glyphicon-chevron-down");
                                            event.data.chevron.toggleClass("glyphicon-chevron-right");
                                        }
                                    );

                    $dataBlock.append($dataHeader)
                              .append($dataSet);

                    $dm.append($dataBlock);
                }
                else {
                    $dataBlock.find("> div > a > span#kblpc-count").html(dataHash[type].length);
                }

                $dataSet = $dataBlock.find("> div#kblpc-" + underscoreType);

                // search for what needs to be synched.
                // 1. hash the list of ids
                var dataIdHash = {};
                $.each(dataHash[type], function(j, id) {
                    dataIdHash[id] = 1;
                });

                // 2. hash the displayed elements
                var dataDivHash = {};
                $.each($dataSet.find("> div > span"), function(j, child) {
                    console.log(j);
                    console.log(child);

                    dataDivHash[$(child).html()] = $(child).parent();
                });

                // 3. if it's in the idhash, and not the displayed hash, add it to the display.
                $.each(dataHash[type], function(j, id) {
                    if (!dataDivHash.hasOwnProperty(id)) {
                        var $dataDiv = $("<div/>")
                                       .append($("<input type='checkbox'> "))
                                       .append($("<span>" + id + "</span>"));
                        $dataSet.append($dataDiv);
                    }
                });

                // 4. if it's in the displayed hash and not the id hash, remove it from the display.
                $.each(dataDivHash, function(key, value) {
                    if (!dataIdHash.hasOwnProperty(key)) {
                        value.remove();
                    }
                });
            });

            // at the very very end, remove any blocks that don't match to any current datatypes
            // i.e.: those blocks whose last card was just removed.

            $.each($(".kblpc-manager-dataset"), function(i, element) {
                if (!dataHash.hasOwnProperty($(element).attr("data-type")))
                    $(element).remove();
            });
        },

        /**
         * Toggles the data manager div
         */
        toggleDataManager: function() {
            this.$dataManager.toggle();
        },

        /**
         * Saves the card layout to the user state space.
         */
        saveLayout: function() {
            window.alert("save layout");
        },

        /**
         * Loads a layout from the user state space.
         */
        loadLayout: function() {
            window.alert("load layout");
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

        /**
         * Initial template for showing genome cards.
         * Shows a genome overview and a description card.
         */
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

        /**
         * Adds a new card to the layout manager. This needs three parameters:
         * 1. cardName - the name of the card widget to be invoked. E.g. 'KBaseGenomeOverview' for the
         *               Genome Overview widget.
         * 2. options - the options object to be passed to the card.
         * 3. position - a jQuery-UI position object for the initial position to put the card.
         *               See the jquery-ui position docs for details.
         */
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

            var data = newWidget.getData();
            var cardTitle = data.title ? data.title : "";
            var cardSubtitle = data.id ? data.id : "";
            var cardWidth = newWidget.options.width ? newWidget.options.width : 300;
            var cardWorkspace = data.workspace ? data.workspace : "KBase Central Store";

            var self = this;
            var newCard = $("#" + newCardId).LandingPageCard({
                position: position,
                title: "<div>" + 
                       cardTitle + 
                       "</div>" +
                       "<div style='font-size: 14px; font-weight: normal'>" + 
                       cardSubtitle + 
                       "<span class='label label-primary pull-right'>" +
                       cardWorkspace + 
                       "</span></div>",
                width: cardWidth,
                id: newCardId,
            });

            this.cards[newCardId] = {
                card: newCard,
                widget: newWidget
            };

            this.cardIndex++;

            this.updateDataManager();
        },

        /**
         * Invoked when a card is closed - removes it from the set of cards that this manager knows about.
         */
        cardClosed: function(id) {
            delete this.cards[id];
            this.updateDataManager();
        },

        /**
         * Simple function that lists all loaded cards.
         */
        listDataObjects: function() {
            for (var cardId in this.cards) {
                console.log(this.cards[cardId].widget.getData());
            }
        },

        getDataObjects: function() {
            var data = [];
            for (var cardId in this.cards) {
                data.push(this.cards[cardId].widget.getData());
            }
            return data;
        },

        exportAllCardsToWorkspace: function(workspace) {
            for (var cardId in this.cards) {
                sendCardToWorkspace(cardId, workspace);
            }
        },

        exportCardToWorkspace: function(cardId, workspace) {
            this.cards[cardId].widget.exportToWorkspace(workspace);
        },

        /**
         * When the manager is destroyed, it needs to:
         * 1. Close all cards.
         * 2. Unregister all card events.
         * 3. Remove itself from the DOM.
         *
         * That third one might be more appropriate to occur outside of this widget, but here it is for now.
         */
        destroy: function() {
            for (var cardId in this.cards) {
                this.cards[cardId].card.LandingPageCard("close");
            }

            $(document).off("kbaseCardClosed");
            this.$elem.empty();
            this.cards = {};
            this.$elem.remove();

            for (var i=0; i<this.registeredEvents.length; i++) {
                $(document).off(this.registeredEvents[i]);
            }
            this.$controlBox.remove();
        },
    });
})( jQuery );