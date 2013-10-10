/**
 * This is designed to work in the context of the landing page.
 * This initializes all card positions relative to the #app div.
 *
 * It manages all cards and widgets, organizes which data is available,
 * and (with available handlers) exports data to the user's workspace.
 *
 * For the purposes of the SAC demo, the user can only export to the default
 * username_home workspace. This might change later, dependent on input
 * from the UI and UX teams.
 *
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseCardLayoutManager",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            template: null,
            data: {},
            auth: null,
            userId: null,
            loadingImage: "../widgets/images/ajax-loader.gif",
        },
        cardIndex: 0,
        cards: {},
        cdmWorkspace: "CDS",
        defaultWidth: 300,

        workspaceURL: "https://www.kbase.us/services/workspace",
        fbaURL: "https://www.kbase.us/services/fba_model_services",
        workspaceClient: null,
        fbaClient: null,        // used to export CDS genomes to workspace.

        /**
         * Initializes this widget
         */
        init: function(options) {
            this._super(options);

            this.dbg('user:' + this.options.userId);
            this.dbg('token:' + this.options.auth);

            this.workspaceClient = new workspaceService(this.workspaceURL);
            this.fbaClient = new fbaModelServices(this.fbaURL);

            $.ui.dialog.prototype._makeDraggable = function() {
                this.uiDialog.draggable({
                    containment: false
                });
            };

            // Allows html in dialog title bar
            // This is safe here, since these title bars are not user-generated or modified.
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
         */
        render: function(options) {
            this.initControlBox();
            $("#app").append(this.$controlBox);

            this.initExportModal();
            this.$elem.append(this.exportModal.modal);

            return this;
        },

        /**
         * Initializes the modal dialog that appears when a user tries to export data to their workspace.
         * TODO: make this less full of sloppy html, and more jQuery-ish.
         *
         * It creates and stores a few accessible nodes in this.exportModal:
         *   modal: the modal itself. can be shown with exportModal.modal.modal('show')
         *   body: the body content of the modal - so it can be modified by the exporter method.
         *   okButton: exported so it can be rebound to save user-selected data.
         *   loadingDiv: exported so it can be readily added/removed from the modal body.
         */
        initExportModal: function() {
            var $body = $("<div class='modal-body'></div>");
            var $okButton = $("<button type='button' class='btn btn-primary'>Export</button>");

            var $modal = $("<div class='modal fade'>")
                         .append($("<div class='modal-dialog'>")
                                 .append($("<div class='modal-content'>")
                                         .append($("<div class='modal-header'>")
                                                 .append($("<h4 class='modal-title'>Export data?</h4>"))
                                                )
                                         .append($body)
                                         .append($("<div class='modal-footer'>")
                                                 .append($("<button type='button' class='btn btn-default' data-dismiss='modal'>Cancel</button>"))
                                                 .append($okButton)
                                                 )
                                         )
                                 );

            var $loadingDiv = $("<div style='width: 100%; text-align: center; padding: 20px'><img src=" + this.options.loadingImage + "/><br/>Exporting data. This may take a moment...</div>");

            var exportModal = {
                modal: $modal,
                body: $body,
                okButton: $okButton,
                loadingDiv: $loadingDiv
            };

            this.exportModal = exportModal;
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
                                          .on("click", function(event) { self.toggleDataManager(); })
                                          )
                                 );
            var $buttonPanel = $("<div/>")
                               .addClass("btn-group btn-group-sm")
                               .append($("<button/>")
                                       .on("click", function(event) { self.toggleSelectAll($(event.currentTarget)); })
                                       .addClass("btn btn-default")
                                       .append($("<span/>")
                                               .addClass("glyphicon glyphicon-check")
                                               )
                                       )
                               .append($("<button class='btn btn-default'>")
                                       .append("Export selected")
                                       .on("click", function(event) { self.exportToWorkspace(); })
                                       );

            var $body = $("<div/>")
                        .addClass("panel-body kblpc-manager")
                        .append($buttonPanel);

            var $dm = $("<div/>")
                      .addClass("row")
                      .append($("<div/>")
                              .addClass("panel panel-default")
                              .append($header)
                              .append($body));

            return $dm;
        },

        /**
         * Toggles between selecting all elements in the data manager, and unselecting them all.
         */
        toggleSelectAll: function($target) {
            // check off everything.
            if ($target.find("> .glyphicon").hasClass("glyphicon-check")) {
                $(".kblpc-manager-dataset > div > table > tbody > tr > td > input").prop('checked', true);
            }
            // uncheck everything.
            else {
                $(".kblpc-manager-dataset > div > table > tbody > tr > td > input").prop('checked', false);
            }

            $target.find("> .glyphicon").toggleClass("glyphicon-check glyphicon-unchecked");
        },

        /**
         * Updates the data manager to show data from all cards on the screen.
         * This does its updating in place, meaning that it compares the currently shown data against what's
         * being displayed in the data manager window, and makes adjustments accordingly.
         */
        updateDataManager: function() {
            // If the data manager isn't rendered, skip this all together.
            if (!this.$dataManager)
                return;

            // get the loaded data
            var dataHash = this.getDataObjectsHash();

            // now we have a hash of all data present.
            // make some html out of it.
            var dataTypes = [];
            for (var k in dataHash) {
                if (dataHash.hasOwnProperty(k))
                    dataTypes.push(k);
            }
            dataTypes.sort();

            var $dm = this.$dataManager.find(".kblpc-manager");

            /**
             * Each datatype gets its own block ($dataBlock)
             * Each block has a header and a dataSet.
             * The header does some funkiness where it toggles which way the pointer chevron is pointing.
             * When the header is clicked it toggles the display of its corresponding dataset.
             */
            $.each(dataTypes, function(i, type) {
                var underscoreType = type.replace(" ", "_");

                var $dataBlock = $dm.find(".kblpc-manager-dataset[data-type='" + type + "']");

                //If there's no datablock for that data type, make a new one!
                if ($dataBlock.length === 0) {
                    /* make a new datablock - this is the enclosing div
                     * for the section containing a header (with data type and count)
                     * and chevron for expanding/collapsing.
                     */
                    $dataBlock = $("<div/>")
                                     .addClass("kblpc-manager-dataset")
                                     .attr("data-type", type);

                    // The chevron is just a glyphicon.
                    var $chevron = $("<span/>")
                                   .addClass("glyphicon glyphicon-chevron-down");

                    // The header contains the name of the data type and number of objects
                    var $dataHeader = $("<div/>")
                                      .addClass("row")
                                      .append($("<a/>")
                                              .attr("data-toggle", "collapse")
                                              .attr("data-target", "#kblpc-" + underscoreType)
                                              .append($chevron)
                                              .append(" " + type + " (<span id='kblpc-count'>" + dataHash[type].length + "</span>)")
                                            );

                    // The dataset is the meat of the table, the collapsible list of data object ids.
                    var $dataSetRow = $("<div/>")
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
                                    )
                                   .append($("<table/>")
                                           .addClass("table"));

                    $dataBlock.append($dataHeader)
                              .append($dataSetRow);

                    $dm.append($dataBlock);
                }
                else {
                    // If we already have a datablock for that type, just update the number of elements it's showing.
                    $dataBlock.find("> div > a > span#kblpc-count").html(dataHash[type].length);
                }

                var $dataSet = $dataBlock.find("> div#kblpc-" + underscoreType + " > table");

                // search for what needs to be synched between the cards and the data manager.
                // 1. hash the list of data ids
                var dataIdHash = {};
                $.each(dataHash[type], function(j, id) {
                    dataIdHash[id] = 1;
                });

                // 2. hash the displayed elements
                var dataDivHash = {};
                $.each($dataSet.find("> tbody > tr"), function(j, child) {
                    var ws = $(child).find(":last-child").html();
                    var id = $(child).find(":nth-child(2)").html();
                    dataDivHash[ws + ":" + id] = $(child);
                });

                // 3. if it's in the idhash, and not the displayed hash, add it to the display.
                $.each(dataHash[type], function(j, wsId) {
                    if (!dataDivHash.hasOwnProperty(wsId)) {
                        var parts = wsId.split(':');
                        var ws = parts.shift();
                        var id = parts.join(':');

                        var $dataDiv = $("<tr/>")
                                       .addClass("pull-left")
                                       .append($("<td><input type='checkbox'></td> "))
                                       .append($("<td>" + id + "</td>"))
                                       .append($("<td>" + ws + "</td>"));
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
         * Exports the selected data elements to the user's workspace.
         *
         * This pops up a modal, making sure the user wants to copy everything.
         * If so, it invokes an export handler for each data type, then does it.
         * Each export process is expected to proceed asynchronously, so the handlers should
         * all return an array of ajax promises.
         *
         * Once these promises are fulfilled, the modal goes away.
         *
         * Each data type needs to have a corresponding function called _export<type>.
         * For example, the Genome type exporter is _exportGenome.
         *
         * Each exporter is passed a list of data objects, all containing these fields:
         * {
         *    id: <object id>,
         *    workspace: <workspace id>  // note that this might be === this.cdmWorkspace
         * }
         *
         * the exporter is also passed the workspace it should export to as a separate parameter.
         * Thus, the prototype for exporters is:
         * 
         * _exportDatatype: function(data, workspace) {}
         *
         * Note that auth tokens and user ids are available as
         * this.options.auth and
         * this.options.userId, repectively.
         */
        exportToWorkspace: function() {
            // 1. Get the data to export.
            var exportData = {};

            /* Probably not optimal, but it scrapes the data to export out of
             * the HTML tables.
             * It might be best to store everything being displayed, but that's just something
             * else to keep updated on each change.
             * And we need to check what's selected anyway. This is probably more efficient.
             * Still kinda ugly, though.
             */
            $.each($(".kblpc-manager-dataset"), function(i, element) {
                var type = $(element).attr("data-type");
                $.each($(element).find("> div[data-type='" + type + "'] > table > tbody > tr"), function(j, row) {
                    if ($(row).find(":first-child > input").prop("checked")) {
                        if (!exportData.hasOwnProperty(type))
                            exportData[type] = [];

                        var ws = $(row).find(":nth-child(3)").html();
                        var id = $(row).find(":nth-child(2)").html();
                        exportData[type].push({'id': id, 'workspace': ws});

                    }
                });
            });

            /**
             * This internal function does the work of invoking all the exporters.
             */
            var exportWs = this.options.userId + "_home";
            var self = this;
            var doExport = function() {
                self.exportModal.body.append(self.exportModal.loadingDiv);

                var jobsList = [];
                for (var type in exportData) {
                    var exportCommand = "_export" + type;
                    jobsList = jobsList.concat(self[exportCommand](exportData[type], exportWs));
                }

                $.when.apply($, jobsList).done(function() {
                    self.exportModal.modal.modal('hide');
                    self.dbg("Done exporting genomes!");
                });
            };

            /*
             * Now we have the data, so make an "Are you REALLY sure?" modal.
             * If the user says yes, modify it to show a progress bar or something.
             */

            if (Object.keys(exportData).length === 0) {
                this.exportModal.body.html("No data selected for export!");
                this.exportModal.okButton.addClass("hide");
            }
            else {
                var $bodyHtml = "Export selected data to workspace '<b>" + exportWs + "</b>'?";
                this.exportModal.body.html($bodyHtml);
                this.exportModal.okButton.removeClass("hide");
                this.exportModal.okButton.click(function(event) { doExport(); });
            }
            this.exportModal.modal.modal({'backdrop': 'static', 'keyboard': false});


            // Each data type needs an export handler. Might need to be handled elsewhere?
            // Or at least handled later.


        },

        _exportGenome: function(data, workspace) {
            // capture the list of async workspace api calls.
            var exportJobs = [];

            for (var i=0; i<data.length; i++) {
                var obj = data[i];
                if (obj.workspace === this.cdmWorkspace) {
                    this.dbg("exporting central store genome " + obj.id + " to workspace '" + workspace + "'");
                    var self = this;
                    exportJobs.push(this.fbaClient.genome_to_workspace(
                        {
                            genome: obj.id,
                            workspace: workspace,
                            auth: this.options.auth
                        },
                        function(objectMeta) {
                            self.dbg(objectMeta);
                        },
                        this.kbaseClientError
                    ));
                }
                else {
                    this.dbg("copying workspace genome " + obj.ws + ":" + obj.id + " to workspace");
                }
            }

            return exportJobs;
        },

        _exportDescription: function(data, workspace) {
            this.dbg("Exporting description");
            this.dbg(data);

            return [];
        },

        _exportContig: function(data, workspace) {
            this.dbg("Exporting contigs");
            this.dbg(data);

            return [];
        },

        _exportFeature: function(data, workspace) {
            this.dbg("Exporting genes");
            this.dbg(data);

            return [];
        },
	
        _exportMemeRunResult: function(data, workspace) {
            this.dbg("Exporting MEME run result");
            this.dbg(data);

            return [];
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
            // if no template given, just load a blank layout.
            if (!this.options.template)
                return;

            if (this.options.template.toLowerCase() === "genome")
                this.showGenomeCards();
            else if (this.options.template.toLowerCase() === "meme")
                this.showMemeCards();
            else if (this.options.template.toLowerCase() === "gene")
                this.showGeneCards();
            else if (this.options.template.toLowerCase() === "model")
                this.showModelCards();
            else {
                // throw an error for an unknown template. modal dialog, maybe?
            }
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
         * Template for showing gene cards.
         */
        showGeneCards: function() {
            this.addNewCard("kbaseGeneInfo",
                {
                    featureID: this.options.data.geneID,
                },
                {
                    my: "left top",
                    at: "left bottom",
                    of: "#app"
                }
            );
            this.addNewCard("KBaseGeneInstanceInfo",
                {
                    featureID: this.options.data.geneID,
                },
                {
                    my: "left top",
                    at: "left+330 bottom",
                    of: "#app"
                }
            );
        },

        /**
         * Template for showing model cards.
         */
        showModelCards: function() {
            // testing layout manager.
            // I'm thinking I shouldn't use this because api calls 
            // are made outside of the widgets
            this.addNewCard("kbaseModelMeta", 
                { data: this.options.data,
                  title: this.options.title,
                  id: this.options.id,
                  ws: this.options.ws},
                { my: "left top+50",
                  at: "left bottom",
                  of: "#app"});
        },

        /**
         * Initial template for showing MEME cards.
         */
        
        showMemeCards: function() {
        	var pattMeme = /MemeRunResult/i;
        	var pattTomtom = /TomtomRunResult/i;
        	var pattMast = /MastRunResult/i;
        	if (this.options.data.meme_run_result_id.match(pattMeme)){
            	this.addNewCard("KBaseMemeRunResultCard",
                        {
                            meme_run_result_id: this.options.data.meme_run_result_id,
                            workspace_id: this.options.data.workspace_id,
                            loadingImage: "assets/img/ajax-loader.gif",
                            isInCard: true
                        },
                        {
                            my: "left top",
                            at: "left bottom",
                            of: "#app"
                        }
                    );
        	    return this;
        	}
        	else if (this.options.data.meme_run_result_id.match(pattTomtom)){
            	this.addNewCard("KBaseTomtomRunResultCard",
                        {
                            tomtom_run_result_id: this.options.data.meme_run_result_id,
                            workspace_id: this.options.data.workspace_id,
                            loadingImage: "assets/img/ajax-loader.gif",
                            isInCard: true
                        },
                        {
                            my: "left top",
                            at: "left bottom",
                            of: "#app"
                        }
                    );
        	    return this;
        	}
        	else if (this.options.data.meme_run_result_id.match(pattMast)){
            	this.addNewCard("KBaseMastRunResultCard",
                        {
                            mast_run_result_id: this.options.data.meme_run_result_id,
                            workspace_id: this.options.data.workspace_id,
                            loadingImage: "assets/img/ajax-loader.gif",
                            isInCard: true
                        },
                        {
                            my: "left top",
                            at: "left bottom",
                            of: "#app"
                        }
                    );
        	    return this;
        	} else {
        		return this;
        	};
        },
        
        /**
         * Registers all events that this manager should know about.
         * Also makes a list of all registered events, stored in this.registeredEvents[], so they
         * can be unregistered.
         */
        registerEvents: function() {
            var self = this;

            this.registeredEvents = ["featureClick", 
                                     "showContig",
                                     "showGenome", 
                                     "showGenomeDescription",
                                     "showDomains", 
                                     "showOperons", 
                                     "showBiochemistry", 
                                     "showMemeMotif", 
                                     "showMemeRunParameters", 
                                     "showMemeRawOutput", 
                                     "showTomtomHits", 
                                     "showTomtomRunParameters", 
                                     "showMastHits"];

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

            /**
             * Event: showGenome
             * -----------------
             * Adds a genome overview card for the given genome ID
             */
            $(document).on("showGenome", function(event, data) {
                self.addNewCard("KBaseGenomeOverview",
                    {
                        genomeID: data.genomeID,
                        workspaceID: data.workspaceID,
                        isInCard: true
                    },
                    {
                        my: "left top",
                        at: "center",
                        of: data.event
                    }
                );
            });

            $(document).on("showGenomeDescription", function(event, data) {
                self.addNewCard("KBaseWikiDescription",
                    {
                        genomeID: data.genomeID,
                        loadingImage: "../../widgets/images/ajax-loader.gif",
                    },
                    {
                        my: "left top",
                        at: "center",
                        of: data.event
                    }
                );
            });

            /**
             * Event: showMemeMotif
             * -------------------
             * Adds new MEME Motif card.
             */
            $(document).on("showMemeMotif", function(event, data) {
                self.addNewCard("KBaseMemeMotifCard",
                    {
                        motif: data.motif,
                        showButtons: true,
                        centerFeature: data.centerFeature
                    },
                    {
                        my: "left top",
                        at: "left+800 bottom",
                        of: "#app"
                    }
                );
            });
            
            /**
             * Event: showMemeRunParameters
             * -------------------
             * Adds card with MEME run parameters.
             */

            $(document).on("showMemeRunParameters", function(event, data) {
                self.addNewCard("KBaseMemeRunParametersCard",
                    {
                        collection: data.collection,
                        showButtons: true,
                        centerFeature: data.centerFeature
                    },
                    {
                        my: "left top",
                        at: "left bottom+480",
                        of: "#app"
                    }
                );
            });

            /**
             * Event: showMemeRawOutput
             * -------------------
             * Adds card with raw MEME output.
             */
            $(document).on("showMemeRawOutput", function(event, data) {
                self.addNewCard("KBaseMemeRawOutputCard",
                    {
                        memeOutput: data.memeOutput,
                        showButtons: true,
                        centerFeature: data.centerFeature
                    },
                    {
                        my: "center top",
                        at: "center bottom",
                        of: "#app"
                    }
                );
            });


            /**
             * Event: showTomtomHits
             * -------------------
             * Adds new TOMTOM Hit List card.
             */
            $(document).on("showTomtomHits", function(event, data) {
                self.addNewCard("KBaseTomtomHitsCard",
                    {
                        tomtomresult: data.tomtomresult,
                        showButtons: true,
                        centerFeature: data.centerFeature
                    },
                    {
                        my: "left top+400",
                        at: "left bottom",
                        of: "#app"
                    }
                );
            });

            /**
             * Event: showTomtomRunParameters
             * -------------------
             * Adds new TOMTOM Hits card.
             */
            $(document).on("showTomtomRunParameters", function(event, data) {
                self.addNewCard("KBaseTomtomRunParametersCard",
                    {
                        tomtomresult: data.tomtomresult,
                        showButtons: true,
                        centerFeature: data.centerFeature
                    },
                    {
                        my: "left top",
                        at: "left+420 bottom",
                        of: "#app"
                    }
                );
            });

            /**
             * Event: showMastHits
             * -------------------
             * Adds new MAST Hit List card.
             */
            $(document).on("showMastHits", function(event, data) {
                self.addNewCard("KBaseMastHitsCard",
                    {
                        mastresult: data.mastresult,
                        showButtons: true,
                        centerFeature: data.centerFeature
                    },
                    {
                        my: "left+440 top",
                        at: "left bottom",
                        of: "#app"
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

            // if widget has getData() method, get panel title stuff,
            // otherwise use options.
            if (newWidget.getData) {
                var data = newWidget.getData();
                var cardTitle = data.title ? data.title : "";
                var cardSubtitle = data.id ? data.id : "";
                var cardWidth = newWidget.options.width ? newWidget.options.width : this.defaultWidth;
                var cardWorkspace = data.workspace ? data.workspace : this.cdmWorkspace;
            } else {
                var cardTitle = options.title ? options.title : "";
                var cardSubtitle = options.id ? options.id : "";
                var cardWidth = options.width ? options.width : this.defaultWidth;                
                var cardWorkspace = options.workspace ? options.workspace : this.cdmWorkspace;                
            }

            var cardOptions = {
                position: position,
                title: "<div>" + 
                       cardTitle + 
                       "</div>" +
                       "<div class='kblpc-subtitle'>" + 
                       cardSubtitle + 
                       "<span class='label label-primary pull-right'>" +
                       cardWorkspace + 
                       "</span></div>",
                width: cardWidth,
                id: newCardId,
            };

            if (newWidget.options.height)
                cardOptions.height = newWidget.options.height;

            var self = this;
            var newCard = $("#" + newCardId).LandingPageCard(cardOptions);

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

        getDataObjectsHash: function() {
            var data = this.getDataObjects();
            // shuffle it into a hash of unique ids and a list of their workspaces.

            var dataHash = {};
            var self = this;
            $.each(data, function(i, obj) {
                // accessors to make this legible.
                var t = obj.type;
                var id = obj.id;

                var ws = obj.workspace;
                if (!ws)
                    ws = self.cdmWorkspace;

                var idStr = ws + ":" + id;
                if (dataHash[t]) {
                    if ($.inArray(idStr, dataHash[t]) === -1) {
                        dataHash[t].push(idStr);
                    }
                }
                else
                    dataHash[t] = [idStr];
            });

            return dataHash;
        },

        getDataObjects: function() {
            var data = [];
            for (var cardId in this.cards) {
                var cardData = this.cards[cardId].widget.getData();

                // This is hacky as hell for now. 
                // 
                // Cases
                // 1. cardData.id = array and cardData.workspace != array
                //   Add a new data hunk for each id, point to same workspace.
                // 2. cardData.id = array and cardData.workspace = array
                //   Assume there's a one-to-one matching, do as above.
                //   If not a one to one matching, match what's there, and leave rest of workspaces blank.
                // 3. cardData.id != array, cardData.workspace != array
                //   I like this case.
                // 4. cardData.id = scalar, cardData.workspace = array
                //   Doubt this'll happen, ignore until it's a problem.

                if (Array.isArray(cardData.id)) {
                    for (var i in cardData.id) {
                        var id = cardData.id[i];
                        var ws = "";
                        if (!Array.isArray(cardData.workspace))
                            ws = cardData.workspace;

                        else if (Array.isArray(cardData.workspace) && cardData.workspace[i])
                            ws = cardData.workspace[i];

                        data.push({ id: id, workspace: ws, type: cardData.type }); // don't need title.
                    }
                }
                else
                    data.push(this.cards[cardId].widget.getData());
            }
            return data;
        },

        kbaseClientError: function(error) {
            this.dbg("A KBase client error occurred: ");
            this.dbg(error);
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
