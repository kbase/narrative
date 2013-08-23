(function( $ ) {
	var loggedIn = false;
	var wsWidget;

	$(function() {
		wsWidget = $("#workspace-widget").kbaseMiniWorkspace({ loadingImage: "assets/images/ajax-loader.gif" });
		wsWidget2 = $("#workspace-widget2").kbaseMiniWorkspace({ "workspaceName" : "bill_models", loadingImage: "assets/images/ajax-loader.gif" });
		wsWidget3 = $("#workspace-widget3").kbaseMiniWorkspace({ "workspaceName" : "adamguss", loadingImage: "assets/images/ajax-loader.gif" });

		narrativeWsWidget = $("#narrative-workspace-view").kbaseNarrativeWorkspace({
															tabs: [
																	{ 
																		name: "Narrative",
																		workspace: "KBaseFBA"
																	},
																	{
																		name: "Workspace",
																		workspace: "bill_models"
																	},
																	{
																		name: "Project",
																		workspace: "billbootcamp"
																	}
																],

															loadingImage: "assets/images/ajax-loader.gif"
															});

		$("#login-widget").kbaseLogin({
			style: "text",

			login_callback: function(args) {
				loggedIn = true;
				wsWidget.loggedIn(args);
				wsWidget2.loggedIn(args);
				wsWidget3.loggedIn(args);

				narrativeWsWidget.loggedIn(args);
			},

			logout_callback: function(args) {
				loggedIn = false;
				wsWidget.loggedOut(args);
				wsWidget2.loggedOut(args);
				wsWidget3.loggedOut(args);

				narrativeWsWidget.loggedOut(args);
			},

			prior_login_callback: function(args) {
				loggedIn = true;
				wsWidget.loggedIn(args);
				wsWidget2.loggedIn(args);
				wsWidget3.loggedIn(args);

				narrativeWsWidget.loggedIn(args);
			}
		});


	});
})( jQuery );

