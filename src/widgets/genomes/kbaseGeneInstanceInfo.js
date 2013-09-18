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
            title: "Gene Instance"
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

            this.options.title += " - " + this.options.featureID;

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

            var $table = $("<table />")
                         .addClass("kbgo-table");
            
            this.cdmiClient.fids_to_feature_data(
                [this.options.featureID],

                function(featureData) {
                    featureData = featureData[self.options.featureID];

                    $table.append(self.makeRow("Function", featureData.feature_function));
                    $table.append(self.makeRow("Length", featureData.feature_length + " bp"));
                    $table.append(self.makeRow("Location", $("<div/>")
                                                           .append(self.parseLocation(featureData.feature_location))
                                                           .append(self.makeContigButton(featureData.feature_location))));
                },

                this.clientError
            );

            this.$elem.append($table);

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
                                    self.trigger("contigSelected", { 
                                        contig: contigID, 
                                        centerFeature: self.options.featureID,
                                        event: event
                                    });
                                 }
                             );

            return $contigBtn;
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
                locStr += loc[i][1] + " - " + loc[i][3] + " (" + loc[i][2] + ")<br/>";
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