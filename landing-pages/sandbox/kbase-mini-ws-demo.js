(function( $ ) {
	var loggedIn = false;
	var wsWidget;

	$(function() {
		wsWidget = $("#workspace-widget").kbaseMiniWorkspace();

		$("#login-widget").kbaseLogin({
			style: "text",

			login_callback: function(args) {
				loggedIn = true;
				wsWidget.login(args);
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

