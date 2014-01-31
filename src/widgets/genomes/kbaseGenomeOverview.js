(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseGenomeOverview", 
        parent: "kbaseAuthenticatedWidget", 
        version: "1.0.0",

        options: {
            genomeID: null,
            workspaceID: null,
            loadingImage: "../../widgets/images/ajax-loader.gif",
            isInCard: false,
        },

        token: null,
        cdmiURL: "https://kbase.us/services/cdmi_api",
//        workspaceURL: "http://140.221.84.209:7058",
//        workspaceURL: "https://kbase.us/services/ws",
        $infoTable: null,
        noContigs: "No Contigs",

        init: function(options) {
            this._super(options);
            if (this.options.genomeID === null) {
                //throw an error
                return;
            }

            this.$messagePane = $("<div/>")
                                .addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            this.render();
            if (this.options.workspaceID === null)
                this.renderCentralStore();
            return this;
        },

        render: function() {
            var self = this;

            this.$infoPanel = $("<div>");
            this.$infoPanel.append($("<button>")
                           .addClass("btn btn-primary")
                           .append("Show Description")
                           .attr("type", "button")
                           .on("click", 
                               function(event) {
                                   self.trigger("showGenomeDescription", 
                                       {
                                           genomeID: self.options.genomeID,
                                           workspaceID: self.options.workspaceID,
                                           event: event
                                       }
                                   );
                               })
                           );
            this.$infoTable = $("<table>")
                              .addClass("table table-striped table-bordered");
            this.$infoPanel.append($("<div>").append(this.$infoTable));

            this.$contigSelect = $("<select>")
                                 .addClass("form-control")
                                 .css({"width":"60%", "margin-right":"5px"})
                                 .append($("<option>")
                                         .attr("id", this.noContigs)
                                         .append(this.noContigs));

            var self = this;
            this.$contigButton = $("<button>")
                                 .addClass("btn btn-primary")
                                 .append("Show Contig")
                                 .click(function(event) {
                                    self.$elem.find("select option:selected").each(function() {
                                        var contigId = $(this).attr("id");
                                        if (contigId !== self.noContigs) {
                                            self.trigger("showContig", 
                                                { 
                                                    contig: $(this).attr("id"), 
                                                    workspaceID: self.options.workspaceID,
                                                    genomeID: self.options.genomeID,
                                                    event: event,
                                                }
                                            );
                                        }
                                    })
                                 });

            this.$infoPanel.append($("<div>")
                              .addClass("form-inline")
                              .append(this.$contigSelect)
                              .append(this.$contigButton));

            this.$infoPanel.hide();
            this.$elem.append(this.$infoPanel);
        },

        addInfoRow: function(a, b) {
            return "<tr><td>" + a + "</td><td>" + b + "</td></tr>";
        },

        renderCentralStore: function() {
            this.cdmiClient = new CDMI_API(this.cdmiURL);
            this.entityClient = new CDMI_EntityAPI(this.cdmiURL);

            this.$infoPanel.hide();
            this.showMessage("<img src='" + this.options.loadingImage + "'>");
            /**
             * Fields to show:
             * ID
             * Workspace (if from a workspace)
             * Owner (KBase Central Store vs. username)
             * Scientific Name
             * Domain
             * Complete
             * Size in bp
             * GC content (do we need this?)
             * # contigs
             * # features
             * # genes - PEGs
             * # RNA feats
             * Taxonomy
             */

            var self = this;
            this.entityClient.get_entity_Genome([this.options.genomeID],
                ['id', 'scientific_name', 'domain', 'complete', 'dna_size', 'source_id', 
                 'contigs', 'gc_content', 'pegs', 'rnas'],

                $.proxy(function(genome) {
                    genome = genome[this.options.genomeID];
                    this.genome = genome; // store it for now.

                    this.$infoTable.empty()
                                   .append(this.addInfoRow("ID", genome.id))
                                   .append(this.addInfoRow("Name", genome.scientific_name))
                                   .append(this.addInfoRow("Domain", genome.domain))
                                   .append(this.addInfoRow("Complete?", (genome.complete ? "Yes" : "No")))
                                   .append(this.addInfoRow("DNA Length", genome.dna_size))
                                   .append(this.addInfoRow("Source ID", genome.source_id))
                                   .append(this.addInfoRow("Number of Contigs", genome.contigs))
                                   .append(this.addInfoRow("GC Content", Number(genome.gc_content).toFixed(2) + " %"))
                                   .append(this.addInfoRow("Protein Encoding Genes", genome.pegs))
                                   .append(this.addInfoRow("RNAs", genome.rnas));

                    /*
                     * Here we go. Chain of callbacks.
                     * Get list of contigs, then get their lengths.
                     * Sort them by length and make a dropdown menu.
                     * Add a button that will open a new card with that contig's browser.
                     */
                    if (this.options.isInCard) {
                        this.cdmiClient.genomes_to_contigs([this.options.genomeID],
                            $.proxy(function(contigs) {
                                this.cdmiClient.contigs_to_lengths(contigs[this.options.genomeID],
                                    $.proxy(function(contigsToLengths) { 
                                        this.populateContigSelector(contigsToLengths); 
                                    }, this),
                                    this.clientError
                                );
                            }, this),

                            this.clientError
                        );
                    }

                    this.hideMessage();
                    this.$infoPanel.show();

                }, this),

                this.clientError
            );

        },

        populateContigSelector: function(contigsToLengths) {
            console.log(contigsToLengths);
            this.$contigSelect.empty();
            if (!contigsToLengths || contigsToLengths.length == 0)
                this.$contigSelect.append($("<option>")
                                          .attr("id", this.noContigs)
                                          .append(this.noContigs));
            for (var contig in contigsToLengths) {
                this.$contigSelect.append($("<option>")
                                          .attr("id", contig)
                                          .append(contig + " - " + contigsToLengths[contig] + " bp"));
            }
        },

        /**
         * @method loggedInCallback
         * This is associated with the login widget (through the kbaseAuthenticatedWidget parent) and
         * is triggered when a login event occurs.
         * It associates the new auth token with this widget and refreshes the data panel.
         * @private
         */
        loggedInCallback: function(event, auth) {
            this.token = auth;
            this.wsClient = new Workspace(this.workspaceURL, this.token);
            if (this.options.workspaceID && this.options.genomeID) {
                this.renderWorkspace();
            }
        },

        /**
         * @method loggedOutCallback
         * Like the loggedInCallback, this is triggered during a logout event (through the login widget).
         * It throws away the auth token and workspace client, and refreshes the widget
         * @private
         */
        loggedOutCallback: function(event, auth) {
            this.token = null;
            this.wsClient = null;

            return this;
        },

        renderWorkspace: function() {
            this.showMessage("<img src='" + this.options.loadingImage + "'>");
            this.$infoPanel.hide();
            console.log("rendering workspace genome");
            console.log(this.options.kbCache);
            var objIdentity = [{ workspace: this.options.workspaceID, 
                                name: this.options.genomeID }];

            var prom = this.options.kbCache.req('ws', 'get_objects', objIdentity);
            $.when(prom).done($.proxy(function(genome) {
                console.log(genome);
                genome = genome[0].data;

                var gcContent = "Unknown";
                var dnaLength = "Unknown";
                if (genome.dna_size && genome.dna_size != 0) {
                    dnaLength = genome.dna_size;
                    if (genome.gc_content)
                        gcContent = Number(genome.gc_content/dnaLength*100).toFixed(2) + " %";
                }

                this.$infoTable.empty()
                               .append(this.addInfoRow("ID", genome.id))
                               .append(this.addInfoRow("Name", genome.scientific_name))
                               .append(this.addInfoRow("Domain", genome.domain))
                               .append(this.addInfoRow("DNA Length", dnaLength))
                               .append(this.addInfoRow("Source ID", genome.source + ": " + genome.source_id))
                               .append(this.addInfoRow("Number of Contigs", genome.contig_ids.length))
                               .append(this.addInfoRow("GC Content", gcContent))
                               .append(this.addInfoRow("Genetic Code", genome.genetic_code))
                               .append(this.addInfoRow("Number of features", genome.features.length));

                var contigsToLengths = {};
                if (genome.contig_ids && genome.contig_ids.length > 0) {
                    for (var i=0; i<genome.contig_ids.length; i++) {
                        var len = "Unknown";
                        if (genome.contig_lengths && genome.contig_lengths[i])
                            len = genome.contig_lengths[i];
                        contigsToLengths[genome.contig_ids[i]] = len;
                    }
                }

                this.populateContigSelector(contigsToLengths);

                this.hideMessage();
                this.$infoPanel.show();

            }, this));
        },

        getData: function() {
            return {
                type: "Genome",
                id: this.options.genomeID,
                workspace: this.options.workspaceID,
                title: "Genome Overview"
            };
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);

            this.$messagePane.empty()
                             .append(span)
                             .removeClass("kbwidget-hide-message");
        },

        hideMessage: function() {
            this.$messagePane.addClass("kbwidget-hide-message");
        },

        clientError: function(error) {
        },

    });
})( jQuery );