(function($, undefined) {
    var workspaceURL = "https://kbase.us/services/workspace";
    var workspaceClient = new workspaceService(workspaceURL);

    // Function that sets a cookie compatible with the current narrative
    // (it expects to find user_id and token in the cookie)
    var set_cookie = function() {
        var c = $("#login-widget").kbaseLogin('get_kbase_cookie');
        console.log( 'Setting kbase_session cookie');
        $.cookie('kbase_session',
                 'un=' + c.user_id
                 + '|'
                 + 'kbase_sessionid=' + c.kbase_sessionid
                 + '|'
                 + 'user_id=' + c.user_id
                 + '|'
                 + 'token=' + c.token.replace(/=/g, 'EQUALSSIGN').replace(/\|/g,'PIPESIGN'),
                 { path: '/',
                   domain: 'kbase.us' });
        $.cookie('kbase_session',
                 'un=' + c.user_id
                 + '|'
                 + 'kbase_sessionid=' + c.kbase_sessionid
                 + '|'
                 + 'user_id=' + c.user_id
                 + '|'
                 + 'token=' + c.token.replace(/=/g, 'EQUALSSIGN').replace(/\|/g,'PIPESIGN'),
                 { path: '/'});
    };

    $(function() {
        $(document).on('loggedIn.kbase', function(event, token) {
            console.debug("logged in")
        });

        $(document).on('loggedOut.kbase', function(event, token) {
            console.debug("logged out")
        });

        var loginWidget = $("#login-widget").kbaseLogin({ 
            style: "narrative",
            rePrompt: false,

            login_callback: function(args) {
		set_cookie();
                loadFeed();
            },

            logout_callback: function(args) {
                window.location.href="./home.shtml";
            },

            prior_login_callback: function(args) {
		set_cookie();
                loadFeed();
            },
        });
    });

    function loadFeed() {
        var token = $("#login-widget").kbaseLogin("token");
        var userId = $("#login-widget").kbaseLogin("get_kbase_cookie", "user_id");
        var userName = $("#login-widget").kbaseLogin("get_kbase_cookie", "name");

        if (!userName)
            userName = "KBase User";
        $("#kb_name").html(userName);

        //loadNarratives();
        //loadDatasets(token, userId, true);
        loadProjects();
    };


    function loadProjects() {
        $("#projects_loading").show();
        var projects = project.get_projects({
            callback: function(results) {
                if (Object.keys(results).length > 0) {
                    var data = { projects: []};
                    _.each(results, function(workspace){

                        var name = workspace.id.replace(/_/g," ");

                        data.projects.push({
                            "project_name": name,
                            "project_id": workspace.id,
                        });
                        
                    });

                    //populate the html template
                    var rows = ich.project_list(data)
                    $('#project_area').append(rows);


                    //make the accordions work
                    $("[id^=collapse_]").on('hide.bs.collapse', function(e) {
                            toggleChevron(e);
                        });
                    $("[id^=collapse_]").on('show.bs.collapse', function(e) {
                            toggleChevron(e);
                            loadProjectUsers($(e.target).attr('id').replace(/^collapse_/, ""));
                        });

                    //add event handler for the add new user button
                    $(".add_new_user").click(function(e) {
                        addUser(e);
                    });

                    //add click handlers for success/error messages
                    $(".close").click(function(e) {
                        $(e.target).parent().hide();
                    });

                    $("#projects_loading").hide();

                } else {
                    $("#projects_loading").hide();
                    $("#no_projects").show();
                }
                
            }
        });

    };

    //adds a new user/permission for a project
    function addUser(e) {

        $("#success_message_"+project_id).hide();
        $("#error_message_"+project_id).hide();

        
        //get the form elements
        var form = $(e.target).parent().parent();
        var new_user = $(form).find(".new_username").val();
        var project_id = $(form).find(".new_user_project").val();
        var new_perm = $(form).find(".new_permlevel :selected").val();

        $("#adding_user_"+project_id).show();

        console.log(new_user + " " + new_perm + " " + project_id);

        var users_perms = {};
        users_perms[new_user] = new_perm;
     
        //get all the other permission, since the set params needs the full list
        $("#user_"+project_id+"_rows tr").each(function() {

            var permission = $(this).find(".inline_permission :selected").val();
            var username = $(this).find(".inline_username").val();

            console.log(permission + " is perm " + username);
            users_perms[username] = permission;
        });

        //save the permissions for the project
        project.set_project_perms({
            project_id: project_id,
            perms: users_perms,
            callback: function(results) {

                //add the new user to the table
                var data = { users: []};
                var user_data = {
                    "username" : new_user,
                    "project_id" : project_id,
                };

                if (new_perm === 'r') {
                    user_data.selectedread = "selected=selected";
                } else if (new_perm === 'a') {
                    user_data.selectedadmin = "selected=selected";
                } else if (new_perm === 'w') {
                    user_data.selectedwrite = "selected=selected";
                } else if (new_perm === 'n') {
                    user_data.selectednone = "selected=selected";
                }

                data.users.push(user_data);
                        
                //populate the html template
                var rows = ich.user_row(data)
                $("#user_"+project_id+"_rows").append(rows);

                //add a handler for saving the permissions for each user
                $(".inlinePermissionUpdate").click(function(e) {
                    saveUserPermission(e);
                });


                $("#success_message_"+project_id+" span").html("You have successfully added user permissions.");
                $("#success_message_"+project_id).show();
            },
            error_callback: function(results) {
                $("#error_message_"+project_id+" span").html("An error occurred while adding user permissions.");
                $("#error_message_"+project_id).show();
            }
        }); 

        $(form).find(".new_username").val("");
        $("#adding_user_"+project_id).hide();

    }

    
    //load all the user/permissions for a project
    function loadProjectUsers(project_id) {
        $("#users_"+project_id+"_loading").show();
        var projects = project.get_project_perms({
            project_id: project_id,
            callback: function(results) {
                if (Object.keys(results).length > 0) {
                    var data = { users: []};
                    _.each(results, function(permission, username){
                        var user_data = {
                            "username" : username,
                            "project_id" : project_id,
                        };

                        if (permission === 'r') {
                            user_data.selectedread = "selected=selected";
                        } else if (permission === 'a') {
                            user_data.selectedadmin = "selected=selected";
                        } else if (permission === 'w') {
                            user_data.selectedwrite = "selected=selected";
                        } else if (permission === 'n') {
                            user_data.selectednone = "selected=selected";
                        }

                        data.users.push(user_data);
                        
            
                    });

                    //populate the html template
                    var rows = ich.user_row(data)
                    $("#user_"+project_id+"_rows").html(rows);

                    $("#users_"+project_id+"_loading").hide();

                    //add a handler for saving the permissions for each user
                    $(".inlinePermissionUpdate").click(function(e) {
                        saveUserPermission(e);
                    });



                } else {
                    $("#users_"+project_id+"_loading").hide();
                    $("#no_"+project_id+"_users").show();
                }
                
            },
            error_callback: function(results) {
                $("#users_"+project_id+"_loading").hide();
                $("#no_"+project_id+"_users").show();
            }
        });

    };




    function clientError(error) {
        console.debug(error);
    };



    /* toggles the chevron glyph */
    function toggleChevron(e) {
        $(e.target)
            .prev('.accordion-heading')
            .find('span')
            .toggleClass('glyphicon-chevron-down glyphicon-chevron-right');
    }

    /* saves permission for a particular user/project */
    function saveUserPermission(e) {
        var trid = $(e.target).parent().parent();
        var project_id = $(trid).find(".inline_project").val();

        $("#success_message_"+project_id).hide();
        $("#error_message_"+project_id).hide();

        var users_perms = {};


        //get all the permissions for all the users
        $("#user_"+project_id+"_rows tr").each(function() {

            var permission = $(this).find(".inline_permission :selected").val();
            var username = $(this).find(".inline_username").val();

            users_perms[username] = permission;
        });

        //save the permissions for the project
        project.set_project_perms({
            project_id: project_id,
            perms: users_perms,
            callback: function(results) {
                $("#success_message_"+project_id + " span").html("You have successfully changed user permissions.");
                $("#success_message_"+project_id).show();
                    
            },
            error_callback: function(results) {
                $("#error_message_"+project_id + " span").html("An error occurred changing user permissions.");
                $("#error_message_"+project_id).show();
            }
        }); 

    }



    $("#create_narrative_link").click(function() {
        $("#new_narrative_button").click();
    });
    
    //add click handler for creating new project
    $( "#create_project" ).click(function() {
        $("#success_message").hide();
        var name = $("#projectname").val();

        //no spaces allowed in project name
        name = name.replace(/ /g,"_");
        name = name.replace(/\W/g,"");
        

        //create the new project in ws
        project.new_project({
            project_id: name,
            callback: function(results) {
                console.log("project created.");
                var clean_name = name.replace(/_/g, " ");
                $("#projectname").val("");
                $("#success_message span").html("You have successfully create the project \"" + clean_name + "\"");
                $("#success_message").show();

            }
        }); 
    });

    //click handler to dismiss the error and success messages
    $(".close").click(function(e) {
        $(e.target).parent().hide();
    });


})( jQuery );


