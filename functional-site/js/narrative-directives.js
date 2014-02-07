
/*
 *  Directives
 *  
 *  These can be thought of as the 'widgets' on a page.  
 *  Scope comes from the controllers.
 *
*/


var narrativeDirectives = angular.module('narrative-directives', []);
angular.module('narrative-directives')
    .directive('recentnarratives', function($location) {
        return {
            link: function(scope, element, attrs) {
                $(element).loading()

                scope.loadRecentNarratives = function() {
                    var p = kb.nar.get_narratives();
                    $.when(p).done(function(results){
                        $(element).rmLoading();

                        var narratives = [];

                        if (results.length > 0) {
                            for (var i in results) {
                                var nar = {};
                                nar.id = results[i][0];
                                nar.name = results[i][1];
                                nar.wsid = results[i][6]
                                nar.ws = results[i][7];

                                nar.timestamp = getTimestamp(results[i][3]);
                                nar.nealtime = formateDate(nar.timestamp) 
                                                ? formateDate(nar.timestamp) : results[i][3].replace('T',' ').split('+')[0];
                                narratives.push(nar);
                            }

                            scope.$apply(function() {
                                scope.narratives = narratives;
                            })
                        } else {
                            $(element).append('no narratives');
                        }
                    });
                }

                scope.loadRecentNarratives();
               
		
            }  /* end link */
        };
    })

    .directive('recentprojects', function($location) {
        return {
            link: function(scope, element, attrs) {

                scope.loadRecentProjects= function() {
                    $(element).loading();
                    var prom = kb.nar.get_projects();
                    $.when(prom).done(function(projs){

                        $(element).rmLoading();
                        if (projs.length > 0) {
                            var projects = []
                            //first sort
                            for (var i in projs) {
                                var project = {};
                                project.timestamp = getTimestamp(projs[i][3]); // moddate to timestamp
                                if (!project.timestamp) continue; //fixme
                                project.nealtime = formateDate(project.timestamp) 
                                                    ? formateDate(project.timestamp) : 
                                                        projs[i][3].replace('T',' ').split('+')[0];
                                project.name = parse_name(projs[i][7]); 
                                projects.push(project)
                            }

                            scope.$apply(function() {
                                scope.projects = projects;
                            })

                        } else {
                            $(element).append('no projects')
                        }
                    })
                }

                scope.loadRecentProjects();
            }

        };
    })


    .directive('projectlist', function($location) {
        return {
            templateUrl: 'partials/narrative/project_table.html',
            link: function(scope, element, attrs) {
                //fixme: temporary
                var help_text = "<b>Projects</b> hold assets that can be shared by members. Project members\-the people who have permission to use the project\'s assets\—can be individuals or teams. You set permissions for all assets shared in the project, but you can set additional permissions on any individual asset."+
                                '<br>\
                                <br>\
                                <b>Narratives</b> capture your analyses and include rich annotations, visualizations widgets, reusable workflows, and custom scripts. Through projects, a special type of workspace, you can share your narratives and data with colleagues.'
                $('.project-help').popover({html: true, trigger: 'hover', 
                                        content: help_text, placement:'bottom'}) 


                // global variables
                var tableId = 'project-table';
                var table;


                // this "api" method loads the project/narrative table; 
                scope.loadProjectList = function() {
                    //tableEle.remove();

                    // if datatable already exists, clear it
                    if (table) {
                        $('#'+tableId).dataTable().fnClearTable();
                    }

                    // get all projects
                    var proj_ids = [];
                    $(element).loading();
                    var p = kb.nar.get_projects()
                    $.when(p).done(function(projs){
                        var projects = [];

                        for (var key in projs) {
                            proj_ids.push(projs[key][7]); // project is a workspace, this is the workspace name
                        }

                        // get narratives for each projectr //fixme: optimize
                        getNarratives(proj_ids);
                    })

                }

                scope.loadProjectList();


                function getNarratives(proj_ids) {
                    var prom = kb.nar.get_narratives({project_ids:proj_ids})
                    $.when(prom).done(function(nars){
                        $(element).rmLoading();                                
                        //var narratives = nars.slice(0); // make copy of narratives

                        var narratives = []

                        var nar_projs = []
                        for (var i in nars) {
                            var nar_dict = {}   

                            var nar = nars[i];
                            var nar_id = nar[1];
                            var proj = nar[7]; // projects are workspaces right now

                            nar_dict.id = '<a href="'+scope.nar_url+'/ws.'
                                        +nar[6]+'.obj.'+nar[0]+'" >'+nar_id+'</a>';
                            // projects are workspaces right now
                            console.log(proj)
                            nar_dict.project = '<span class="proj-link" data-proj="'+proj+'"><span class="caret"></span>\
                                             Project <b>'+parse_name(proj)+'</b></span>';
                            nar_dict.owner = nar[5];


                            var tstamp = getTimestamp(nar[3]);
                            nar_dict.timestamp = tstamp;
                            nar_dict.moddate = formateDate(tstamp) ? 
                                    formateDate(tstamp) : nar[3].replace('T',' ').split('+')[0];


                            //nar.moddate = nar.moddate
                            nar_dict.deleteButton = '<span data-proj="'+proj+'" data-nar="'+nar_id+'" \
                                                class="glyphicon glyphicon-trash btn-delete-narrative"></span>';

                            //fixme: wow!  This is horrible.
                            nar_dict.users = '<span id="'+ proj+"-"+nar_id+'_users" >loading...</span>';
                            //addUserColumn(proj, nar_id)

                            narratives.push(nar_dict)
                            nar_projs.push(proj)
                        }


                        // if project is empty, add to empty_projects.
                        var empty_projects = []
                        for (var i in proj_ids) {
                            if (nar_projs.indexOf(proj_ids[i]) == -1) {
                                //empty_projects.push(proj_ids[i])
                                narratives.push({project: '<span class="proj-link" data-proj="'+proj_ids[i]+'">\
                                                            <span class="caret"></span> Project <b>'+parse_name(proj_ids[i])+'</b>\
                                                           </span>',
                                                id: '<span class="text-muted">Empty Project</span>', 
                                                owner: '', moddate: '', users: '', deleteButton: '', timestamp: ''})
                            }
                        }

                        buildTable(narratives);               
                    })

                }


                function addUserColumn(ws, id) {
                    var prom = kb.nar.get_project_perms({project_id: ws});
                    $.when(prom).done(function(results) {
                        var user_list = formatUsers(results);
                        $("#"+ws+"-"+id+"_users").html(user_list);
                    })
                }

                function formatUsers(perms) {

                    var users = []
                    for (var user in perms) {
                        if (user == '~global' || user == USER_ID) continue;
                        users.push(user);
                    }

                    return users.join(', ');
                }


                function buildTable(narratives) {
                        // reinstantiate fixed header, if one already exists in dom
                        if (table) {
                            table.fnAddData(narratives)
                        } else {

                            var tableSettings = {
                                "sPaginationType": "bootstrap",
                                //"sPaginationType": "full_numbers",
                                "iDisplayLength": 200,
                                //"aaData": [],
                                "fnDrawCallback": events,
                                bLengthChange: false,
                                "bInfo": false,
                                "aaSorting": [[ 4, "desc" ]],
                              "aoColumns": [
                                  { "sTitle": "Name", "mData": "id"},
                                  { "sTitle": "Owner", "mData": "owner"},
                                  { "sTitle": "Project", "mData": "project"},  // grouped by this column
                                  { "sTitle": "Shared With", "mData": "users", 'bVisible': false},
                                  { "sTitle": "Last Modified", "mData": "moddate", "iDataSort": 6},
                                  (USER_ID ? { "sTitle": "", "mData": "deleteButton", 'bSortable': false, 'sWidth': '1%'} :
                                        { "sTitle": "", "mData": "deleteButton", 'bSortable': false, bVisible: false}),
                                  { "sTitle": "unix time", "mData": "timestamp", "bVisible": false, "sType": 'numeric'}  

                              ],                         
                                "oLanguage": {
                                    //"sEmptyTable": "No objects in workspace",
                                    "sSearch": "Search:"
                                }
                            }
    

                            tableSettings.aaData = narratives;
                            table = $('#'+tableId).dataTable(tableSettings)
                                            .rowGrouping({iGroupingColumnIndex: 2,
                                                          bExpandableGrouping: true});
                            if (USER_ID) {
                                var new_proj_btn = $('<a class="btn btn-default pull-left">\
                                        <span class="glyphicon glyphicon-plus"></span>New Project</a>')
                                new_proj_btn.on('click', newProjectModal)
                            $('.table-options').append(new_proj_btn)
                            }

                            new FixedHeader( table , {offsetTop: 50, "zTop": 1000});                                  
                        }
                }



                function events() {
                    // adding buttons to project header
                    $('.group-item-expander').each(function() {
                        var self = this;
                        var proj = $(this).find('.proj-link').data('proj');

                        var prom = kb.nar.get_project_perms({project_id: proj});
                        $.when(prom).done(function(results) {
                            var user_list = formatUsers(results);
                            $(self).append(user_list);
                        })

                        if (USER_ID) {
                            $(this).append('<span class="proj-opts pull-right">\
                                              <a class="btn btn-default btn-xs btn-new-narrative"><span class="glyphicon glyphicon-plus"></span> Narrative</a> \
                                              <a class="btn-view-data" data-proj="'+proj+'" >Data</a> |\
                                              <a class="edit-perms">Manage</a>\
                                           </span>');
                        } else {
                            $(this).append('<span class="proj-opts pull-right">\
                                              <a class="btn-view-data" data-proj="'+proj+'" >Data</a> \
                                           </span>');                  
                        }

                    })



                    // event for new narrative button
                    $('.btn-view-data').unbind('click')
                    $('.btn-view-data').click(function(e){
                        e.stopImmediatePropagation()
                        var proj = $(this).parents('td').find('.proj-link').data('proj')
                        scope.$apply( $location.path( '/ws/objtable/'+proj ) );

                    })

                    // event for new narrative button
                    $('.btn-new-narrative').unbind('click')
                    $('.btn-new-narrative').click(function(e){
                        e.stopImmediatePropagation()
                        var proj = $(this).parents('td').find('.proj-link').data('proj')
                        newNarrativeModal(proj);
                    })



                    // event for edit perms button
                    $('.edit-perms').unbind('click')
                    $('.edit-perms').click(function(e){
                        e.stopImmediatePropagation()
                        var proj = $(this).parents('td').find('.proj-link').data('proj')
                        manageProject(proj)
                    })

                    // event for delete narrative button
                    $('.btn-delete-narrative').unbind('click')
                    $('.btn-delete-narrative').click(function(e){
                        var proj = $(this).data('proj');
                        var nar = $(this).data('nar');                        
                        deleteNarrativeModal(proj, nar);
                    })                    


                }




                function newProjectModal() {
                    var body = $('<form class="form-horizontal" role="form">\
                                      <div class="form-group">\
                                        <label class="col-sm-4 control-label">Project Name</label>'+
                                        '<div class="col-sm-5">'+
                                            '<div class="input-group">'+
                                                '<span class="input-group-addon">'+USER_ID+':</span>'+
                                                '<input type="text" class="form-control new-project-name">'+
                                            '</div>'+
                                        '</div>\
                                      </div>\
                                      <div class="form-group">\
                                        <label class="col-sm-4 control-label">Global Permissions</label>\
                                        <div class="col-sm-3">\
                                          <div style="margin: 7px 0 0 0;">None</div>\
                                        </div>\
                                      </div>\
                                      <!--<div class="form-group">\
                                        <label class="col-sm-4 control-label">Description</label>\
                                        <div class="col-sm-7">\
                                          <textarea class="form-control create-descript" rows="3"></textarea>\
                                        </div>\
                                      </div>-->\
                                  </div>')
                    

                    var newProjModal = $('<div></div>').kbasePrompt({
                            title : 'Create New Project',
                            body : body,
                            modalClass : '', 
                            controls : ['cancelButton', {
                                name : 'Create',
                                type : 'primary',
                                callback : function(e, $prompt) {
                                    var proj_name = $(".new-project-name").val();

                                    //no spaces allowed in narrative name
                                    proj_name = proj_name.replace(/ /g,"_");

                                    if (proj_name === '') {
                                        $prompt.addAlert('must enter project');
                                        $('.create-id').focus();
                                        return;
                                    }               

                                    //create the new narrative in ws
                                    $prompt.addCover()
                                    $prompt.getCover().loading()

                                    // check to see if there's a colon in the user project name already
                                    var s_proj = proj_name.split(':');
                                    var error;
                                    if (s_proj.length > 1) {
                                        if (s_proj[0] == USER_ID) {
                                            var proj = USER_ID+':'+s_proj[1];
                                        } else {
                                            error = 'Only your username ('+USER_ID+') may be used before a colon';
                                            
                                        }
                                    } else {
                                        var proj = USER_ID+':'+proj_name
                                    }

                                    if (error) {
                                        $prompt.addCover(error, 'danger');
                                    } else {
                                        var p =  kb.nar.new_project({project_id: proj})    
                                        $.when(p).done(function() {
                                            $prompt.addCover('Created project <b><i>'+proj+'</b></i>');

                                            scope.loadProjectList()
                                            scope.loadRecentProjects()

                                            var btn = $('<button type="button" class="btn btn-primary">Close</button>');
                                            btn.click(function() { 
                                                $prompt.closePrompt(); 
                                            });

                                            $prompt.data('dialogModal').find('.modal-footer').html(btn);     
                                        }).fail(function(e) {
                                            $prompt.addCover('Could not create project<br>'+e.error.message, 'danger');                                        
                                        });
                                    }
                                  
                                }
                            }]
                        }
                    );
                    newProjModal.openPrompt();
                }

                function newNarrativeModal(proj_id) {
                    var body = $('<form class="form-horizontal" role="form">\
                                      <div class="form-group">\
                                        <label class="col-sm-4 control-label">Narrative Name</label>\
                                        <div class="col-sm-4">\
                                          <input type="text" class="form-control new-narrative-name">\
                                        </div>\
                                      </div>\
                                      <!--<div class="form-group">\
                                        <label class="col-sm-4 control-label">Description</label>\
                                        <div class="col-sm-7">\
                                          <textarea class="form-control create-descript" rows="3"></textarea>\
                                        </div>\
                                      </div>-->\
                                  </div>')
                    

                    var narrativeModal = $('<div></div>').kbasePrompt({
                            title : 'Create New Narrative <small>in project '+proj_id+'</small>',
                            body : body,
                            modalClass : '', 
                            controls : ['cancelButton', {
                                name : 'Create',
                                type : 'primary',
                                callback : function(e, $prompt) {
                                    var name = $(".new-narrative-name").val();
                                    //var project_id = $("#new_narrative_project").val();

                                    //no spaces allowed in narrative name
                                    name = name.replace(/ /g,"_");
                                    

                                    if (name === '') {
                                        $prompt.addAlert('must enter');
                                        $('.create-id').focus();
                                        return;
                                    }               

                                    //create the new narrative in ws
                                    $prompt.addCover()
                                    $prompt.getCover().loading()                                  
                                    var p = kb.nar.new_narrative({narrative_id: name, 
                                                                   project_id: proj_id})
                                    $.when(p).done(function(results) {

                                        $prompt.addCover('Created narrative <b><i>'+name
                                                        +'</i></b> in project <b><i>'+proj_id+'</i></b>');

                                        scope.loadProjectList();
                                        scope.loadRecentNarratives();

                                        var btn = $('<button type="button" class="btn btn-primary">Close</button>');
                                        btn.click(function() { 
                                            $prompt.closePrompt(); 
                                        });

                                        $prompt.data('dialogModal').find('.modal-footer').html(btn);     

                                        //redirect to the narrative page
                                        //var userId = $("#login-widget").kbaseLogin("get_kbase_cookie", "user_id");
                                        //window.location.href = "http://narrative.kbase.us/"+proj_id+"."+name;
                                    })


                                    // fixme: use promise!
                                    //.fail(function(e) {
                                    //    $prompt.addCover(e.error.message, 'danger');                                            
                                    //})
                                }
                            }]
                        }
                    );
                    narrativeModal.openPrompt();
                }


                function deleteNarrativeModal(proj_id, nar_id) {
                    var body = $('<div style="text-align: center;">Are you sure you want to delete this narrative?<h3>'
                                        +nar_id+'</h3>This action is irreversible.</div>');

                    var deleteModal = $('<div></div>').kbasePrompt({
                            title : 'Delete Narrative',
                            body : body,
                            modalClass : '', 
                            controls : [{
                                name: 'No',
                                type: 'default',
                                callback: function(e, $prompt) {
                                        $prompt.closePrompt();
                                    }
                                },
                                {
                                name : 'Yes',
                                type : 'primary',
                                callback : function(e, $prompt) {
                                    $prompt.addCover();
                                    $prompt.getCover().loading();


                                    var prom = kb.ws.delete_objects([{workspace: proj_id, name: nar_id}] )

                                    $.when(prom).done(function() {
                                        $prompt.addCover('Deleted narrative: '+nar_id);
                                        scope.loadProjectList();
                                        scope.loadRecentNarratives();

                                        var btn = $('<button type="button" class="btn btn-primary">Close</button>');
                                        btn.click(function() { 
                                            $prompt.closePrompt(); 
                                        });

                                        $prompt.data('dialogModal').find('.modal-footer').html(btn);     
                                    }).fail(function(e) {
                                        $prompt.addCover(e.error.message, 'danger'); 
                                    })
                                }
                            }]
                        }
                    );

                    deleteModal.openPrompt();
                    deleteModal.addAlert('<strong>Warning</strong> this narrative will be deleted!');
                }



                function deleteProject(proj_name) {
                    var body = $('<div style="text-align: center;">Are you sure you want to delete this project?<h3>'
                                    +proj_name+'</h3>This action is irreversible.</div>');

                    var deleteModal = $('<div></div>').kbasePrompt({
                            title : 'Delete Project',
                            body : body,
                            modalClass : '', 
                            controls : [{
                                name: 'No',
                                type: 'default',
                                callback: function(e, $prompt) {
                                        $prompt.closePrompt();
                                    }
                                },
                                {
                                name : 'Yes',
                                type : 'primary',
                                callback : function(e, $prompt) {
                                    var params = {workspace: proj_name,
                                                  //auth: kb.token()
                                                 }

                                    var prom = kb.ws.delete_workspace(params);
                                    $prompt.addCover()
                                    $prompt.getCover().loading()
                                    $.when(prom).done(function(){
                                        $prompt.addCover('Deleted project: '+proj_name);
                                        scope.loadProjectList();
                                        scope.loadRecentNarratives();
                                        scope.loadRecentProject();

                                        var btn = $('<button type="button" class="btn btn-primary">Close</button>');
                                        btn.click(function() { $prompt.closePrompt(); })
                                        $prompt.data('dialogModal').find('.modal-footer').html(btn);
                                    }).fail(function(e) {
                                        $prompt.addCover('Could not delete project (workspace).<br>'+e.error.message, 'danger');
                                    })

                                }
                            }]
                        }
                    );
                    deleteModal.openPrompt();
                    deleteModal.addAlert('<strong>Warning</strong> All objects in the workspace will be deleted!');
                }


                function manageProject(proj_id) {

                    var perm_dict = {'a': 'Admin',
                                     'r': 'Read',
                                     'w': 'Write',
                                     'o': 'Owner',
                                     'n': 'None'};


                    var content = $('<div class="manage-content"></div>');
                    // modal for managing project permissions, and delete
                    var permData; 
                    var manage_modal = $('<div></div>').kbasePrompt({
                            title : 'Manage Project'+' <small>'+proj_id+'</small>',
                            body : content,
                            modalClass : '', 
                            controls : [{
                                name: 'Close',
                                type: 'default',
                                callback: function(e, $prompt) {
                                        $prompt.closePrompt();
                                    }
                                }, {
                                name : 'Save',
                                type : 'primary',
                                callback : function(e, $prompt) {
                                        $prompt.addCover();
                                        $prompt.getCover().loading();

                                        // save permissions
                                        var prom = savePermissions(proj_id);
                                        $.when(prom).done(function(){
                                            $prompt.addCover('Permissions saved.', 'success');                                            
                                        }).fail(function(e) {
                                            $prompt.addCover(e.error.message, 'danger');                                             
                                        }) 
                                    }
                                }]
                        })

                    manage_modal.openPrompt();
                    var dialog = manage_modal.data('dialogModal');
                    dialog.find('.modal-dialog').css('width', '500px');


                    var modal_body = manage_modal.data('dialogModal').find('.modal-body');

                    // if user is logged in and admin 

                    var placeholder = $('<div></div>').loading()
                    modal_body.append(placeholder); 

                    var prom = kb.nar.get_project_perms({project_id: proj_id})

                    $.when(prom).done(function(data) {
                        permData = data

                        placeholder.rmLoading();

                        modal_body.append('<h5>User Permissions <small><a class="edit-perms">Edit</a></small><h5>')


                        var perm_container = $('<div class="perm-container"></div>');
                        modal_body.append(perm_container);

                        var perm_table = getPermTable(permData)
                        perm_container.append(perm_table);

                        $('.edit-perms').click(function() {
                            if (perm_container.find('table.perm-table').length > 0) {
                                $(this).html('Cancel')
                                perm_table.remove()
                                perm_table = getEditablePermTable(data);
                                perm_container.html(perm_table);
                            } else {
                                $(this).html('Edit')                                    
                                perm_table.remove()
                                perm_table = getPermTable(data);
                                perm_container.html(perm_table);                                  
                            }
                        })


                        var del_proj = $('<a class="btn btn-danger pull-left">Delete</a>');

                        del_proj.click(function() { 
                            deleteProject(proj_id)
                        });
                        dialog.find('.modal-footer .text-left').append(del_proj);
                    })




                    function savePermissions(ws_name) {
                        var newPerms = {};
                        var table = $('.edit-perm-table');
                        table.find('tr').each(function() {
                            var user = $(this).find('.perm-user').val()
                            var perm = $(this).find('option:selected').val();
                            if (!user) return;
                            
                            newPerms[user] = perm
                        })

                        // create new permissions for each user that does not currently have 
                        // permsissions.
                        var promises = [];
                        for (var new_user in newPerms) {
                            // ignore these
                            if (new_user == '*' || new_user == USER_ID) continue;   

                            // if perms have not change, do not request change
                            if ( (new_user in permData) && newPerms[new_user] == permData[new_user]) {
                                continue;
                            }


                            var params = {
                                workspace: ws_name,
                                new_permission: newPerms[new_user],
                                users: [new_user],
                                //auth: USER_TOKEN
                            };

                            var p = kb.ws.set_permissions(params);
                            promises.push(p);
                        };

                        var rm_users = [];

                        // if user was removed from user list, change permission to 'n'
                        for (var user in permData) {
                            if (user == '*' || user == USER_ID) continue;                            

                            if ( !(user in newPerms) ) {

                                var params = {
                                    workspace: ws_name,
                                    new_permission: 'n',
                                    users: [user],
                                    //auth: USER_TOKEN
                                };

                                var p = kb.ws.set_permissions(params);
                                promises.push(p);
                                rm_users.push(user)
                            } 
                        }

                        return $.when.apply($, promises);
                    }



                    //table for displaying user permissions
                    function getPermTable(data) {
                        var table = $('<table class="table table-bordered perm-table"></table>');
                        // if there are no user permissions, display 'none'
                        // (excluding ~global 'user' and owner)
                        var perm_count = Object.keys(data).length;

                        if (perm_count <= 1) {
                            var row = $('<tr><td>None</td></tr>');
                            table.append(row);
                            return table;
                        }

                        // create table of permissions
                        for (var key in data) {
                            // ignore user's perm, ~global, and users with no permissions
                            if (key == '*' || key == USER_ID || data[key] == 'n') continue;
                            var row = $('<tr><td class="perm-user" data-user="'+key+'">'+key+'</td><td class="perm-value" data-value="'+data[key]+'">'+
                                             perm_dict[data[key]]+'</td></tr>');

                            table.append(row);
                        }

                        return table;
                    }

                    // table for editing user permissions
                    function getEditablePermTable(data) {
                        var table = $('<table class="table table-bordered edit-perm-table"></table>');

                        // create table of permissions
                        for (var key in data) {
                            // ignore user's perm, ~global, and users with no permissions
                            if (key == '*' || key == USER_ID || data[key] == 'n') continue;
                            var row = $('<tr><td><input type="text" class="form-control perm-user" value="'+key+'"></input></td>\
                                <td class="perm-value">'+permDropDown(data[key])+'</td>\
                                <td><button class="form-control rm-perm" data-user="'+key+'">\
                                <span class="glyphicon glyphicon-trash"></span></button></tr>');

                            row.find('.rm-perm').click(function(){
                                $(this).closest('tr').remove();                            
                            });

                            table.append(row);
                        }

                        // if there are no user permissions, display 'none'
                        // (excluding ~global 'user' and owner)
                        var perm_count = Object.keys(data).length;
                        if (perm_count == 2) {
                            var row = $('<tr>None</tr>');
                            table.append(row);
                        }                    

                        var newrowhtml = '<tr class="perm-row"><td><input type="text" class="form-control perm-user" placeholder="Username"></td><td>'+
                                permDropDown(data[key])+'</td></tr>'
                        var row = $(newrowhtml);

                        var addOpt = $('<td><button type="button" class="form-control add-perm">\
                            <span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button></td>');
                        row.append(addOpt);
                        table.append(row);
                        
                        table.find('.add-perm').click(function() {
                            var new_user_id = $(this).parents('tr').find('.perm-user').val();
                            var new_perm = $(this).parents('tr').find('.create-permission option:selected').val();
                            //newPerms[new_user_id] = new_perm; //update model

                            newRow(new_user_id, new_perm);

                            $(this).parents('tr').find('.perm-user-id').val('')

                            if (table.find('tr').length == 0) {
                               table.append('<tr>None</tr>');
                            }
                        });

                        function newRow(new_user_id, new_perm) {  //onchange="newPerms[\''+new_user_id+'\'] = $(this).find(\'option:selected\').val();
                            var rowToAdd = '<tr><td><input class="form-control perm-user" value="'+new_user_id+'"></input></td>\
                                    <td class="perm-value">'+permDropDown(data[key], new_perm)+'</td>\
                                    <td><button onclick="$(this).closest(&#39;tr&#39).remove();" class="form-control">\
                                    <span class="glyphicon glyphicon-trash"></span></button></tr>';

                            // add new row
                            table.find('tr:last').before(rowToAdd);
                        }

                        return table;
                    }

                    // dropdown for user permissions (used in getPermission Table) //fixme: cleanup
                    function permDropDown(perm) {
                        var dd = $('<select class="form-control create-permission" data-value="n">\
                                        <option value="r">read</option>\
                                        <option value="w">write</option>\
                                        <option value="a">admin</option></select>\
                                      </div>');

                        if (perm == 'a') {
                            dd.find("option[value='a']").attr('selected', 'selected');
                        } else if (perm == 'w') {
                            dd.find("option[value='w']").attr('selected', 'selected');                
                        } else {
                            dd.find("option[value='r']").attr('selected', 'selected');                           
                        }

                        return $('<div>').append(dd).html();
                    }
                }  // end manageModal





            } // end link


        }

    })


