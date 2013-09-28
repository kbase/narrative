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
            auth: null,
            title: "Gene Instance",
            subtitle: "",
        },

        cdmiURL: "https://kbase.us/services/cdmi_api",
        workspaceURL: "https://kbase.us/services/workspace",

        init: function(options) {
            this._super(options);

            if (this.options.featureID === null) {
                //throw an error.
                return this;
            }

            this.cdmiClient = new CDMI_API(this.cdmiURL);
            this.entityClient = new CDMI_EntityAPI(this.cdmiURL);
            this.workspaceClient = new workspaceService(this.workspaceURL);

            this.options.subtitle = this.options.featureID;

            return this.render();
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

            var self = this;



            this.$table = $("<table />")
                         .addClass("kbgo-table");
            
            // Data fetching!
            // First, get feature data
            this.cdmiClient.fids_to_feature_data (
                [self.options.featureID],

                // this.populateFeatureData,
                // this.clientError

                function(featureData) {
                    featureData = featureData[self.options.featureID];

                    // Add this data to the table before moving on.
                    self.$table.append(self.makeRow("Function", featureData.feature_function));
                    self.$table.append(self.makeRow("Length", featureData.feature_length + " bp"));
                    self.$table.append(self.makeRow("Location", $("<div/>")
                                                           .append(self.parseLocation(featureData.feature_location))
                                                           .append(self.makeContigButton(featureData.feature_location))));

                    self.cdmiClient.fids_to_dna_sequences([self.options.featureID],
                        function(dnaSeq) {
                            self.$table.append(self.makeRow("GC Content", 
                                    self.calculateGCContent(dnaSeq[self.options.featureID]).toFixed(2) + "%"));

                            self.cdmiClient.fids_to_protein_families([self.options.featureID], 
                                function(families) {

                                    families = families[self.options.featureID];
                                    if (families) {
                                        self.cdmiClient.protein_families_to_functions(families, 
                                            // on success
                                            function(families) {
                                                var familyStr = '';

                                                if (families && families.length != 0) {
                                                    for (var fam in families) {
                                                        if (families.hasOwnProperty(fam))
                                                            familyStr += fam + ": " + families[fam] + "<br/>";
                                                    }
                                                }

                                                self.$table.append(self.makeRow("Protein Families", familyStr));
                                            
                                            },

                                            self.clientError
                                        );
                                    }
                                    else {
                                        self.$table.append(self.makeRow("Protein Families", "None found"));
                                    }

                                },

                                self.clientError
                            );
                        },

                        self.clientError
                    );
                },

                this.clientError
            );

            this.$elem.append(this.$table);

            var $domainButton = $("<button/>")
                               .attr("type", "button")
                               .addClass("btn btn-default")
                               .append("Domains")
                               .on("click", function(event) {
                                   self.trigger("showDomains", {
                                       event: event,
                                       featureID: self.options.featureID
                                   })
                               });

            var $operonButton = $("<button/>")
                               .attr("type", "button")
                               .addClass("btn btn-default")
                               .append("Operons")
                               .on("click", function(event) {
                                   self.trigger("showOperons", {
                                       event: event,
                                       featureID: self.options.featureID
                                   })
                               });

            var $biochemButton = $("<button/>")
                               .attr("type", "button")
                               .addClass("btn btn-default")
                               .append("Biochemistry")
                               .on("click", function(event) {
                                   self.trigger("showBiochemistry", {
                                       event: event,
                                       featureID: self.options.featureID
                                   })
                               });


            var $buttonGroup = $("<div/>")
                               .attr("align", "center")
                               .append($("<div/>")
                                       .addClass("btn-group")
                                       .append($domainButton)
                                       .append($operonButton)
                                       .append($biochemButton));
            this.$elem.append($buttonGroup);

            return this;
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
                                        event: event
                                    });
                                 }
                             );

            return $contigBtn;
        },

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

        getData: function() {
            return {
                type: "Feature",
                id: this.options.featureID,
                workspace: this.options.workspaceID
            };
        },

        clientError: function(error) {

        },
    })
})( jQuery );