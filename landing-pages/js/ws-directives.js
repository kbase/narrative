
/*
 *  Directives
 *  
 *  These can be thought of as the 'widgets' on a page.  
 *  Scope comes from the controllers.
 *
*/


angular.module('ws-directives', []);
angular.module('ws-directives')
    .directive('wsselector', function($location) {
        return {
            controller: function($scope) {
                /*
               // model for storing selected objects
                $scope.selectedObjs = []

                // add objects from urls
                for (var i in $scope.ws) {
                    var found;
                    var entry = {ws: $scope.ws[i], id: $scope.ids[i]};

                    for (var j in $scope.selectedObjs) {
                        if (angular.equals($scope.selectedObjs[j], entry)) {
                            found = true;
                            break;
                        }
                    }

                    if (found) continue;
                    
                    $scope.selectedObjs.push(entry)
                }

                $scope.$watch('selectedObjs', function() {
                    console.log('watched')
                    // update url strings
                    $scope.ws = [];
                    $scope.ids = [];
                    for (var i in $scope.selectedObjs) {
                        var obj = $scope.selectedObjs[i];
                         $scope.ws.push(obj.ws);
                         $scope.ids.push(obj.id);  
                    }
                    $scope.ws_param =  $scope.ws.join('+');
                    $scope.ids_param =  $scope.ids.join('+');

                    $location.search({selected_ws: $scope.selected_ws,
                      ws: $scope.ws_param, 
                      ids: $scope.ids_param});

                    // show object selection sidebar

                    if (!$('.selectedobjs').is(':visible')) {
                        $('.side-bar-switch').children('button').removeClass('active');            
                        $('.show-objs').addClass('active');
                        $scope.showSelectedObjs();
                    }
                

                }, true); 
                */

            },            

            template: '<div class="ws-selector">'+
                        '<div class="ws-selector-header">'+
                            '<a class="show-filters">Filter <span class="caret"></span></a>'+
                            (USER_ID ? '<a class="new-ws pull-right">New+</a>' : '')+

                            '<div class="perm-filters" style="display:none;">'+
                                '<div class="checkbox pull-left" style="margin: 35px 25px;">'+
                                  '<label><input id="ws-filter-owner" type="checkbox" value="">owner</label>'+
                                '</div>'+
                                '<div class="pull-left">'+
                                    '<div class="checkbox">'+                              
                                      '<label><input id="ws-filter-admin" type="checkbox" value="" checked>admin</label>'+
                                    '</div>'+
                                    '<div class="checkbox">'+
                                      '<label><input id="ws-filter-write" type="checkbox" value="" checked>write</label>'+
                                    '</div>'+
                                    '<div class="checkbox">'+
                                      '<label><input id="ws-filter-read" type="checkbox" value="" checked>read</label>'+                                                                                          
                                    '</div>'+
                                 '</div>'+
                            '</div>'+

                            '<input type="text" class="search-query" placeholder="Filter Workspaces">'+
                        '</div>'+


                        '<div id="select-box" class="select-box scroll-pane">'+
                          '<table class="table table-bordered table-condensed table-hover"></table>'+
                        '</div>'+
                      '</div>'
                      ,

            link: function(scope, element, attrs, routeParams) {

                var perm_dict = {'a': 'Admin',
                                 'r': 'Read',
                                 'w': 'Write',
                                 'o': 'Owner',
                                 'n': 'None'};


                //global list and dict of fetched workspaces
                var workspaces = [];
                var workspace_dict = {};

                var nav_height = 100;

                scope.loadData = function() {
                    $('#select-box .table').remove();
                    $('#select-box').append('<table class="table table-bordered table-condensed table-hover"></table>');
                    workspaces = []
                    workspace_dict = {}

                    var prom = kb.kbwsAPI().list_workspaces({});
                    $('.select-box').loading();
                    $.when(prom).done(function(data) {

                        console.log('workspace data', data)
                        $('.select-box').rmLoading();

                        var sorted_ws = [];
                        var owned_ws = [];
                        for (var i in data) {
                            var ws = data[i];
                            var user = ws[1];
                            var perm = ws[4];

                            if (user == USER_ID) {
                                owned_ws.push(ws);
                            } else {
                                sorted_ws.push(ws)
                            }
                        }

                        var data = owned_ws.concat(sorted_ws);

                        for (var i in data) {
                            var ws = data[i];
                            var name = ws[0];
                            var user = ws[1];
                            var obj_count = ws[3];
                            var perm = ws[4];
                            var global_perm = ws[5];
                            //var short_ws = ws[0].slice(0,12) + '...'

                            if (user == USER_ID) {
                                var selector = $('<tr><td class="select-ws" data-ws="'+name+'">\
                                                                <div class="badge pull-left">'+obj_count+'</div>'+
                                                            ' &nbsp;<div class="pull-left ellipsis"> <b>'+name+'</b></div></td></tr>');
                            } else {
                                var selector = $('<tr><td class="select-ws" data-ws="'+name+'">\
                                                                <div class="badge pull-left">'+obj_count+'</div>'+
                                                            ' &nbsp;<div class="pull-left ellipsis">'+name+'</div></td></tr>');
                            }
                            selector.find('td').append('<button type="button" class="btn \
                                                btn-default btn-xs btn-ws-settings hide pull-right" data-ws="'+name+'">\
                                                <span class="glyphicon glyphicon-cog"></span></button>');

                            // event for showing settings button
                            selector.hover(function() {
                                $(this).find('.btn-ws-settings').removeClass('hide');
                            }, function() {
                                $(this).find('.btn-ws-settings').addClass('hide');
                            })
                            $(".select-box table").append(selector);

                            workspace_dict[name] = ws; //store in dictionary for optimization
                        }

                        workspaces = data;

                        $('.scroll-pane').css('height', $(window).height()-
                            $('.ws-selector-header').height() - nav_height )                     
                        events();
                    });
                }

                // load the content of the ws selector
                scope.loadData();

                function events() {
                    var filterCollapse = $('.perm-filters');
                    var filterOwner = filterCollapse.find('#ws-filter-owner').change(filter);
                    var filterAdmin = filterCollapse.find('#ws-filter-admin').change(filter);
                    var filterWrite = filterCollapse.find('#ws-filter-write').change(filter);
                    var filterRead  = filterCollapse.find('#ws-filter-read').change(filter);
                    //var search = filterSearch.val();

                    // modal for create new workspace

                    $('.new-ws').click(function() {
                        createWorkspaceModal();
                    });

                    // events for search box
                    $('.search-query').keyup(function() {
                        $('.select-box').find('td').show();
                            var input = $(this).val();
                            $('.select-box').find('td').each(function(){
                            if ($(this).text().toLowerCase().indexOf(input.toLowerCase()) != -1) {
                                return true;
                            } else {
                                $(this).hide();
                            }
                        });
                    });

                    // events for filters at top of ws selector
                    $('.show-filters').click(function() {
                        $(this).parent().find('.perm-filters').slideToggle(function() {

                            // if filters are shown, adjust scrollbox height.
                            if ( $('.perm-filters').css('display') == "none") {
                                $('.scroll-pane').css('height', $(window).height()-
                                    $('.ws-selector-header').height() - nav_height  );                                
                            } else {
                                $('.scroll-pane').css('height', $(window).height()-
                                    $('.ws-selector-header').height() - nav_height );                                
                            }

                        });
                    });

                    // event for selecting a workspace on the sidebar
                    $('.select-ws').not('.btn-ws-settings').click(function() {
                        var ws = $(this).data('ws');
                        $('.select-ws').removeClass('selected-ws');
                        $(this).addClass('selected-ws');
                        scope.$apply( $location.path('/ws/objtable/'+ws) );
                    });

                    // event for settings (manage modal) button
                    $('.btn-ws-settings').click(function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                        var name = $(this).parent('td').data('ws');
                        manageModal(name);
                    })


                    // event for resizing ws selector scroll bars
                    $(window).resize(function () {
                        // only adjust of ws selector is visible
                        if ($(element).is(':visible')) {
                            setTimeout(function() {
                                $('.scroll-pane').css('height', $(window).height()
                                    - $('.ws-selector-header').height() - nav_height )   
                            }, 250); 
                        }
                    });

                    // function that filters when a filter is selected
                    function filter() {
                        $('.select-box table tr').show();
                        $('.no-ws-alert').remove()

                        var owner = filterOwner.prop('checked');
                        var admin = filterAdmin.prop('checked');
                        var write = filterWrite.prop('checked');
                        var read  = filterRead.prop('checked');

                        //$(".select-box table").children()
                        for (var i=0; i< workspaces.length; i++) {
                            var ws = workspaces[i];
                            var name = ws[0];
                            var user = ws[1];
                            var obj_count = ws[3];
                            var perm = ws[4];
                            var global_perm = ws[5];

                            var j = i+1;

                            var show = false;
                            if (admin && perm === 'a') show = true;
                            if (write && perm === 'w') show = true;
                            if (read && perm === 'r') show = true;
                            if (!show && read && global_perm === 'r') show = true;
                            if (show && owner && user != USER_ID) show = false;
                            console.log('global', owner)


                            if (!show) {
                                $('.select-box table tr:nth-child('+j+')').hide();
                            }
                        }

                        if ($('.select-box table tr:visible').length == 0) {
                            $('.select-box table').append('<tr class="no-ws-alert"><td>No Workspaces</td></tr>');
                        } 
                    }
                } /* end events */

                function manageModal(ws_name) {
                    var settings = workspace_dict[ws_name];

                    var isAdmin;
                    if (settings[4] == 'a') {
                        isAdmin = true;
                    } else {
                        isAdmin = false;
                    }

                    // table of meta data
                    var table = $('<table class="table table-bordered manage-table table-striped">');                
                    var data = [
                        ['Name', settings[0]],
                        ['Objects', '~ ' + settings[3] ],
                        ['Owner', settings[1] ],
                        ['Permission', perm_dict[settings[4]] ],
                        ['Global Permission', perm_dict[settings[5]] ]
                    ];
                    for (var i=0; i<data.length; i++) {
                        var row = $('<tr>');
                        row.append(
                            '<td class="manage-modal-attribute"><strong>' + data[i][0] + '</strong></td>'
                                + '<td class="manage-modal-value">' + data[i][1] + '</td>');
                        table.append(row);
                    }

                    var content = $('<div class="manage-content"></div>');
                    content.append(table);

                    // modal for managing workspace permissions, clone, and delete
                    var permData; 
                    var manage_modal = $('<div></div>').kbasePrompt({
                            title : 'Manage Workspace',
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
                                        savePermissions(ws_name, function() {
                                            $prompt.addCover('Permissions saved.', 'success');
                                        }, function() {
                                            $prompt.addCover(e.error.error.split('\n')[0], 'danger');                                            
                                        })
                                }
                            }]
                        })

                    manage_modal.openPrompt();

                    var cloneWS = $('<button class="btn btn-link pull-left">Clone</button>');
                    cloneWS.click(function() {
                        manage_modal.closePrompt();
                        cloneWorkspace(ws_name);
                    });

                    var deleteWS = $('<button class="btn btn-link pull-right">Delete</button>');
                    deleteWS.click(function() {
                        manage_modal.closePrompt();
                        deleteWorkspace(ws_name);
                    });

                    var modal_body = manage_modal.data('dialogModal').find('.modal-body');

                    // if user is logged in and admin 
                    if (USER_ID && isAdmin ) {
                        var params = {//auth: USER_TOKEN,
                                      workspace: ws_name}

                        var prom = kb.kbwsAPI().get_permissions(params);

                        //var newPerms;
                        var placeholder = $('<div></div>').loading()
                        modal_body.append(placeholder);                        
                        $.when(prom).done(function(data) {
                            console.log('perm data', data)
                            permData = data

                            //newPerms = $.extend({},data)
                            placeholder.rmLoading();

                            if (isAdmin) {
                                modal_body.append('<h5>User Permissions <small><a class="edit-perms">Edit</a></small><h5>')
                            } else {
                                modal_body.append('<h5>User Permissions</h5>');                                
                            }

                            var perm_container = $('<div class="perm-container"></div>');
                            modal_body.append(perm_container);

                            var perm_table = getPermTable(data)
                            perm_container.append(perm_table);

                            if (isAdmin) {
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
                            }


                            modal_body.append(cloneWS);
                            modal_body.append(deleteWS);                                

                        })
                    // if logged in and admin
                    }


                    function savePermissions(ws_name, cb, fail_cb) {
                        var settings = workspace_dict[ws_name];

                        var newPerms = {};
                        var table = $('.edit-perm-table');
                        table.find('tr').each(function() {
                            var user = $(this).find('.perm-user').val()
                            var perm = $(this).find('option:selected').val();
                            if (!user) return;
                            if ( (user in permData) && perm == permData[user]) {
                                return;
                            } 
                            
                            newPerms[user] = perm
                        })
                        console.log('new perms', newPerms)


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

                            var p = kb.kbwsAPI().set_permissions(params);
                            promises.push(p);
                        };

                        var rm_users = [];


                        // if user was removed from user list, change permission to 'n'
                        for (var user in permData) {
                            if (user == '*' || user == USER_ID) continue;                            

                            if ( !(user in newPerms) ) {
                                console.log('removing:', user)
                                var params = {
                                    workspace: ws_name,
                                    new_permission: 'n',
                                    users: [user],
                                    //auth: USER_TOKEN
                                };

                                var p = kb.kbwsAPI().set_permissions(params);
                                promises.push(p);
                                rm_users.push(user)
                            } 
                        }

                        $.when.apply($, promises).done(function() {
                            // update model to remove 


                            cb();
                        }).fail(function() {
                            fail_cb;
                        });
                    }


                    //table for displaying user permissions
                    function getPermTable(data) {
                        var table = $('<table class="table table-bordered perm-table"></table>');
                        console.log('user perms', data);
                        // if there are no user permissions, display 'none'
                        // (excluding ~global 'user' and owner)
                        var perm_count = Object.keys(data).length;
                        if (perm_count == 1) {
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
                                console.log('removing', $(this).data('user'))
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

                        var newrowhtml = '<tr class="perm-row"><td><input type="text" class="form-control perm-user-id" placeholder="Username"></td><td>'+
                                permDropDown(data[key])+'</td></tr>'
                        var row = $(newrowhtml);

                        var addOpt = $('<td><button type="button" class="form-control add-perm">\
                            <span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button></td>');
                        row.append(addOpt);
                        table.append(row);
                        
                        table.find('.add-perm').click(function() {
                            var new_user_id = $(this).parents('tr').find('.perm-user-id').val();
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

                function createWorkspaceModal() {
                    var body = $('<form class="form-horizontal" role="form">\
                                      <div class="form-group">\
                                        <label class="col-sm-5 control-label">Workspace Name</label>\
                                        <div class="col-sm-4">\
                                          <input type="text" class="form-control create-id">\
                                        </div>\
                                      </div>\
                                      <div class="form-group">\
                                        <label class="col-sm-5 control-label">Permsission</label>\
                                        <div class="col-sm-3">\
                                         <select class="form-control create-permission" data-value="n">\
                                            <option value="n" selected="selected">none</option>\
                                            <option value="r">read</option></select>\
                                        </div>\
                                      </div>\
                                  </div>')
                    

                    var createModal = $('<div></div>').kbasePrompt({
                            title : 'Create Workspace',
                            body : body,
                            modalClass : '', 
                            controls : ['cancelButton', {
                                name : 'Create',
                                type : 'primary',
                                callback : function(e, $prompt) {
                                        var ws_id = $('.create-id').val();
                                        var perm = $('.create-permission option:selected').val();
                                        var params = {
                                            //auth: USER_TOKEN,  //wsdeluxe
                                            workspace: ws_id,
                                            //default_permission: perm
                                            globalread: perm
                                        };

                                        if (ws_id === '') {
                                            $prompt.addAlert('must enter');
                                            $('.create-id').focus();
                                            return;
                                        }                   

                                        var prom = kb.kbwsAPI().create_workspace(params);
                                        $prompt.addCover()
                                        $prompt.getCover().loading()
                                        $.when(prom).done(function(){
                                            $prompt.addCover('Created workspace: '+ws_id, 'success');
                                                scope.loadData()

                                            var btn = $('<button type="button" class="btn btn-primary">Close</button>');
                                            btn.click(function() { 
                                                $prompt.closePrompt(); 
                                            });

                                            $prompt.data('dialogModal').find('.modal-footer').html(btn);                                            
                                        }).fail(function(e) {
                                            //$prompt.addCover(e.error.errsor.split('\n')[0]);
                                            $prompt.addCover('could not create workspace', 'danger');                                            
                                        })
                                }
                            }]
                        }
                    );

                    createModal.openPrompt();
                }

                function cloneWorkspace(ws_name) {
                    var body = $('<form class="form-horizontal" role="form">\
                                      <div class="form-group">\
                                        <label class="col-sm-5 control-label">New Workspace Name</label>\
                                        <div class="col-sm-4">\
                                          <input type="text" class="form-control new-ws-id">\
                                        </div>\
                                      </div>\
                                      <div class="form-group">\
                                        <label class="col-sm-5 control-label">Permission</label>\
                                        <div class="col-sm-3">\
                                         <select class="form-control create-permission" data-value="n">\
                                            <option value="n" selected="selected">none</option>\
                                            <option value="r">read</option></select>\
                                        </div>\
                                      </div>\
                                  </div>');
                    

                    var cloneModal = $('<div></div>').kbasePrompt({
                            title : 'Clone Workspace',
                            body : body,
                            modalClass : '', 
                            controls : [{
                                name: 'Cancel',
                                type: 'default',
                                callback: function(e, $prompt) {
                                        $prompt.closePrompt();
                                        manageModal(ws_name);
                                    }
                                },
                                {
                                name : 'Clone',
                                type : 'primary',
                                callback : function(e, $prompt) {
                                        var new_ws_id = $('.new-ws-id').val();
                                        var perm = $('.create-permission option:selected').val();
                                        //var id = workspace_dict[ws_name][6];

                                        var params = {
                                            //auth: USER_TOKEN,                                            
                                            wsi: {workspace: ws_name},
                                            workspace: new_ws_id,
                                            //default_permission: perm                                            
                                            globalread: perm
                                        };

                                        if (new_ws_id === '') {
                                            $prompt.addAlert('must enter');
                                            $('.new-ws-id').focus();
                                            return;
                                        }                   

                                        console.log('calling clone workspace with:', params)
                                        var prom = kb.kbwsAPI().clone_workspace(params);
                                        $prompt.addCover()
                                        $prompt.getCover().loading()
                                        $.when(prom).done(function(){
                                            $prompt.addCover('Cloned workspace: '+new_ws_id);
                                            scope.loadData();
                                        }).fail(function() {
                                            $prompt.addCover('This workspace name already exists.', 'danger');
                                        })

                                }
                            }]
                        }
                    );

                    cloneModal.openPrompt();
                }


                function deleteWorkspace(ws_name) {
                    var body = $('<div style="text-align: center;">Are you sure you want to delete this workspace?<h3>'
                                    +ws_name+'</h3>This action is irreversible.</div>');
                    

                    var deleteModal = $('<div></div>').kbasePrompt({
                            title : 'Delete Workspace',
                            body : body,
                            modalClass : '', 
                            controls : [{
                                name: 'No',
                                type: 'default',
                                callback: function(e, $prompt) {
                                        $prompt.closePrompt();
                                        manageModal(ws_name);
                                    }
                                },
                                {
                                name : 'Yes',
                                type : 'primary',
                                callback : function(e, $prompt) {
                                    var params = {workspace: ws_name,
                                                  //auth: kb.token()
                                                 }

                                    var prom = kb.kbwsAPI().delete_workspace(params);
                                    $prompt.addCover()
                                    $prompt.getCover().loading()
                                    $.when(prom).done(function(){
                                        $prompt.addCover('Deleted workspace: '+ws_name);
                                        scope.loadData();
                                        var btn = $('<button type="button" class="btn btn-primary">Close</button>');
                                        btn.click(function() { $prompt.closePrompt(); })
                                        $prompt.data('dialogModal').find('.modal-footer').html(btn);
                                    }).fail(function() {
                                        $prompt.addCover('Could not delete workspace.', 'danger');
                                    })

                                }
                            }]
                        }
                    );

                    deleteModal.openPrompt();
                    deleteModal.addAlert('<strong>Warning</strong> All objects in the workspace will be deleted!');
                }


            }  /* end link */

        };
    })

    .directive('objtable', function($location) {
        return {

            link: function(scope, element, attrs) {
                var ws = scope.selected_ws;

                var tableSettings = {
                    "sPaginationType": "bootstrap",
                    //"sPaginationType": "full_numbers",
                    "iDisplayLength": 10,
                    "aaData": [],
                    "fnDrawCallback": events,

                  "aoColumns": [
                      { "sTitle": ""},
                      { "sTitle": "Name"}, //"sWidth": "10%"
                      { "sTitle": "Type", "sWidth": "10%"},
                      { "sTitle": "Moddate"},
                      { "sTitle": "Owner"},
                  ],                         
                    "oLanguage": {
                        "sSearch": "Search:"
                    }
                }

                $(element).html('')
                $(element).loading('loading '+ws+'...')

                // load workspace objects
                var prom = kb.req('ws', 'list_workspace_objects', {workspace: ws});
                $.when(prom).done(function(data){
                    $(element).rmLoading();
                    $(element).append('<table id="obj-table-'+ws+'" \
                        class="table table-bordered table-striped" style="width: 100%;"></table>')    

                    var wsobjs = formatObjs(data);
                    tableSettings.aaData = wsobjs;

                    var table = $('#obj-table-'+ws).dataTable(tableSettings);

                    $(element).prepend('<div class="object-options"></div>')
                }).fail(function(e){
                    $(element).html('<div class="alert alert-danger">'+e.error.error.split('\n')[0]+'</div>');
                })


                function formatObjs(objs) {
                    var wsobjs = []

                    for (var i in objs) {
                        var obj = objs[i];
                        var id = obj[0];
                        var type = obj[1];
                        var instance = obj[3];

                        var check = '<div class="ncheck check-option"'
                                + ' data-workspace="' + obj.workspace + '"'
                                + ' data-type="' + obj.type + '"'
                                + ' data-id="' + obj.id + '"></div>';

                        var wsarray = [check, id,
                                       type,
                                       obj[2].split('+')[0].replace('T',' '), // moddate
                                       obj[5]  // owner
                                       ];

                        //if (type == 'FBA') {
                        //    wsarray[0] = '<a class="obj-id" data-obj-id="'+id+'" data-obj-type="'+type+'">'
                         //               +id+'</a> (<a class="show-versions">'+instance+'</a>)'
                                        //+'<a class="add-to-mv pull-right">'
                                        //+'add <span class="glyphicon glyphicon-plus-sign"></span> '
                                        //+'</a>';

                        var new_id = '<a class="obj-id" data-obj-id="'+id+'" data-obj-type="'+type+'">'
                                +id+'</a> (<a class="show-versions">'+instance+'</a>)';

                        wsarray[1] = new_id
                        wsobjs.push(wsarray);
                    }
                    return wsobjs
                }

                function events() {
                    // event for clicking on a workspace id
                    $('.obj-id').unbind('click');                    
                    $('.obj-id').click(function(){
                        var type = $(this).data('obj-type');
                        var id = $(this).data('obj-id');

                        if (type == 'Genome') {
                            scope.$apply( $location.path('/genomes/'+ws+'/'+id) );
                        } else if (type == 'Model') {
                            scope.$apply( $location.path('/models/'+ws+'/'+id) );
                        } else if (type == 'FBA') {
                            scope.$apply( $location.path('/fbas/'+ws+'/'+id) );
                        } else if (type == 'Media') {
                            scope.$apply( $location.path('/media/'+ws+'/'+id) );
                        }
                    })

                    // event for adding a object to, say, model viewer
                    $('.add-to-mv').unbind('click');
                    $('.add-to-mv').click(function(){
                        var type = $(this).prev('.obj-id').data('obj-type');
                        var id = $(this).prev('.obj-id').data('obj-id');
                        scope.selectedObjs.push({ws:ws, id:id, type:type});
                        scope.$apply();
                    })

                    // event for showing object history
                    $('.show-versions').click(function() {
                        console.log('show versions')
                        var type = $(this).prev('.obj-id').data('obj-type');
                        var id = $(this).prev('.obj-id').data('obj-id');

                        var historyModal = $('<div class="history-modal"></div>').kbasePrompt({
                                title : 'History <small>(<i>'+id+'</i>)</small>',
                                //body : '',
                                modalClass : '', 
                                controls : ['closeButton']
                            }
                        );

                        historyModal.openPrompt();
                        var modal_body = historyModal.data('dialogModal').find('.modal-body').loading();
                        historyModal.data('dialogModal').find('.modal-dialog').css('width', '800px')

                        var prom = kb.kbwsAPI().get_object_history({workspace: ws, name: id});
                        $.when(prom).done(function(data) {
                            modal_body.rmLoading();
                                console.log(data)
                            modal_body.append('<b>ID</b>: '+data[0][0]+'<br>')
                            modal_body.append('<b>Type</b>: '+data[0][2])                            
                            var info = $('<table class="table table-striped table-bordered">');
                            var header = $('<tr><th>Mod Date</th>\
                                                <th>Vers</th>\
                                                <th>Owner</th>\
                                                <th>Cmd</th></tr>');
                            info.append(header);
                            for (var i=0; i<data.length; i++) {
                                var ver = data[i];
                                var row = $('<tr>');
                                row.append('<td>' + ver[3] + '</td>' // type
                                         + '<td>' + ver[4] + '</td>'
                                         + '<td>' + ver[5] + '</td>'
                                         + '<td>' + ver[7] + '</td>');
                                info.append(row);
                            }

                            modal_body.append(info)
                        })
                    })

                    //checkBoxObjectClickEvent('.check-option')

                }



                var checkedList = []
                function checkBoxObjectClickEvent(ele) {
                    // if select all checkbox was clicked
                    if (!ele) {
                        addOptionButtons();
                        objOptClick()            
                        return;
                    }

                    // checkbox click event
                    $(ele).unbind('click');
                    $(ele).click(function(){
                        var id = $(this).attr('data-id');
                        //var modelID = get_fba_model_id( $(this).attr('data-id') );            
                        var dataWS = $(this).attr('data-workspace');
                        var dataType = $(this).attr('data-type');

                        if ($(this).hasClass('ncheck-checked')) { 
                            $(this).removeClass('ncheck-checked');
                            for (var i = 0; i < checkedList.length; i++) {
                                if (checkedList[i][0] == id) {
                                    checkedList.splice(i,1);
                                }
                            }
                        } else {
                            checkedList.push([id, dataWS, dataType])
                            $(this).addClass('ncheck-checked');
                        }

                        addOptionButtons()
                        objOptClick()
                    })
                }



                function addOptionButtons() {
                    /* if options dropdown doesn't exist, add it (at top of table) */
                        console.log('adding options')
                        // container for options
                        $('.object-options').append('<div class="checked-opts obj-opt"></div>')

                        // delete button
                        $('.checked-opts').append('<a class="btn obj-btn opt-delete btn-danger">\
                                                   <i class="icon-trash icon-white"></i></a>')

                        // move, copy, download button
                        $('.checked-opts').append('<div class="dropdown obj-opt opt-dropdown"> \
                                            <a class="btn obj-btn dropdown-toggle" type="button" data-toggle="dropdown"> \
                                         <i class="icon-folder-open"></i> <span class="caret"></span></a>\
                                         <ul class="dropdown-menu"> \
                                          <li opt="copy"><a>Copy</a> </li> \
                                          <li  opt="move"><a>Move</a></li> \
                                          <li class="divider"><a></a></li> \
                                          <li><a>Download</li> \
                                    </ul></div>');
                                        //<i class="icon-download-alt"></i></a>

                        // model viewer button
                        if ($(this).attr('data-type') == "FBA") {
                            var url = 'http://mcs.anl.gov/~nconrad/model_viewer/#models?kbids='+id+'&ws='+dataWS+'&tab=core';
                            $('.checked-opts').append('<div class="btn obj-opt opt-delete" type="button" \
                                onclick="location.href='+"'" +url+"'"+'" >Model Viewer</div>');
                        }
         
//
  //                      $('.checked-opts').remove();
    //                    $('.select-objs .ncheck-btn').removeClass('ncheck-minus')                

                }


                // events for top row options on objects, after checked
                function objOptClick() {
                    $('.opt-delete').unbind('click')
                    $('.opt-delete').click(function(){
                        deleteObjects(checkedList)
                    });

                    $('.opt-dropdown ul li').unbind('click')
                    $('.opt-dropdown ul li').click(function(){
                        if ($(this).attr('opt') == 'copy'){
                            copyObjects(checkedList);
                        } else if ($(this).attr('opt') == 'move'){
                            moveObjects(checkedList);
                        }
                    })
                }

            }

        };
    })






