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
			title: "Operon"
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

			this.cdmiClient = new CDMI_API(this.cdmiURL);
			this.entityClient = new CDMI_EntityAPI(this.cdmiURL);
			this.workspaceClient = new workspaceService(this.workspaceURL);
			this.proteinInfoClient = new ProteinInfo(this.proteinInfoURL);

			return this.render();
		},

		render: function(options) {
			var self = this;
			this.proteinInfoClient.fids_to_operons([this.options.featureID],
				function(operons) {
					operons = operons[self.options.featureID];

					var operonStr = "No operons found";
					if (operons) {
						operonStr = "";
						for (var i in operons) {
							operonStr += operons[i] + " ";
						}
					}
					self.$elem.append(operonStr);
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

		clientError: function(error) {
			console.debug(error);
		},
	})
})( jQuery );