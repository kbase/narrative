(function( $ ) {
	var loggedIn = false;

	$(function() {
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
															loadingImage: "/static/kbase/images/ajax-loader.gif"
															});

		$("#login-widget").kbaseLogin({ 
								style: "text",

								login_callback: function(args) {
									loggedIn = true;
									narrativeWsWidget.loggedIn(args);
								},

								logout_callback: function(args) {
									// flag as not logged in.
									loggedIn = false;
									narrativeWsWidget.loggedOut(args);

								},

								prior_login_callback: function(args) {
									loggedIn = true;
									narrativeWsWidget.loggedIn(args);
								}

							});
	});

})( jQuery );