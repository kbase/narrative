/**
 * Shows general gene info.
 * Such as its name, synonyms, annotation, publications, etc.
 *
 * Gene "instance" info (e.g. coordinates on a particular strain's genome)
 * is in a different widget.
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGeneInstanceInfo",
        parent: "kbaseWidget",
        version: "1.0.0",

        options: {
            featureID: null,
            workspaceID: null,
            genomeID: null,
            kbCache: null,
            auth: null,
            loadingImage: "../../widgets/images/ajax-loader.gif",
        },

        cdmiURL: "https://kbase.us/services/cdmi_api",

        init: function(options) {
            this._super(options);

            if (!this.options.featureID) {
                this.renderError();
                return this;
            }


            this.render();
            if (this.options.workspaceID)
                this.renderWorkspace();
            else
                this.renderCentralStore();

            return this;
        },

        render: function(options) {
            /*
             * Need to get:
             * Feature name
             * Feature type (cds, peg, etc.)
             * Location (coordinates) (link to centered genome browser -- or highlight in existing one?)
             * Length
             * Exons/structure.
             * Link to alignments, domains, trees, etc. GC content?
             * families
             * subsystems
             */

            var makeButton = function(btnName) {
                var id = btnName;
                btnName = btnName.replace(/\w\S*/g, 
                                function(txt) {
                                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                                });

                return $("<button>")
                       .attr("id", id)
                       .attr("type", "button")
                       .addClass("btn btn-primary")
                       .append(btnName);

            };

            this.$messagePane = $("<div/>")
                                .addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            this.$infoPanel = $("<div>");
            this.$infoTable = $("<table>")
                              .addClass("table table-striped table-bordered");
            this.$buttonPanel = $("<div>")
                                .attr("align", "center")
                                .addClass("btn-group")
                                .append(makeButton("domains"))
                                .append(makeButton("operons"))
                                .append(makeButton("biochemistry"));

            this.$infoPanel.append(this.$infoTable)
                           .append(this.$buttonPanel);

            this.$elem.append(this.$infoPanel);
        },

        renderCentralStore: function() {

            this.$infoPanel.hide();
            this.showMessage("<img src='" + this.options.loadingImage + "'>");

            var self = this;


            this.cdmiClient = new CDMI_API(this.cdmiURL);
            this.entityClient = new CDMI_EntityAPI(this.cdmiURL);

            // Data fetching!
            var jobsList = [];
            var data = {};
            // Fids to feature data job
            jobsList.push(this.cdmiClient.fids_to_feature_data([self.options.featureID],
                function(featureData) {
                    data.featureData = featureData[self.options.featureID];
                },
                this.clientError
            ));
            // Fids to genomes job
            jobsList.push(this.cdmiClient.fids_to_genomes([self.options.featureID],
                function(genome) {
                    data.genome = genome[self.options.featureID];
                },
                this.clientError
            ));
            // Fids to DNA sequence job
            jobsList.push(this.cdmiClient.fids_to_dna_sequences([this.options.featureID],
                function(dnaSeq) {
                    data.dnaSeq = dnaSeq[self.options.featureID];
                },
                this.clientError
            ));
            // Fids to protein families job
            jobsList.push(this.cdmiClient.fids_to_protein_families([this.options.featureID],
                function(families) {
                    data.families = families[self.options.featureID];
                },
                this.clientError
            ));

            $.when.apply($, jobsList).done(function() {
                self.$infoTable.empty();
                self.$infoTable.append(self.makeRow("Function", data.featureData.feature_function));
                self.$infoTable.append(self.makeRow("Genome", $("<div/>")
                                                          .append(data.featureData.genome_name)
                                                          .append("<br/>")
                                                          .append(self.makeGenomeButton(data.genome))));
                self.$infoTable.append(self.makeRow("Length", data.featureData.feature_length + " bp"));
                self.$infoTable.append(self.makeRow("Location", $("<div/>")
                                                            .append(self.parseLocation(data.featureData.feature_location))
                                                            .append(self.makeContigButton(data.featureData.feature_location))));

                self.$infoTable.append(self.makeRow("GC Content", self.calculateGCContent(data.dnaSeq).toFixed(2) + "%"));

                if (data.families && data.families.length != 0) {
                    self.cdmiClient.protein_families_to_functions(data.families,
                        function(families) {
                            var familyStr = '';
                            for (var fam in families) {
                                familyStr += fam + ": " + families[fam] + "<br/>";
                            }
                            self.$infoTable.append(self.makeRow("Protein Families", familyStr));
                        },
                        self.clientError
                    );
                }
                else
                    self.$infoTable.append(self.makeRow("Protein Families", "None found"));

                self.$buttonPanel.find("button#domains").click(
                    function(event) { 
                        self.trigger("showDomains", { event: event, featureID: self.options.featureID }) 
                    }
                );
                self.$buttonPanel.find("button#operons").click(
                    function(event) { 
                        self.trigger("showOperons", { event: event, featureID: self.options.featureID }) 
                    }
                );
                self.$buttonPanel.find("button#biochemistry").click(
                    function(event) { 
                        self.trigger("showBiochemistry", { event: event, featureID: self.options.featureID }) 
                    }
                );
                self.hideMessage();
                self.$infoPanel.show();
            });
        },

        renderWorkspace: function() {
            this.$infoPanel.hide();
            this.showMessage("<img src='" + this.options.loadingImage + "'>");

            var obj = this.buildObjectIdentity(this.options.workspaceID, this.options.genomeID);

            var prom = this.options.kbCache.req('ws', 'get_objects', [obj]);
            $.when(prom).fail($.proxy(function(error) {
                this.renderError(error);
                console.log(error);
            }, this));
            $.when(prom).done($.proxy(function(genome) {
                genome = genome[0];
                var feature = null;
                if (genome.data.features) {
                    for (var i=0; i<genome.data.features.length; i++) {
                        if (genome.data.features[i].id === this.options.featureID) {
                            feature = genome.data.features[i];
                            break;
                        }
                    }

                    if (feature) {
                        // FINALLY we have the feature! Hooray!
                        this.$infoTable.empty();
                        /* Function
                         * Genome + button
                         * Length
                         * Location + button
                         * GC Content (maybe)
                         * Protein Families
                         */

                        // Figure out the function.
                        var func = feature['function'];
                        if (!func) 
                            func = "Unknown";
                        this.$infoTable.append(this.makeRow("Function", func));

                        // Show the genome and a button for it.
                        this.$infoTable.append(this.makeRow("Genome", $("<div/>")
                                                                      .append(genome.data.scientific_name)
                                                                      .append("<br>")
                                                                      .append(this.makeGenomeButton(this.options.genomeID, this.options.workspaceID))));
                        // Figure out the feature length
                        var len = "Unknown";
                        if (feature.dna_sequence_length)
                            len = feature.dna_sequence_length + " bp";
                        else if (feature.dna_sequence)
                            len = feature.dna_sequence.length + " bp";
                        else if (feature.location && feature.location.length > 0) {
                            len = 0;
                            for (var i=0; i<feature.location.length; i++) {
                                len += feature.location[i][3];
                            }
                            len += " bp";
                        }
                        this.$infoTable.append(this.makeRow("Length", len));

                        // Make a contig button
                        this.$infoTable.append(this.makeRow("Location", $("<div/>")
                                                            .append(this.parseLocation(feature.location))
                                                            .append(this.makeContigButton(feature.location))));

                        // LOL GC content. Does anyone even care these days?
                        if (feature.dna_sequence) {
                            var gc = this.calculateGCContent(feature.dna_sequence);
                            this.$infoTable.append(this.makeRow("GC Content", Number(gc).toFixed(2)));
                        }

                        // Protein families list.
                        var proteinFamilies = "None found";
                        if (feature.protein_families) {
                            proteinFamilies = "";
                            for (var i=0; i<feature.protein_families.length; i++) {
                                var fam = feature.protein_families[i];
                                proteinFamilies += fam.id + ": " + fam.subject_description + "<br>";
                            }
                        }
                        this.$infoTable.append(this.makeRow("Protein Families", proteinFamilies));

                        // bind button events
                        this.$buttonPanel.find("button#biochemistry").click(
                            $.proxy(function(event) { 
                                this.trigger("showBiochemistry", { 
                                    event: event, 
                                    featureID: this.options.featureID,
                                    genomeID: this.options.genomeID,
                                    workspaceID: this.options.workspaceID,
                                    kbCache: this.options.kbCache 
                                });
                            }, this)
                        );

                    }
                    else {
                        this.renderError({ error: "Gene '" + this.options.featureID + 
                                                  "' not found in the genome with object id: " +
                                                  this.options.workspaceID + "/" + this.options.genomeID });
                    }

                }
                else {
                    this.renderError({ error: "No genetic features found in the genome with object id: " + 
                                              this.options.workspaceID + "/" + 
                                              this.options.genomeID });
                }

                this.hideMessage();
                this.$infoPanel.show();
            }, this));
        },

        makeRow: function(name, value) {
            var $row = $("<tr/>")
                       .append($("<td />").append(name))
                       .append($("<td />").append(value));
            return $row;
        },

        makeContigButton: function(loc) {
            if (loc === null || loc[0][0] === null)
                return "";

            var contigID = loc[0][0];

            var self = this;
            var $contigBtn = $("<button />")
                             .addClass("btn btn-default")
                             .append("Show Contig")
                             .on("click", 
                                 function(event) {
                                    self.trigger("showContig", { 
                                        contig: contigID, 
                                        centerFeature: self.options.featureID,
                                        genomeId: self.options.genomeID,
                                        workspaceId: self.options.workspaceID,
                                        kbCache: self.options.kbCache,
                                        event: event
                                    });
                                 }
                             );

            return $contigBtn;
        },

        makeGenomeButton: function(genomeID, workspaceID) {
            if (!genomeID)
                return "";

            if (!workspaceID)
                workspaceID = null;

            var self = this;
            var $genomeBtn = $("<button />")
                             .addClass("btn btn-default")
                             .append("Show Genome")
                             .on("click",
                                function(event) {
                                    console.log(self.options);
                                    self.trigger("showGenome", {
                                        genomeID: genomeID,
                                        workspaceID: workspaceID,
                                        kbCache: self.options.kbCache,
                                        event: event
                                    });
                                }
                             );

            return $genomeBtn;
        },

        /**
         * Returns the GC content of a string as a percentage value.
         * You'll still need to concat it to some number of decimal places.
         */
        calculateGCContent: function(s) {
            var gc = 0;
            s = s.toLowerCase();
            for (var i=0; i<s.length; i++) {
                var c = s[i];
                if (c === 'g' || c === 'c') 
                    gc++;
            }
            return gc / s.length * 100;            
        },

        /**
         * parses out the location into something visible in html, adds a button to open the contig.
         * something like:
         *   123 - 456 (+),
         *   789 - 1234 (+)
         *   on contig [ kb|g.0.c.1 ]  // clicking opens contig browser centered on feature.
         */
        parseLocation: function(loc) {
            if (loc.length === 0)
                return "Unknown";

            var locStr = "";
            for (var i=0; i<loc.length; i++) {
                var start = Number(loc[i][1]);
                var length = Number(loc[i][3]);

                var end = 0;
                if (loc[i][2] === '+')
                    end = start + length - 1;
                else
                    end = start - length + 1;

                locStr += start + " to " + end + " (" + loc[i][2] + ")<br/>";
//                locStr += loc[i][1] + " - " + loc[i][3] + " (" + loc[i][2] + ")<br/>";
            }
            return locStr;
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

        getData: function() {
            return {
                type: "Feature",
                id: this.options.featureID,
                workspace: this.options.workspaceID,
                genome: this.options.genomeID,
                title: "Gene Instance"
            };
        },

        renderError: function(error) {
            errString = "Sorry, an unknown error occurred";
            if (typeof error === "string")
                errString = error;
            else if (error.error && error.error.message)
                errString = error.error.message;

            
            var $errorDiv = $("<div>")
                            .addClass("alert alert-danger")
                            .append("<b>Error:</b>")
                            .append("<br>" + errString);
            this.$elem.empty();
            this.$elem.append($errorDiv);
        },

        buildObjectIdentity: function(workspaceID, objectID) {
            var obj = {};
            if (/^\d+$/.exec(workspaceID))
                obj['wsid'] = workspaceID;
            else
                obj['workspace'] = workspaceID;

            // same for the id
            if (/^\d+$/.exec(objectID))
                obj['objid'] = objectID;
            else
                obj['name'] = objectID;
            return obj;
        },

    })
})( jQuery );