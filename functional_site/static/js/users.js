(function($, undefined) {
    var workspaceURL = "https://kbase.us/services/workspace";
    var workspaceClient = new workspaceService(workspaceURL);
    notLoggedIn();


    $(function() {
      /*  $(document).on('loggedIn.kbase', function(event, token) {
            console.debug("logged in")
            loadPage();
        });

        */
        $(document).on('loggedOut.kbase', function(event, token) {
            console.debug("logged out")
            notLoggedIn();
        });

        var loginWidget = $("#login-widget").kbaseLogin({ 
            style: "narrative",
            rePrompt: false,

            login_callback: function(args) {
            	alert("callback call");
                loadPage();
            },

            logout_callback: function(args) {
            	notLoggedIn();

            },

            prior_login_callback: function(args) {
                loadPage();
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
                        loadPage();
	        			doneLoading();
    	    			$("#login-widget").show();
    	    		} else {
    	    			$("#loading-indicator").hide();
						$("#login_error").html(args.message);
						$("#login_error").show();
    	    		}
        		}
        	);
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



    function loadPage() {
    	$("#alt_banner").hide(); // Hmmm???
    	$("#header_banner").show(); // Hmmm??
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
        loadRecentNarratives();
        loadRecentProjects();

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
                                var moddate = workspace[2];
                                moddate = moddate.replace(/T/g," ");
								data.rows.push({
									"username": workspace[1],
									"workspace": workspace[0],
									"date": moddate
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

	//populates the recent narratives section of the user home page
	function loadRecentNarratives() {
		$("#no_narratives").hide();
        $("#narratives_loading").show();
        project.get_narratives({
            callback: function(results) {
                if (Object.keys(results).length > 0) {
                    var data = { rows: []};
                    var userId = $("#login-widget").kbaseLogin("get_kbase_cookie", "user_id");

					//first sort
					results = _.sortBy(results, function(narrative) {
					    return narrative.moddate;
					});
					results.reverse();
					
					//populate the data structure for the template
					var count = 0;
					_.every(results, function(narrative){

						var name = narrative.id.replace(/_/g," ");
						//var project_id = narrative.workspace.replace(/_/g," ");


						data.rows.push({
                            "name": name,
                            "narrative_id": narrative.id,
                            "project_id": narrative.workspace,
                            "userId": userId
                        });
                        count++;
						return count !== 5;
					});



                    //populate the html template
                    var rows = ich.recent_narratives(data)
                    $('#recent_narratives_list').append(rows);

                    $("#narratives_loading").hide();



                } else {
                    $("#narratives_loading").hide();
                    $("#no_narratives").show();

                }
                
            }
        });
    };

    //populates the recent projects portion of the user home
	function loadRecentProjects() {
		$("#no_projects").hide();
        $("#projects_loading").show();
        project.get_projects({
            callback: function(projectresults) {
            	console.log("got here2");
                if (Object.keys(projectresults).length > 0) {
                    var data = { rows: []};

                    console.log("got here");
            
					//first sort
					results = _.sortBy(projectresults, function(project_id) {
					    return project_id.moddate;
					});
					results.reverse();
					
					//populate the data structure for the template
					var count = 0;
					_.every(projectresults, function(project_id){

						var name = project_id.id.replace(/_/g," ");

						data.rows.push({
                            "name": name,
                            "project_id": project_id.id
                            
                        });
                        count++;
						return count !== 5;
					});



                    //populate the html template
                    var rows = ich.recent_projects(data)
                    $('#recent_projects_list').append(rows);

                    $("#projects_loading").hide();

					var options = ich.project_select_options(data);
                    $('#new_narrative_project').append(options);


                } else {
                    $("#projects_loading").hide();
                    $("#no_projects").show();

                }
                
            }
        });
    };

	function showLoading() {
	//$('#login_form button[type="submit"]').attr('disabled','disabled');
	$("#loading-indicator").show();
	}

	function doneLoading() {
		$("#loading-indicator").hide();
	}

   //add click handler for creating new narrative
    $( "#new_narrative_submit" ).click(function() {
        var name = $("#new_narrative_name").val();
        var project_id = $("#new_narrative_project").val();

        //no spaces allowed in narrative name
        name = name.replace(/ /g,"_");
        name = name.replace(/\W/g,"");
        
        if (project_id === "") {
            project_id = undefined;
        }

        //create the new narrative in ws
        project.new_narrative({
            narrative_id: name, 
            project_id: project_id,
            callback: function(results) {
                console.log("narrative created.");
                //redirect to the narrative page
                var userId = $("#login-widget").kbaseLogin("get_kbase_cookie", "user_id");
                window.location.href = "http://narrative.kbase.us/narratives/"+userId+"/"+project_id+"."+name;
            }
        }); 
    });


})( jQuery );

