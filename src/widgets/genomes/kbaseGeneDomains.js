/**
 * Shows general gene info.
 * Such as its name, synonyms, annotation, publications, etc.
 *
 * Gene "instance" info (e.g. coordinates on a particular strain's genome)
 * is in a different widget.
 */
(function( $, undefined ) {
	$.KBWidget({
		name: "KBaseGeneDomains",
		parent: "kbaseWidget",
		version: "1.0.0",

		options: {
			featureID: null,
			auth: null,
		},

		cdmiURL: "https://kbase.us/services/cdmi_api",
		workspaceURL: "https://kbase.us/services/workspace",
		proteinInfoURL: "https://kbase.us/services/protein_info_service",

		init: function(options) {
			this._super(options);

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
			this.proteinInfoClient.fids_to_domains([this.options.featureID],
				function(domains) {
					domains = domains[self.options.featureID];

					var domList = [];
					for (var i=0; i<domains.length; i++) {
						domList.push(domains[i]);
					}

					self.proteinInfoClient.domains_to_domain_annotations(domList,
						function(domainAnnotations) {

							var $domainTable = $("<table/>")
											   .addClass("table table-bordered table-striped");
							if (Object.getOwnPropertyNames(domainAnnotations).length > 0) {
								for (var i=0; i<domains.length; i++) {
									$domainTable.append($("<tr>")
														.append($("<td>")
																.append(domains[i]))
														.append($("<td>")
																.append(domainAnnotations[domains[i]])));
//									domainStr += domains[i] + ": " + domainAnnotations[domains[i]] + "<br/>";
								}
								self.$elem.append($domainTable);
							}
							else
								self.$elem.append("None found");

						},

						self.clientError
					);
				},

				this.clientError
			);

			return this;
		},

        getData: function() {
            return {
                type: "Feature",
                id: this.options.featureID,
                workspace: this.options.workspaceID,
                title: "Domains"
            };
        },

		clientError: function(error) {

		},
	})
})( jQuery );