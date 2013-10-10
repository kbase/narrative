(function($, undefined) {
    var workspaceURL = "https://kbase.us/services/workspace";
    var workspaceClient = new workspaceService(workspaceURL);

    //get the project_id 
    var project_id = window.location.hash.substr(1);
    if (project_id !== "") {

        var project_name = project_id.replace(/_/g," ");
        $("#project_name").html(project_name);
        $("#project_id_option").val(project_id);
        $("#project_id_option").html(project_name);
    

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
                    loadFeed(project_id);
                },
            });
        });

    } else { //no project id
        window.location.href="./datastore.shtml";
    }

    function loadFeed(project_id) {
        var token = $("#login-widget").kbaseLogin("token");
        var userId = $("#login-widget").kbaseLogin("get_kbase_cookie", "user_id");
        var userName = $("#login-widget").kbaseLogin("get_kbase_cookie", "name");

        if (!userName)
            userName = "KBase User";
        $("#kb_name").html(userName);

        loadNarratives(project_id);
        loadDatasets(project_id, token, userId, true);
    };

    function loadNarratives(project_id) {
        $("#narratives_loading").show();
        project.get_narratives({
            project_ids: [project_id],
            callback: function(results) {
                if (Object.keys(results).length > 0) {
                    var data = { rows: []};
                    var userId = $("#login-widget").kbaseLogin("get_kbase_cookie", "user_id");

                    _.each(results, function(narrative){
                        
                        var name = narrative.id.replace(/_/g," ");
                        var project_name = narrative.workspace.replace(/_/g," ");

                        _.each(Object.keys(narrative), function(key) {
                            console.log(key);
                        });

                        var moddate = narrative.moddate;
                        moddate = moddate.replace(/T/g," ");
                        data.rows.push({
                            "name": name,
                            "narrative_id": narrative.id,
                            "owner": narrative.owner,
                            "date": moddate,
                            "project_name": project_name,
                            "project_id": narrative.workspace,
                            "userId": userId
                        });
            
                    });

                    //populate the html template
                    $("#narrative_table_header").show();
                    var rows = ich.narrative_table_rows(data)
                    $('#narrative_table_rows').append(rows);

                    $("#narratives_loading").hide();

                    //make into a datatable
                    oTable3 = $('#narratives_table').dataTable( {
                        "bLengthChange" : false,
                            "sPaginationType" : "full_numbers",
                            "aaSorting" : [[1, "asc"]],
                            "aoColumnDefs" : [
                            ]
                    } );


                } else {
                    $("#narratives_loading").hide();
                    $("#no_narratives").show();

                }
                
            }
        });
    };

    function loadDatasets(project_id, token, userId, onlyOwned) {

        /**
         * Flow:
         * 1. Get all workspaces the user has access to.
         * 1a. Filter for ws that the user owns. (optional?)
         * 2. Do a list objects on all of them to get metadata.
         * 3. Munge that into a table.
         * 4. Go home and sleep.
         */

        $("#datasets_loading").css({ 'display' : '' });
        

        var allObjectsList = [];

        var getWorkspaceObjects = [], i, len;
        getWorkspaceObjects.push(workspaceClient.list_workspace_objects(
            {
                workspace: project_id,
                auth: token
            },
            function(objectList) {
                allObjectsList = allObjectsList.concat(objectList);
            },
            clientError
        ));
        

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
            
        
    };





    function clientError(error) {
        console.debug(error);
    };

    /* Should get all workspace metadata as a big list and pass it to _callback */
    function getAllObjectMetadata(token, wsMetaList, _callback, _errorCallback) {

    };


    /* toggles the chevron glyph */
    function toggleChevron(e) {
        console.log(e.target);
        $(e.target)
            .prev('.section_title')
            .find('span')
            .toggleClass('glyphicon-chevron-down glyphicon-chevron-right');
    }


    $('#narratives_container').on('hidden.bs.collapse', toggleChevron);
    $('#narratives_container').on('shown.bs.collapse', toggleChevron);
    $('#datasets_container').on('hidden.bs.collapse', toggleChevron);
    $('#datasets_container').on('shown.bs.collapse', toggleChevron);
  
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