//
// utility functions 
//
function getTimestamp(datetime){
    if (!datetime) return; 
    var ymd = datetime.split('T')[0].split('-');
    var hms = datetime.split('T')[1].split(':');
    hms[2] = hms[2].split('+')[0];  
    return Date.UTC(ymd[0],ymd[1]-1,ymd[2],hms[0],hms[1],hms[2]);  
}



var msecPerMinute = 1000 * 60;
var msecPerHour = msecPerMinute * 60;
var msecPerDay = msecPerHour * 24;
function formateDate(timestamp) {
    var date = new Date()

    var interval =  date.getTime() - timestamp;

    var days = Math.floor(interval / msecPerDay );
    interval = interval - (days * msecPerDay);

    var hours = Math.floor(interval / msecPerHour);
    interval = interval - (hours * msecPerHour);

    var minutes = Math.floor(interval / msecPerMinute);
    interval = interval - (minutes * msecPerMinute);

    var seconds = Math.floor(interval / 1000);

    // if greater than 5 months ago, show date
    if (days > 150) {
        return false;
    }

    if (days == 0 && hours == 0 && minutes == 0) {
        return seconds + " secs ago.";
    } else if (days == 0 && hours == 0) {
        if (minutes == 1) return "1 min ago";
        return  minutes + " mins ago";
    } else if (days == 0) {
        if (hours == 1) return "1 hour ago";
        return hours + " hours ago"
    } else if (days == 1) {
        var d = new Date(timestamp);
        var t = d.toLocaleTimeString().split(':');        
        return 'yesterday at ' + t[0]+':'+t[1]+' '+t[2].split(' ')[1]; //check
    } else if (days < 7) {
        var d = new Date(timestamp);        
        var day = dayOfWeek[d.getDay()]
        var t = d.toLocaleTimeString().split(':');
        return 'Last '+ day + " at " + t[0]+':'+t[1]+' '+t[2].split(' ')[1]; //check
    } else  {
        var d = new Date(timestamp);        
        return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); //check
    }
}



