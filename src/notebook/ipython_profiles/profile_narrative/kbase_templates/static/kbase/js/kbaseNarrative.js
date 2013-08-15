(function( $ ) {
	var loggedIn = false;

	$(function() {
		$("#login-info").kbaseLogin({ 
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