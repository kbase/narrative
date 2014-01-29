/**
 * Options:
 *
 * workspaceName - the name of the workspace to show in this widget
 * workspaceURL - the location of the workspace service (default points to existing deployed service)
 * loadingImage - an image to show in the middle of the widget while loading data
 * notLoggedInMsg - a string to put in the middle of the widget when not logged in.
 */
(function( $, undefined ) {

	$.kbWidget("kbaseMiniWorkspace", 'kbaseWidget', {
		version: "1.0.0",
		wsClient: null,
		table: null,
		tableHTML: "<table class='kbws-datatable'></table>",

		options: {
			workspaceName: "",
			workspaceURL: "https://www.kbase.us/services/workspace",
			loadingImage: "ajax-loader.gif",
			notLoggedInMsg: "Please log in to view a workspace.",
		},

		init: function(options) {
			this._super(options);

			this.$messagePane = $("<div/>")
								.addClass("kbws-message-pane")
								.addClass("kbws-hide-message");
			this.$elem.append(this.$messagePane);

			this.$tableElem = $(this.tableHTML); //.attr("id", this.options.workspaceName);
			this.$elem.append(this.$tableElem);

			this.showMessage(this.options.notLoggedInMsg);

			return this;
		},

		render: function(objList) {
			//	typedef tuple<object_id id,object_type type,timestamp moddate,int instance,string command,username lastmodifier,username owner,workspace_id workspace,workspace_ref ref,string chsum,mapping<string,string> metadata> object_metadata;

			if (this.table) {
				this.table.fnDestroy();
				this.table = null;
			}

			this.table = this.$tableElem.dataTable( {
							"aaData" : objList,
							"aoColumns" : [
								{ "sTitle" : "ID",
								  "bSortable": true },
								{ "sTitle" : "Type" }
							],
							"aaSorting": [[ 0, "asc" ]],
							"bFilter": false,
							"bInfo": false,
							"bLengthChange": false,
							"bPaginate": false,
							"bAutoWidth": false,
						} );
			this.loading(true);
		},

		loggedIn: function(args) {
			this.hideMessage();

			this.wsClient = new workspaceService(this.options.workspaceURL);
			if (this.options.workspaceName === "")
				this.options.workspaceName = "KBaseFBA";

			this.loading(false);

			/*
			typedef structure { 
				workspace_id workspace;
				string type;
				bool showDeletedObject;
				string auth;
				bool asHash;
			} list_workspace_objects_params;
			*/

			var browser = this;
			this.wsClient.list_workspace_objects({ workspace: this.options.workspaceName, auth: args.token }, 
				function(results) {
					browser.render(results);
				},

				function(err) {
					browser.clientError(err);
				}
			);
		},

		loggedOut: function(e, args) {
			if (this.table) {
				this.table.fnDestroy();
				this.table = null;
			}
			this.$tableElem.empty();
			this.showMessage(this.options.notLoggedInMsg);
		},

		loading: function(doneLoading) {
			if (doneLoading)
				this.hideMessage();
			else
				this.showMessage("<img src='" + this.options.loadingImage + "'/>");
		},

		showMessage: function(message) {
			var span = $("<span/>").append(message);

			this.$messagePane.append(span);
			this.$messagePane.removeClass("kbws-hide-message");
		},

		hideMessage: function() {
			this.$messagePane.addClass("kbws-hide-message");
			this.$messagePane.empty();
		},

		clientError: function(error) {
			this.showMessage("Sorry, an error occurred.");
		}

	});

})( jQuery );
