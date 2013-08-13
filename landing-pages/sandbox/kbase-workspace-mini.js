(function( $, undefined ) {

	$.kbWidget("kbaseMiniWorkspace", 'kbaseWidget', {
		version: "1.0.0",
		wsURL: "https://www.kbase.us/services/workspace",
		wsClient: null,

		options: {
			workspaceName: "",
		},

		populate: function(objList) {
			console.log(this);

			for (var i in objList) {
				this.$elem.append(objList[i][0] + " " + objList[i][1]);
			}
		},

		init: function(options) {
			this._super(options);
			return this.render();
		},

		render: function(options) {
			return this;
		},

		login: function(args) {
			this.wsClient = new workspaceService(this.wsURL, args.token);
			if (this.options.workspaceName === "")
				this.options.workspaceName = "KBaseFBA";

			var $browser = $(this);
			this.wsClient.list_workspace_objects({ workspace: this.options.workspaceName }, 
				function(results) {
					$browser[0].populate(results);
				});
			//	typedef tuple<object_id id,object_type type,timestamp moddate,int instance,string command,username lastmodifier,username owner,workspace_id workspace,workspace_ref ref,string chsum,mapping<string,string> metadata> object_metadata;

			/*
			typedef structure { 
				workspace_id workspace;
				string type;
				bool showDeletedObject;
				string auth;
				bool asHash;
			} list_workspace_objects_params;
			*/
		},

		logout: function(e, args) {
			console.log("logged out!");
		},

	});

})( jQuery );
