(function($, undefined) {
    var workspaceURL = "https://kbase.us/services/workspace";
    var workspaceClient = new workspaceService(workspaceURL);
    notLoggedIn();


    $(function() {
        $(document).on('loggedIn.kbase', function(event, token) {
            console.debug("logged in")
            loadFeed();
        });

        $(document).on('loggedOut.kbase', function(event, token) {
            console.debug("logged out")
            notLoggedIn();
        });

        var loginWidget = $("#login-widget").kbaseLogin({ 
            style: "narrative",
            rePrompt: false,

            login_callback: function(args) {
            	alert("callback call");
                loadFeed();
            },

            logout_callback: function(args) {
            	notLoggedIn();

            },

            prior_login_callback: function(args) {
                loadFeed();
            },
        });


        $("#signinbtn").click(function() {

        	showLoading();
			$("#login_error").hide();

        	loginWidget.login(

        		$('#kbase_username').val(),
        		$('#kbase_password').val(), 
        		function(args) {
        			console.log(args);
        			if (args.success === 1) {
        				
        				this.registerLogin(args);
        				loadFeed();
	        			doneLoading();
    	    			$("#login-widget").show();
    	    		} else {
    	    			$("#loading-indicator").hide();
						$("#login_error").html(args.message);
						$("#login_error").show();
    	    		}
        		}
        	)
        });

        $('#kbase_password').keypress(function(e){
        	if(e.which == 13){//Enter key pressed
            	$('#signinbtn').click();
        	}
    	});


    });

    function notLoggedIn() {
    	console.log("got here");
    	$("#header_banner").hide();
    	$("#alt_banner").show();
     	$("#login-widget").hide();
    	$("#login_section").show();
		$("#public_section").show();
	    $("#newsfeed_column").hide();
	    $("#narrative_column").hide();
	    $("#login-widget").hide();

    }



    function loadFeed() {
    	$("#alt_banner").hide();
    	$("#header_banner").show();
		$("#login_section").hide();
		$("#public_section").hide();
	    $("#newsfeed_column").show();
	    $("#narrative_column").show();
	    $("#login-widget").show();

        var token = $("#login-widget").kbaseLogin("token");
        var userId = $("#login-widget").kbaseLogin("get_kbase_cookie", "user_id");
        var userName = $("#login-widget").kbaseLogin("get_kbase_cookie", "name");

        if (!userName)
            userName = "KBase User";
        $("#kb_name").html(userName);

        loadProjectFeed(token, userId);
    };



    function clientError(error) {
        console.debug(error);
    };

    // feed 
	function loadProjectFeed (token, userId) {
		var workspaceURL = "https://www.kbase.us/services/workspace",

		wsClient = new workspaceService(workspaceURL);


		//get auth token
		if (token !== "null") {

			wsClient.list_workspaces_async({ auth: token }, 
					function(results) {
						var data = { rows: []};
						var count = 0;
						
						//first sort
						results = _.sortBy(results, function(ws) {
						    return ws[2];
						});
						results.reverse();
						
						//populate the data structure for the template
						_.every(results, function(workspace){

							if (userId != workspace[1]) {
								data.rows.push({
									"username": workspace[1],
									"workspace": workspace[0],
									"date": workspace[2]
								});		
								count++;
							}
							return count !== 10;
						});

						//call the template
						rows = ich.workspaces(data)
						$('#people_feed').append(rows);
						$('#loading-indicator-ws').hide();

						
					},

					function(err) {
						console.log(err);
					}
			);
		}	
	}

	function showLoading() {
	//$('#login_form button[type="submit"]').attr('disabled','disabled');
	$("#loading-indicator").show();
	}

	function doneLoading() {
		$("#loading-indicator").hide();
	}




})( jQuery );

/*

var login_url = "https://kbase.us/services/authorization/Sessions/Login/";
var userData;


var defaultUserData = {
	active_content: $("#new_workspace"),
	active_button: $("#workspace_button"),
    auth_token: null,
	
};


	


// logs a user in 
function login(user_id, password) {
    var initializeUser = function (token) {
	    userData = jQuery.extend(true, {}, defaultUserData);
	    userData.auth_token = token;
	   	   
	    $("#login-widget").show();

	    $("#login_section").hide();
		$("#public_section").hide();
	    $("#newsfeed_column").show();
		loadProjectFeed();
    };


    var hasLocalStorage = false;

	if (localStorage && localStorage !== null) {
        hasLocalStorage = true;
    }

	var options = {
		loginURL : login_url,
		possibleFields : ['verified','name','opt_in','kbase_sessionid','token','groups','user_id','email','system_admin'],
		fields : ['token', 'kbase_sessionid', 'user_id']
	};

	var args = { "user_id" : user_id, "password": password, "fields": options.fields.join(',')};
	
	login_result = $.ajax({type: "POST",
	                      url: options.loginURL,
	                      data: args,
	                      beforeSend: function (xhr) {
										 showLoading();
	                                  },
	                      success: function(data, textStatus, jqXHR) {
									   if (hasLocalStorage) {
										   localStorage["auth_token"] = data.token;
									   }
									   console.log(textStatus);
									   initializeUser(data.token);
									   $("#login-widget").kbaseLogin();
	                               }, 
	                      error: function(jqXHR, textStatus, errorThrown) {
	                          console.log(errorThrown);
							  //$('#login_form button[type="submit"]').removeAttr('disabled');
							  $("#loading-indicator").hide();
							  $("#login_error").html("There was a problem signing in: " + errorThrown);
							  $("#login_error").show();
	                      },
	                      dataType: "json"});
}


	// shows an animated gif indicating things are loading 
function showLoading() {
	//$('#login_form button[type="submit"]').attr('disabled','disabled');
	$("#loading-indicator").show();
}

*/