var dayOfWeek = {0: 'Sun', 1: 'Mon', 2:'Tues',3:'Wed',
                     4:'Thurs', 5:'Fri', 6: 'Sat'}

var months = {0: 'Jan', 1: 'Feb', 2: 'March', 3: 'April', 4: 'May',
                5:'June', 6: 'July', 7: 'Aug', 8: 'Sept', 9: 'Oct', 10: 'Nov', 11: 'Dec'}

narrativeDirectives.directive('newsfeed', function(FeedLoad, $compile) {
        return  {
            link: function(scope, element, attrs) {
                var feedUrl = 'http://yogi.lbl.gov/eprojectbuilder/misc/kbasefeed2.xml';

                FeedLoad.fetch({q: feedUrl, num: 50}, {}, function (data) {
                    var feed = data.responseData.feed;
                    var feedContent = $("<div></div>");
                    for (entry in feed.entries) {

                        var feedEntry = $("<div></div>");
                        $(feedEntry).addClass("narr-featured-narrative");

                        $(feedEntry).append(feed.entries[entry].content);
                        var copyLink = $("<a></a>");
                        $(copyLink).html("copy narrative");
                        $(copyLink).attr('ng-click',"copyNarrativeForm(\""+feed.entries[entry].title + "\")");
                        $compile(copyLink)(scope);
                        $(feedEntry).append(copyLink);
                        $(feedContent).append($(feedEntry));
                    }
                    
                    $(element).html($(feedContent));

                    
                });

            } 
        };
    })  

narrativeDirectives.directive('copyfiles', function($parse) {
        return  {
            scope: {
                narr: '='
            },
            link: function(scope, element, attrs) {
                attrs.$observe('narr', function(val) {
                      
            }); 

                var deps = kb.nar.get_narrative_deps({
                    fq_id: scope.narr,
                    callback: function(results) {
                        
                        $(element).append("<tr><td>" + results.name + "</td><td>Narrative</td></tr>");
                        for (dep in results.deps) {
                            $(element).append("<tr><td>" + results.deps[dep].name + "</td><td>" + results.deps[dep].type + "</td></tr>");
                        } 

                    },
                    error_callback: function() {
                        //console.log("error occurred");
                        $(element).append("<tr class='danger'><td colspan='2'>We were unable to retrieve this narrative and its datasets. Please try again in a few minutes.</td></tr>");

                    }
                })

            } 

        };
    })   

