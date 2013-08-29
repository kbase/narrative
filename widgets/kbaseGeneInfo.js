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
			var self = this;

			this.$table = $("<table />");
			this.entityClient.get_entity_Feature(
				[this.options.featureID], 
				['feature_type', 'function', 'alias'],

				function(feature) {
					feature = feature[self.options.featureID];
					self.$table.append("<tr><td>ID</td><td>" + feature.id + "</td></tr>");
					self.$table.append("<tr><td>Function</td><td>" + (feature.function ? feature.function : "Unknown function") + "</td></tr>");

					if (feature.alias) {
						self.$table.append("<tr><td>Alias</td><td>" + feature.alias + "</td></tr>");
					}

					self.cdmiClient.fids_to_feature_data(
						[feature.id],

						function(featureData) {
							featureData = featureData[self.options.featureID];
							if (featureData.feature_publications && featureData.feature_publications.length > 0) {
								var pubStr = "";
								for (var i=0; i<featureData.feature_publications.length; i++) {
									pubStr += "<a href='" + featureData.feature_publications[i][1] + "' target='_new'>" + featureData.feature_publications[i][2] + "</a><br>";
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

			// this.cdmiClient.fids_to_feature_data(
			// 	[this.options.featureID],
			// 	function(featureData) {
			// 		console.log(featureData);
			// 	},
			// 	this.clientError
			// );


			return this;
		},

		clientError: function(error) {

		}


	})
})( jQuery );