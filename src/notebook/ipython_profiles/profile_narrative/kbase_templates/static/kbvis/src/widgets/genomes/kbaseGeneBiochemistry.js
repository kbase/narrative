/**
 * Shows general gene info.
 * Such as its name, synonyms, annotation, publications, etc.
 *
 * Gene "instance" info (e.g. coordinates on a particular strain's genome)
 * is in a different widget.
 */
(function( $, undefined ) {
	$.KBWidget({
		name: "KBaseGeneBiochemistry",
		parent: "kbaseWidget",
		version: "1.0.0",

		options: {
			featureID: null,
			embedInCard: false,
			auth: null,
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

			return this.render();
		},

		render: function(options) {
			var $table = $("<table/>")
						 .addClass("table table-striped table-bordered");

			var self = this;
			this.cdmiClient.fids_to_roles([this.options.featureID],
				function(roles) {
					roles = roles[self.options.featureID];
					var rolesStr = "None found";
					if (roles) {
						rolesStr = roles.join("<br/>");
					}
					$table.append($("<tr>")
								  .append($("<td>")
								  	      .append("Roles"))
								  .append($("<td>")
								  	      .append(rolesStr)));


					self.cdmiClient.fids_to_subsystems([self.options.featureID],
						function(subsystems) {
							subsystems = subsystems[self.options.featureID];
							var subsysStr = "None found";
							if (subsystems) {
								subsysStr = subsystems.join("<br/>");
							}
							$table.append($("<tr>")
										  .append($("<td>")
										  	      .append("Subsystems"))
										  .append($("<td>")
										  	      .append(subsysStr)));
						},

						self.clientError
					)
				},

				this.clientError
			)

			this.$elem.append($table);
			return this;
		},

        getData: function() {
            return {
                type: "Feature",
                id: this.options.featureID,
                workspace: this.options.workspaceID,
                title: "Biochemical Function"
            };
        },

		clientError: function(error) {

		},
	})
})( jQuery );