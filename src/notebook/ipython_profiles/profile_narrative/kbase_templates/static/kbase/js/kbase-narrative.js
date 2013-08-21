(function( $ ) {
	var loggedIn = false;

	$(function() {
		$(document).on('loggedIn.kbase', function(token) {
			narrativeWsWidget.loggedIn(token);
		});

		$(document).on('loggedOut.kbase', function(token) {
			narrativeWsWidget.loggedOut(token);
		});

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
								},

								logout_callback: function(args) {
									// flag as not logged in.
									loggedIn = false;

								},

								prior_login_callback: function(args) {
									loggedIn = true;
								}

							});

	});

})( jQuery );