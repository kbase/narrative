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

        loadNarratives();
        loadDatasets(token, userId, true);
        loadProjects();
    };

    function loadNarratives() {
        // stub for now.
    };

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
                        objectMetaTable.push([
                            "<input type='checkbox' />",
                            allObjectsList[i][0], // id
                            allObjectsList[i][1], // type
                            allObjectsList[i][6], // owner
                                                  // shared with
                                                  // source
                                                  // created
                            allObjectsList[i][7], // (workspace)
                            allObjectsList[i][2]  // modified
                        ]);
                    }

                    $("#datasets_table").dataTable({
                        "bLengthChange" : false,
                        "iDisplayLength": 5,
                        "aaData" : objectMetaTable,
                        "aoColumns" : [
                            { "sTitle" : "&nbsp;" },
                            { "sTitle" : "ID" },
                            { "sTitle" : "Type" },
                            { "sTitle" : "Owner" },
                            { "sTitle" : "Location" },
                            { "sTitle" : "Last modified" },
                        ],
                        "sPaginationType" : "full_numbers",
                        "aaSorting" : [[1, "asc"]],
                        "aoColumnDefs" : [
                        ]
                    });
                    $("#datasets_loading").css({ 'display' : 'none' });

                });
            },

            clientError
        );
    };

    function loadProjects() {

    };

    function clientError(error) {
        console.debug(error);
    };

    /* Should get all workspace metadata as a big list and pass it to _callback */
    function getAllObjectMetadata(token, wsMetaList, _callback, _errorCallback) {

    };



})( jQuery );





// var login_url = "https://kbase.us/services/authorization/Sessions/Login/";
// var userData;


// var defaultUserData = {
//  active_content: $("#new_workspace"),
//  active_button: $("#workspace_button"),
//     auth_token: null,
    
// };


// /** checks to see if the user is authenticated */
// function checkUserAuth() {
    
//     //check to see if we still have authentication or not
//     var hasLocalStorage = false;

//  if (localStorage && localStorage !== null) {
//         hasLocalStorage = true;
//     }

//     if (hasLocalStorage && localStorage["auth_token"] !== undefined && localStorage["auth_token"] !== "null") {
//      userData = jQuery.extend(true, {}, defaultUserData);
//      userData.auth_token = localStorage["auth_token"];

//         var user_id = userData.auth_token.split("|")[0].split("=")[1];
           
//      $("#login_info span").text("Logged in as: " + user_id);
//      $("#login_info").show();
        
//      $("#login_section").hide();
//      $("#public_section").hide();
//      $("#newsfeed_column").show();
//      loadFeed();
//     } 
// }

// /** logs a user in */
// function login(user_id, password) {
//     var initializeUser = function (token) {
//      userData = jQuery.extend(true, {}, defaultUserData);
//      userData.auth_token = token;
           
//      $("#login_info span").text("Logged in as: " + user_id);
//      $("#login_info").show();

//      $("#login_section").hide();
//      $("#public_section").hide();
//      $("#newsfeed_column").show();
//      loadFeed();
//     };


//     var hasLocalStorage = false;

//  if (localStorage && localStorage !== null) {
//         hasLocalStorage = true;
//     }

//  var options = {
//      loginURL : login_url,
//      possibleFields : ['verified','name','opt_in','kbase_sessionid','token','groups','user_id','email','system_admin'],
//      fields : ['token', 'kbase_sessionid', 'user_id']
//  };

//  var args = { "user_id" : user_id, "password": password, "fields": options.fields.join(',')};
    
//  login_result = $.ajax({type: "POST",
//                        url: options.loginURL,
//                        data: args,
//                        beforeSend: function (xhr) {
//                                       showLoading();
//                                    },
//                        success: function(data, textStatus, jqXHR) {
//                                     if (hasLocalStorage) {
//                                         localStorage["auth_token"] = data.token;
//                                     }
//                                     console.log(textStatus);
//                                     initializeUser(data.token);
//                                 }, 
//                        error: function(jqXHR, textStatus, errorThrown) {
//                            console.log(errorThrown);
//                            //$('#login_form button[type="submit"]').removeAttr('disabled');
//                            $("#loading-indicator").hide();
//                            $("#login_error").html("There was a problem signing in: " + errorThrown);
//                            $("#login_error").show();
//                        },
//                        dataType: "json"});
// }

// /** shows an animated gif indicating things are loading */
// function showLoading() {
//  //$('#login_form button[type="submit"]').attr('disabled','disabled');
//  $("#loading-indicator").show();
// }

// function logout() {

//     var hasLocalStorage = false;

//  if (localStorage && localStorage !== null) {
//         hasLocalStorage = true;
//     }

//     if (hasLocalStorage) {
//         localStorage.clear();
//     }
    
//     userData = null;
//  $("#login_info").hide();
//  $("#newsfeed_column").hide()    
//     $("#login_section").show();
//  $("#public_section").show();

    
//  location.reload(); 
// }


// $(document).ready(function(){
//  checkUserAuth();
//  //check_login(assertions_data);
// });

// /*** feed */
// function loadFeed () {
//  var workspaceURL = "https://www.kbase.us/services/workspace",

//  wsClient = new workspaceService(workspaceURL);
//  var hasLocalStorage = false;
//  if (localStorage && localStorage !== null) {
//         hasLocalStorage = true;
//     }

//  //get auth token
//  if (hasLocalStorage && localStorage["auth_token"] !== undefined && localStorage["auth_token"] !== "null") {
        
//      userData = jQuery.extend(true, {}, defaultUserData);
//      userData.auth_token = localStorage["auth_token"];
//      var user_id = userData.auth_token.split("|")[0].split("=")[1];
    
//      wsClient.list_workspaces_async({ auth: userData.auth_token }, 
//              function(results) {
//                  var data = { rows: []};
//                  var count = 0;
                    
//                  //first sort
//                  results = _.sortBy(results, function(ws) {
//                      return ws[2];
//                  });
//                  results.reverse();
                    
//                  //populate the data structure for the template
//                  _.every(results, function(workspace){

//                      if (user_id != workspace[1]) {
//                          data.rows.push({
//                              "username": workspace[1],
//                              "workspace": workspace[0],
//                              "date": workspace[2]
//                          });     
//                          count++;
//                      }
//                      return count !== 10;
//                  });

//                  //call the template
//                  rows = ich.workspaces(data)
//                  $('#people_feed').append(rows);
//                  $('#loading-indicator-ws').hide();

                    
//              },

//              function(err) {
//                  console.log(err);
//              }
//      );
//  }   
// }

