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

        loadNarratives();
        loadDatasets(token, userId, true);
        loadProjects();
    };

    function loadNarratives() {
        $("#narratives_loading").show();
        //project.get_narratives({
            //callback: function(results) {
        getAllNarratives(function(results) {
            var data = { rows: []};
            var userId = $("#login-widget").kbaseLogin("get_kbase_cookie", "user_id");
            console.debug("all narr (" + typeof results + ")",results);

            _.each(Object.keys(results), function(objid) {

                var narrative = results[objid];
                console.debug("narrative",narrative);

                var name = narrative.id.replace(/_/g," ");
                var project_name = narrative.workspace.replace(/_/g," ");


                /*_.each(Object.keys(narrative), function(key) {
                    console.log(key);
                });*/

                var moddate = narrative.moddate;
                moddate = moddate.replace(/T/g," ");

                var curdata = {
                    "name": name,
                    "narrative_id": narrative.id,
                    "owner": narrative.owner,
                    "date": moddate,
                    "project_id": narrative.workspace,
                    "project_name": project_name,
                    "userId": userId
                };

                //get the users for the narrative, by the workspace id
                project.get_project_perms({
                    project_id: narrative.workspace,
                    callback: function(results) {
                        var user_list = formatUsers(results);
                        $("#"+narrative.workspace+"-"+narrative.id+"_users").html(user_list);
                    }
                });

                
                data.rows.push(curdata);
    
            });

            //populate the html template
            $("#narrative_table_header").show();
            var rows = ich.narrative_table_rows(data)
            $('#narrative_table_rows').append(rows);

            $("#narratives_loading").hide();

            //make into a datatable
            oTable3 = $('#narratives_table').dataTable( {
                "bLengthChange" : false,
                "iDisplayLength": 5,
                    "sPaginationType" : "full_numbers",
                    "aaSorting" : [[1, "asc"]],
                    "aoColumnDefs" : [
                    ]
            } );
            // } else {
            //     $("#narratives_loading").hide();
            //     $("#no_narratives").show();

            // }                            
        },
        function() {
            $("#narratives_loading").hide();
            $("#no_narratives").show();
        });
    }

    function loadDatasets(token, userId, onlyOwned) {

        /**
         * Flow:
         * 1. Get all workspaces the user has access to.
         * 1a. Filter for ws that the user owns. (optional?)
         * 2. Do a list objects on all of them to get metadata.
         * 3. Munge that into a table.
         * 4. Go home and sleep.
         */

        $("#datasets_loading").css({ 'display' : '' });
        workspaceClient.list_workspaces({ auth: token },
            function(wsMetaList) {
                if (onlyOwned) {
                    var ownedList = [];
                    for (var i=0; i<wsMetaList.length; i++) {
                        if (wsMetaList[i][1] === userId)
                        ownedList.push(wsMetaList[i]);
                    }
                    wsMetaList = ownedList;
                }

                var allObjectsList = [];

                var getWorkspaceObjects = [], i, len;
                for (var i=0; i<wsMetaList.length; i++) {
                    getWorkspaceObjects.push(workspaceClient.list_workspace_objects(
                        {
                            workspace: wsMetaList[i][0],
                            auth: token
                        },
                        function(objectList) {
                            allObjectsList = allObjectsList.concat(objectList);
                        },
                        clientError
                    ));
                }

                $.when.apply($, getWorkspaceObjects).done(function() {
                    var objectMetaTable = [];
                    for (var i=0; i<allObjectsList.length; i++) {
                        var type = allObjectsList[i][1];
                        if (type === "Narrative") { 
                            continue;
                        } else if (type === "workspace_meta") {
                            continue;
                        } else {
                            var moddate = allObjectsList[i][2];
                            moddate = moddate.replace(/T/g," ");
                            objectMetaTable.push([
                                "<input type='checkbox' />",
                                allObjectsList[i][0], // id
                                allObjectsList[i][1], // type
                                allObjectsList[i][6], // owner
                                                      // shared with
                                                      // source
                                                      // created
                                allObjectsList[i][7], // (workspace)
                                moddate  // modified
                            ]);
                        }
                    }

                    if (objectMetaTable.length > 0) {

                        $("#datasets_table").dataTable({
                            "bLengthChange" : false,
                            "iDisplayLength": 5,
                            "aaData" : objectMetaTable,
                            "aoColumns" : [
                                { "sTitle" : "&nbsp;" },
                                { "sTitle" : "ID" },
                                { "sTitle" : "Type" },
                                { "sTitle" : "Owner" },
                                { "sTitle" : "In Projects" },
                                { "sTitle" : "Last modified" },
                            ],
                            "sPaginationType" : "full_numbers",
                            "aaSorting" : [[1, "asc"]],
                            "aoColumnDefs" : [
                            ]
                        });
                    } else {
                        $("#no_datasets").show();
                    }
                    $("#datasets_loading").css({ 'display' : 'none' });

                });
            },

            clientError
        );
    };

    function loadProjects() {
        $("#projects_loading").show();
        var projects = project.get_projects({
            callback: function(results) {
                if (Object.keys(results).length > 0) {
                    var data = { rows: []};
                    _.each(results, function(workspace){
                        
                        var name = workspace.id.replace(/_/g," ");

                        var moddate = workspace.moddate;
                        moddate = moddate.replace(/T/g," ");
                        var curdata = {
                            "name": name,
                            "project_id": workspace.id,
                            "owner": workspace.owner,
                            "date": moddate
                        };
                        

                        //get the users for the narrative, by the workspace id
                        project.get_project_perms({
                            project_id: workspace.id,
                            callback: function(results) {
                                var users_list = formatUsers(results);
                                
                                $("#"+workspace.id+"_users").html(users_list);

                            }
                        });
                        data.rows.push(curdata);
            


                    });

                    //populate the html template
                    $("#project_table_header").show();
                    var rows = ich.project_table_rows(data)
                    $('#projectTableRows').append(rows);

                    $("#projects_loading").hide();

                    //make into a datatable
                    oTable3 = $('#projects_table').dataTable( {
                        "bLengthChange" : false,
                            "iDisplayLength": 5,
                            "sPaginationType" : "full_numbers",
                            "aaSorting" : [[1, "asc"]],
                            "aoColumnDefs" : [
                            ]
                    } );

                    //load the dropdown menu for the new narrative dialog box
                    var options = ich.project_select_options(data);
                    $('#new_narrative_project').append(options);
                    


                } else {
                    $("#projects_loading").hide();
                    $("#no_projects").show();
                }
                
            }
        });

    };




    function clientError(error) {
        console.debug(error);
    };

    /* Should get all workspace metadata as a big list and pass it to _callback */
    function getAllObjectMetadata(token, wsMetaList, _callback, _errorCallback) {

    };


    /* toggles the chevron glyph */
    function toggleChevron(e) {
        $(e.target)
            .prev('.section_title')
            .find('span')
            .toggleClass('glyphicon-chevron-down glyphicon-chevron-right');
    }


    $('#narratives_container').on('hidden.bs.collapse', toggleChevron);
    $('#narratives_container').on('shown.bs.collapse', toggleChevron);
    $('#datasets_container').on('hidden.bs.collapse', toggleChevron);
    $('#datasets_container').on('shown.bs.collapse', toggleChevron);
    $('#projects_container').on('hidden.bs.collapse', toggleChevron);
    $('#projects_container').on('shown.bs.collapse', toggleChevron);

    $("#create_narrative_link").click(function() {
        $("#new_narrative_button").click();
    });
    
    //add click handler for creating new narrative
    $( "#new_narrative_submit" ).click(function() {
        var name = $("#new_narrative_name").val();
        var project_id = $("#new_narrative_project").val();

        //no spaces allowed in narrative name
        name = name.replace(/ /g,"_");
        name = name.replace(/\W/g,"");

        if(name == "") name = "Untitled";
        
        if (project_id === "") {
            project_id = undefined;
        }


        //create the new narrative in ws
        project.new_narrative({
            narrative_id: name, 
            project_id: project_id,
            callback: function(results) {
                //redirect to the narrative page
                var userId = $("#login-widget").kbaseLogin("get_kbase_cookie", "user_id");
                window.location.href = "http://127.0.0.1:8888/"+userId+"_"+project_id+"."+name;
            }
        }); 
        
    });

    //formats a hash of user params to a user list
    function formatUsers(results) {
        var users = "";
        var userId = $("#login-widget").kbaseLogin("get_kbase_cookie", "user_id");

        if (Object.keys(results).length > 0) {
            
            _.each(results, function(permission, username){
                if ((permission === "a") || (permission === "w")  || (permission === "r")) {
                    if ((username !== "default") && (username != userId)) {
                        users += username + ", ";
                    }
                } 
            });

            users = users.replace(/, $/, "");

        } 
        return users;
    }

    /* ============== copied from users.js ================================ */
    /* XXX: need a COMMON LIBRARY for these kinds of funcs */
    /* XXX: I mean, seriously, cut and paste?? this is an abomination */

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
     * Get all narratives for this user.
     *
     * @param show_results_cb - Called with object containing results.
     * @param no_results_cb - Called if no results
     */
    function getAllNarratives(show_results_cb, no_results_cb) {
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
                            show_results_cb(results);
                        }
                        // no data? show that, too
                        else {
                            no_results_cb();
                        }
                    }
                );
            }
        });        
    }

    /** Make a workspace array into a mapping */
    function _ws_arr2obj(arr) {
        var obj = {}, fld = project.obj_meta_fields;
        for (i=0; i < fld.length; i++) {
            obj[fld[i]] = arr[i];
        }
        return obj;
    }

        /** Get current user id */
    function _user_id() {
        return $("#login-widget").kbaseLogin("get_kbase_cookie", "user_id");
    }
    /** Get current token */
    function _token() {
        return $("#login-widget").kbaseLogin("token");
    }

    /* ==================================================================== */



})( jQuery );


