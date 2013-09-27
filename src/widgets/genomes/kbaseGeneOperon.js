/**
 * Shows general gene info.
 * Such as its name, synonyms, annotation, publications, etc.
 *
 * Gene "instance" info (e.g. coordinates on a particular strain's genome)
 * is in a different widget.
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGeneOperon",
        parent: "kbaseWidget",
        version: "1.0.0",

        options: {
            featureID: null,
            auth: null,
            title: "Operon",
            loadingImage: null
        },

        cdmiURL: "https://kbase.us/services/cdmi_api",
        workspaceURL: "https://kbase.us/services/workspace",
        proteinInfoURL: "https://kbase.us/services/protein_info_service",

        init: function(options) {
            this._super(options);
            console.log("fid");
            console.log(this.options.featureID);

            if (this.options.featureID === null) {
                //throw an error.
                return this;
            }

            this.options.title += " - " + this.options.featureID;
            this.$messagePane = $("<div/>")
                                .addClass("kbwidget-message-pane")
                                .addClass("kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            this.cdmiClient = new CDMI_API(this.cdmiURL);
            this.entityClient = new CDMI_EntityAPI(this.cdmiURL);
            this.workspaceClient = new workspaceService(this.workspaceURL);
            this.proteinInfoClient = new ProteinInfo(this.proteinInfoURL);

            return this.render();
        },

        render: function(options) {
            if (this.options.loadingImage)
                this.showMessage("<img src='" + this.options.loadingImage + "'/>");

            var self = this;
            this.proteinInfoClient.fids_to_operons([this.options.featureID],
                function(operons) {
                    operons = operons[self.options.featureID];

                    var operonStr = "Feature not part of an operon.";
                    if (operons && operons.length > 1) {
                        operonStr = "";
                        for (var i in operons) {
                            operonStr += operons[i] + " ";
                        }
                    }
                    self.$elem.append(operonStr);

                    self.hideMessage();
                },

                this.clientError
            );

            return this;
        },

        getData: function() {
            return {
                type: "Feature",
                id: this.options.featureID,
                workspace: this.options.workspaceID
            };
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);

            this.$messagePane.append(span);
            this.$messagePane.removeClass("kbwidget-hide-message");
        },

        hideMessage: function() {
            this.$messagePane.addClass("kbwidget-hide-message");
            this.$messagePane.empty();
        },

        clientError: function(error) {
            console.debug(error);
        },
    })
})( jQuery );