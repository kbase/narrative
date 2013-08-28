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

		options: {
			featureID: null,
			embedInCard: false,
			auth: null
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

			if (this.options.embedInCard) {
				this.$elem.LandingPageCard({ title: "Gene Info - " + this.options.featureID });
			}

			return this.render();
		},

		render: function(options) {
			/*
			 * Need to get:
			 * Feature name
			 * feature type
			 * synonyms
			 * annotation(s)
			 * publication(s)
			 */

			this.$elem.append(this.options.featureID);
			return this;
		}


	})
})( jQuery );