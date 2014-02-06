/**
 * Shows general gene info.
 * Such as its name, synonyms, annotation, publications, etc.
 *
 * Gene "instance" info (e.g. coordinates on a particular strain's genome)
 * is in a different widget.
 */
(function( $, undefined ) {
	$.KBWidget({
		name: "KBaseGeneInfo",
		parent: "kbaseWidget",
		version: "1.0.0",

		// the only options are the feature ID, whether it should be embedded in a card, and (optionally) the auth token.
		options: {
			featureID: null,
			genomeID: null,
			workspaceID: null,
			kbCache: null,
			embedInCard: false,
			auth: null,
		},

		cdmiURL: "https://kbase.us/services/cdmi_api",
		workspaceURL: "https://kbase.us/services/workspace",

		/**
		 * Initializes the widget.
		 */
		init: function(options) {
			this._super(options);

			console.log("here!");
			if (this.options.featureID === null) {
				//throw an error.
				return this;
			}

			this.cdmiClient = new CDMI_API(this.cdmiURL);
			this.entityClient = new CDMI_EntityAPI(this.cdmiURL);
			this.workspaceClient = new workspaceService(this.workspaceURL);

			return this.render();
		},

		/**
		 * Renders the widget. This fetches the feature name, type, synonyms, 
		 * annotations, and any publications from the central store.
		 */
		render: function() {
			/*
			 * Need to get:
			 * Feature name
			 * feature type
			 * synonyms
			 * annotation(s)
			 * publication(s)
			 */
			var self = this;

			this.$table = $("<table />")
						  .addClass("table table-striped table-bordered");

			// chain of callbacks.
			// first, get the Feature entity from CDS
			this.entityClient.get_entity_Feature(
				[this.options.featureID], 
				['feature_type', 'function', 'alias'],

				function(feature) {
					feature = feature[self.options.featureID];
					self.$table.append("<tr><td>ID</td><td>" + feature.id + "</td></tr>");
					self.$table.append("<tr><td>Function</td><td>" + 
										(feature.function ? feature.function : "Unknown function") + 
										"</td></tr>");

					if (feature.alias) {
						self.$table.append("<tr><td>Alias</td><td>" + feature.alias + "</td></tr>");
					}

					// Next, get feature data for the publications.
					self.cdmiClient.fids_to_feature_data(
						[feature.id],

						function(featureData) {
							featureData = featureData[self.options.featureID];

							if (featureData.feature_publications && featureData.feature_publications.length > 0) {
								var pubStr;
								if (featureData.feature_publications.length === 1)
									pubStr = self.buildPublicationString(featureData.feature_publications[0]);
								else {
									pubStr = "<ol>";
									for (var i=0; i<featureData.feature_publications.length; i++) {
										pubStr += "<li>" + self.buildPublicationString(featureData.feature_publications[i]) + "</li>";
									}
									pubStr += "</ol>";

								}
								self.$table.append("<tr><td>Publications</td><td>" + pubStr + "</td></tr>");
							}
							self.$elem.append(self.$table);
						},
						self.clientError
					);
				},

				this.clientError
			);

			return this;
		},

		/**
		 * Returns a data object used for landing pages.
		 * @returns {Object} the data object used for building a landing page card.
		 * 
		 * @public
		 */
        getData: function() {
            return {
                type: "Feature",
                id: this.options.featureID,
                workspace: this.options.workspaceID,
                title: "Gene Info"
            };
        },

        /**
         * Builds a string for the publication in the given little tuple.
         * This wraps the publication info into a hyperlink.
         * @param {string[]} pub - the publication to be wrapped. The first element is ignored, 
         * the second is the HTML hyperlink address, and the third is the text for the link.
         * These are taken from the KBase publication type.
         * @returns {string} an HTML string with a link to the publication.
         */
		buildPublicationString: function(pub) {
			if (pub.length < 3)
				return "";
			else
				return "<a href='" + pub[1] + "' target='_new'>" + pub[2] + "</a>";
		},

		clientError: function(error) {

		},
	})
})( jQuery );