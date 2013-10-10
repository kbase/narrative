(function($, undefined) {
    var workspaceURL = "https://kbase.us/services/workspace";
    var workspaceClient = new workspaceService(workspaceURL);

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
                loadFeed();
            },

            logout_callback: function(args) {
                window.location.href="./home.shtml";
            },

            prior_login_callback: function(args) {
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

                    $("#projects_loading").hide();

                } else {
                    $("#projects_loading").hide();
                    $("#no_projects").show();
                }
                
            }
        });

    };

    

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
                        }

                        if (permission !== 'n') { 
                            data.users.push(user_data);
                        }
            
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

        var users_perms = {};


        //get all the permissions for all the users
        $("#user_"+project_id+"_rows tr").each(function() {

            var permission = $(this).find(".inline_permission :selected").val();
            var username = $(this).find(".inline_username").val();

            console.log(permission + " is perm " + username);
            users_perms[username] = permission;
        });

        //save the permissions for the project
        project.get_project_perms({
            project_id: project_id,
            perms: users_perms,
            callback: function(results) {
                console.log("saved permissions");
            },
            error_callback: function(results) {
                console.log("error saving");
            }
        }); 

    }



    $("#create_narrative_link").click(function() {
        $("#new_narrative_button").click();
    });
    
    //add click handler for creating new project
    $( "#create_project" ).click(function() {
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
                $("#success_message").append("You have successfully create the project \"" + clean_name + "\"");
                $("#success_message").show();

            }
        }); 
    });

    //click handler to dismiss the error and success messages
    $(".close").click(function(e) {
        $(e.target).parent().hide();
    });


})( jQuery );


