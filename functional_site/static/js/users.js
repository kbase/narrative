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
    	console.debug("Not logged in");
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

        if (!userName) {
            console.warn("No user name found");
            userName = "KBase User";
        }
        else {
            console.debug("user name = " + userName);
        }
        $("#kb_name").html(userName);

        loadProjectFeed(token, userId);
        loadRecentNarratives();
        loadRecentProjects();

    };


    /** Get current user id */
    function _user_id() {
        return $("#login-widget").kbaseLogin("get_kbase_cookie", "user_id");
    }
    /** Get current token */
    function _token() {
        return $("#login-widget").kbaseLogin("token");
    }

    function clientError(error) {
        console.debug(error);
    };

    // feed 
	function loadProjectFeed (token, userId) {
		var workspaceURL = "https://www.kbase.us/services/workspace",

		wsClient = new workspaceService(workspaceURL);


		//get auth token
		if (token !== "null") {
			wsClient.list_workspaces({ auth: token }, 
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
                                var row = {username: workspace[1], 
                                    workspace: workspace[0], date: moddate};
								data.rows.push(row);
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

    /** Make a workspace array into a mapping */
    function _ws_arr2obj(arr) {
        var obj = {}, fld = project.obj_meta_fields;
        for (i=0; i < fld.length; i++) {
            obj[fld[i]] = arr[i];
        }
        return obj;
    }

    /**
     * Get all objects in home workspace that satisfy 'params'.
     *
     * @return mapping, keyed by object id.
     */
    function getHomeWorkspaceObjects(params, callback) {
        var home = _user_id() + '_home';
        $.extend(params, {auth: _token(), workspace: home});
        //console.debug("list_workspace_objects, params=", params);
        project.ws_client.list_workspace_objects(params,
            function(obj_list) {
                var result = {};
                //console.debug("Obj list=",obj_list);
                $.each(obj_list, function(idx, val) {
                    //console.debug("Home workspace narrative at " + idx + ":", val);
                    var obj_meta = _ws_arr2obj(val);
                    result[obj_meta.id] = obj_meta;
                });
                callback(result);
            },
            function() {
                var args = [].slice.call(arguments);
                console.warn("Error getting home workspace objects. ", args);
                callback({});
            }
        );
    };

	/** 
     * Loads data and populates the recent narratives section of the user home page.
     *
     * Calls:
     *    project.get_narratives(), to load narratives in a project
     *    getHomeWorkspaceObjects(), to add narratives from the user's home ws
     *    _showRecentNarratives(), when done loading, to show the results
     */
	function loadRecentNarratives() {
        // show user that we are loading
		$("#no_narratives").hide();
        $("#narratives_loading").show();
        // get the data & then show it
        project.get_narratives({
            callback: function(results) {
                console.debug("Project narratives:", results);
                // augment project narratives with user's home objects
                getHomeWorkspaceObjects({type: project.narrative_type},
                    function(home_narr) {
                        $.extend(results, home_narr);
                        console.debug("Project + home narratives:", results);
                        // show combined results
                        if (Object.keys(results).length > 0) {
                            console.debug("Show recent narratives");
                            _showRecentNarratives(results);
                        }
                        // no data? show that, too
                        else {
                            $("#no_narratives").show();
                        }
                        $("#narratives_loading").hide();
                    }
                );
            }
        });
    }

    /**
     * Update HTML to show >0 recent narratives.
     *
     * @pre results is non-empty
     * @return undefined
     */
    function _showRecentNarratives(results) {
        var userId = _user_id();

		// make a list that can be sorted
        //console.debug("results:", results);
        var indexed = [];
        _.each(Object.keys(results), function(key, i, lst) {
            indexed.push({'id': results[key].id, 'date': results[key].moddate});
        });
        //console.debug("indexed:",indexed);
        // sort the list by the date
		indexed = _.sortBy(indexed, 'date');
        indexed.reverse();

        // build data from first <= 5 items in the sorted list
        var rows = [], n = indexed.length;
        var limit = _.min([n, 5]);
        for (var i=0; i < limit; i++) {
            var narr = results[indexed[i].id];
            var name = narr.id.replace(/_/g," ");
            //var project_id = narrative.workspace.replace(/_/g," ");
            rows.push({
                "name": name,
                "narrative_id": narr.id,
                "project_id": narr.workspace,
                "userId": userId
            });
		}

        //populate the html template
        var rows2 = ich.recent_narratives({'rows': rows});
        $('#recent_narratives_list').append(rows2);
    }

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

