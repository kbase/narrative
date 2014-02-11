
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

            link: function(scope, element, attrs) {

                var perm_dict = {'a': 'Admin',
                                 'r': 'Read',
                                 'w': 'Write',
                                 'o': 'Owner',
                                 'n': 'None'};

                // Global list and dict of fetched workspaces
                var workspaces = []; 
                scope.workspace_dict = {};

                var nav_height = 100;//238;


                // This method loads the sidebar data.  
                // Note: this is only called after instantiation when sidebar needs to be refreshed
                scope.loadObjectTable = function() {
                    $('#select-box .table').remove();
                    $('#select-box').append('<table class="table table-bordered table-condensed table-hover"></table>');
                    workspaces = []
                    scope.workspace_dict = {}

                    var prom = kb.ws.list_workspaces({});
                    $('.select-box').loading();
                    $.when(prom).done(function(data) {

                        $('.select-box').rmLoading();

                        var sorted_ws = [];
                        var owned_ws = [];
                        for (var i in data) {
                            var ws = data[i];

                            //quick fix to hide search workspaces
                            if (ws[1]== "kbasesearch") continue;  

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

                            scope.workspace_dict[name] = ws; //store in dictionary for optimization
                        }

                        workspaces = data;


                        $('.scroll-pane').css('height', $(window).height()-
                            $('.ws-selector-header').height() - nav_height )                     
                        events();
                    });
                }

                // load the content of the ws selector
                scope.loadObjectTable();

                function events() {
                    var filterCollapse = $('.perm-filters');
                    var filterOwner = filterCollapse.find('#ws-filter-owner').change(filter);
                    var filterAdmin = filterCollapse.find('#ws-filter-admin').change(filter);
                    var filterWrite = filterCollapse.find('#ws-filter-write').change(filter);
                    var filterRead  = filterCollapse.find('#ws-filter-read').change(filter);
                    //var search = filterSearch.val();

                    // event for clicking on 'create new workspace'
                    $('.new-ws').unbind('click');
                    $('.new-ws').click(function() {
                        createWorkspaceModal();
                    });

                    // events for search box
                    $('.search-query').unbind('click');
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
                    $('.show-filters').unbind('click');
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
                    $('.select-ws').not('.btn-ws-settings').unbind('click');
                    $('.select-ws').not('.btn-ws-settings').click(function() {
                        var ws = $(this).data('ws');
                        $('.select-ws').removeClass('selected-ws');
                        $(this).addClass('selected-ws');

                        scope.$apply( $location.path('/ws/objtable/'+ws) );
                    });

                    // event for settings (manage modal) button
                    $('.btn-ws-settings').unbind('click')
                    $('.btn-ws-settings').click(function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                        var name = $(this).parent('td').data('ws');
                        manageModal(name);
                    })


                    // event for resizing ws selector scroll bars //fixme
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
                    var settings = scope.workspace_dict[ws_name];

                    var isAdmin;
                    if (settings[4] == 'a') {
                        isAdmin = true;
                    } else {
                        isAdmin = false;
                    }

                    // table of meta data
                    var table = $('<table class="table table-bordered table-condensed table-striped manage-table">');                
                    var data = [
                        ['Name', settings[0]],
                        ['Objects', '~ ' + settings[3] ],
                        ['Owner', settings[1] ],
                        ['Permission', perm_dict[settings[4]] ],
                        ['Global Permission', perm_dict[settings[5]] ]
                    ];
                    for (var i=0; i<data.length; i++) {
                        var row = $('<tr>');
                        row.append('<td class="manage-modal-attribute"><strong>' + data[i][0] + '</strong></td>'
                                + '<td class="manage-modal-value">' + data[i][1] + '</td>');
                        table.append(row);
                    }

                    var content = $('<div class="manage-content"></div>');
                    content.append(table);

                    // modal for managing workspace permissions, clone, and delete
                    var permData; 
                    var manage_modal = $('<div></div>').kbasePrompt({
                            title : 'Manage Workspace <a class="btn btn-primary btn-xs btn-edit">Edit <span class="glyphicon glyphicon-pencil"></span></a>',
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
                                callback : function(e, $prompt) { //Fixme: yyyeeeahh.
                                    $prompt.addCover();
                                    $prompt.getCover().loading();

                                    var prom = savePermissions(ws_name);
                                    prompt = $prompt;

                                    // save permissions, then save description
                                    $.when(prom).done(function() {
                                        // if description textarea is showing, saving description
                                        if ($('#ws-description textarea').length > 0) {
                                            var d = $('#ws-description textarea').val();

                                            // saving description
                                            var prom = kb.ws.set_workspace_description({workspace: ws_name, 
                                                description: d})

                                            $.when(prom).done(function() {
                                                prompt.addCover('Saved.');
                                                prompt.closePrompt();
                                                manageModal(ws_name);                                            
                                            }).fail(function(e){
                                                prompt.addCover(e.error.message, 'danger');
                                            })
                                        } else {
                                            prompt.addCover('Saved.');
                                            prompt.closePrompt();
                                            manageModal(ws_name);
                                        }
                                    }).fail(function(e){
                                        prompt.addCover(e.error.message, 'danger');
                                    })
                                }
                            }]
                        })

                    manage_modal.openPrompt();
                    var dialog = manage_modal.data('dialogModal').find('.modal-dialog');
                    dialog.css('width', '500px');
                    var modal_body = dialog.find('.modal-body');  //fixme: an api to the 
                                                                  // widget would be nice for this stuff
                    var modal_footer = dialog.find('.modal-footer');
                    var save_btn = modal_footer.find('.btn-primary');
                    save_btn.attr('disabled', true);

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

                    var dialog = manage_modal.data('dialogModal');
                    var modal_body = dialog.find('.modal-body');

                    var prom = kb.ws.get_workspace_description({workspace:ws_name})
                    $.when(prom).done(function(descript) {
                        var d = $('<div>');
                        d.append('<h5>Description</h5>');
                        d.append('<div id="ws-description">'+(descript ? descript : '(none)')+'</div><br>');
                        modal_body.prepend(d);

                        var save_disabled = true;

                        // add btn that allows the user to edit any content
//                        modal_body.prepend('')

                        $('.btn-edit').click(function(){
                            if ($('#ws-description textarea').length > 0) {
                                $('#ws-description').html(descript);
                                $(this).text('Edit');
                                save_btn.attr('disabled', true);
                            } else {
                                var editable = getEditableDescription(descript);
                                $('#ws-description').html(editable);
                                $(this).text('Cancel');
                                save_btn.attr('disabled', false)                               
                            }
                        })
                    })


                    // if user is logged in and admin 
                    if (USER_ID && isAdmin ) {
                        var params = {workspace: ws_name}

                        var prom = kb.ws.get_permissions(params);

                        //var newPerms;
                        var placeholder = $('<div></div>').loading()
                        modal_body.append(placeholder);                        
                        $.when(prom).done(function(data) {
                            permData = data

                            //newPerms = $.extend({},data)
                            placeholder.rmLoading();

                            if (isAdmin) {
                                modal_body.append('<hr><h5>User Permissions<h5>')
                            } else {
                                modal_body.append('<h5>User Permissions</h5>');                                
                            }

                            var perm_container = $('<div class="perm-container"></div>');
                            modal_body.append(perm_container);

                            var perm_table = getPermTable(data)
                            perm_container.append(perm_table);


                            $('.btn-edit').click(function() {
                                if (perm_container.find('table.perm-table').length > 0) {
                                    $(this).html('Cancel')
                                    perm_table.remove()
                                    perm_table = getEditablePermTable(data);
                                    perm_container.html(perm_table);
                                    save_btn.attr('disabled', false);                                        
                                } else {
                                    $(this).html('Edit')                                    
                                    perm_table.remove()
                                    perm_table = getPermTable(data);
                                    perm_container.html(perm_table);
                                    save_btn.attr('disabled', true);                                        
                                }
                            })


                            modal_body.append(cloneWS);
                            modal_body.append(deleteWS);
                        })
                    // if logged in and admin
                    }


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
                                };

                                var p = kb.ws.set_permissions(params);
                                promises.push(p);
                                rm_users.push(user)
                            } 
                        }

                        return $.when.apply($, promises);
                    }

                    function getEditableDescription(d) {
                        var d = $('<form role="form">\
                                   <div class="form-group">\
                                    <textarea rows="4" class="form-control" placeholder="Description">'+d+'</textarea>\
                                  </div>\
                                  </form>');
                        return d;

                    }


                    //table for displaying user permissions
                    function getPermTable(data) {
                        var table = $('<table class="table table-bordered perm-table"></table>');
                        // if there are no user permissions, display 'none'
                        // (excluding ~global 'user' and owner)
                        var perm_count = Object.keys(data).length;

                        if (perm_count <= 1 || (perm_count == 2 && '*' in data)) {
                            var row = $('<tr><td>(None)</td></tr>');
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

                            $(this).parents('tr').find('.perm-user').val('')

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
                                        <label class="col-sm-4 control-label">Workspace Name</label>'+
                                        '<div class="col-sm-6">'+                                 
                                            '<div class="input-group">'+
                                                '<span class="input-group-addon">'+USER_ID+':</span>'+
                                                '<input type="text" class="form-control create-id focusedInput">'+
                                            '</div>'+
                                        '</div>\
                                      </div>\
                                      <div class="form-group">\
                                        <label class="col-sm-4 control-label">Global Permsission</label>\
                                        <div class="col-sm-3">\
                                         <select class="form-control create-permission" data-value="n">\
                                            <option value="n" selected="selected">none</option>\
                                            <option value="r">read</option></select>\
                                        </div>\
                                      </div>\
                                      <div class="form-group">\
                                        <label class="col-sm-4 control-label">Description</label>\
                                        <div class="col-sm-7">\
                                          <textarea class="form-control create-descript" rows="3"></textarea>\
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
                                        var ws_name = $('.create-id').val();
                                        var perm = $('.create-permission option:selected').val();
                                        var descript = $('.create-descript').val();



                                        if (ws_name === '') {
                                            $prompt.addAlert('must enter a workspace name');
                                            $('.create-id').focus();
                                            return;
                                        }                   

                                        // check to see if there's a colon in the user project name already
                                        // if there is and it's the user's username, use it. If it's not throw error.
                                        // Otherwise, append "username:"
                                        var s_ws = ws_name.split(':');
                                        var error;
                                        if (s_ws.length > 1) {
                                            if (s_ws[0] == USER_ID) {
                                                var proj = USER_ID+':'+s_ws[1];
                                            } else {
                                                error = 'Only your username ('+USER_ID+') may be used before a colon';
                                                
                                            }
                                        } else {
                                            var name = USER_ID+':'+ws_name
                                        }

                                        if (error) {
                                            $prompt.addCover(error, 'danger');
                                        } else {
                                            var params = {
                                                workspace: name,
                                                globalread: perm,
                                                description: descript
                                            };                                            
                                            var prom = kb.ws.create_workspace(params);
                                            $prompt.addCover()
                                            $prompt.getCover().loading()
                                            $.when(prom).done(function(){
                                                $prompt.addCover('Created workspace: '+ws_name, 'success');
                                                    scope.loadObjectTable()

                                                var btn = $('<button type="button" class="btn btn-primary">Close</button>');
                                                btn.click(function() { 
                                                    $prompt.closePrompt(); 
                                                });

                                                $prompt.data('dialogModal').find('.modal-footer').html(btn);                                            
                                            }).fail(function(e) {
                                                $prompt.addCover(e.error.message, 'danger');                                            
                                            })
                                        }
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
                    

                    var cloneModal = $('<div class="kbase-prompt"></div>').kbasePrompt({
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


                                        var params = {
                                            wsi: {workspace: ws_name},
                                            workspace: new_ws_id,
                                            globalread: perm
                                        };

                                        if (new_ws_id === '') {
                                            $prompt.addAlert('must enter');
                                            $('.new-ws-id').focus();
                                            return;
                                        }                   

                                        var prom = kb.ws.clone_workspace(params);
                                        $prompt.addCover()
                                        $prompt.getCover().loading()
                                        $.when(prom).done(function(){
                                            $prompt.addCover('Cloned workspace: '+new_ws_id);
                                            scope.loadObjectTable();
                                        }).fail(function() {
                                            $prompt.addCover('This workspace name already exists.', 'danger');
                                        })

                                }
                            }]
                        }
                    )

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
                                    var params = {workspace: ws_name}

                                    var prom = kb.ws.delete_workspace(params);
                                    $prompt.addCover()
                                    $prompt.getCover().loading()
                                    $.when(prom).done(function(){
                                        $prompt.addCover('Deleted workspace: '+ws_name);
                                        scope.loadObjectTable();
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
                var showObjOpts = false;
                var checkedList = []

                scope.loadObjTable = function() {
                    showObjOpts = false;
                    checkedList = []

                    var tableSettings = {
                        "sPaginationType": "bootstrap",
                        //"sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aaData": [],
                        "fnDrawCallback": events,
                        "aaSorting": [[ 3, "desc" ]],
                      "aoColumns": [
                          (USER_ID ? { "sTitle": "", bSortable: false} : { "sTitle": "", bVisible: false}),
                          { "sTitle": "Name"}, //"sWidth": "10%"
                          { "sTitle": "Type", "sWidth": "20%"},
                          { "sTitle": "Last Modified", "iDataSort": 5},
                          { "sTitle": "Owner"},
                          { "sTitle": "unix time", "bVisible": false, "sType": 'numeric'}                   

                      ],                         
                        "oLanguage": {
                            "sEmptyTable": "No objects in workspace",
                            "sSearch": "Search:"
                        }
                    }

                    // clear object view every load
                    $(element).html('')
                    $(element).loading('loading '+ws+'...')

                    // load workspace objects
                    var prom = kb.ws.list_objects({workspaces: [ws]});
                    var prom2 = kb.ws.list_objects({workspaces: [ws], showOnlyDeleted: 1})
                    $.when(prom, prom2).done(function(data, deleted_objs){
                        $(element).rmLoading();

                        var table_id = "obj-table-"+ws.replace(':',"_");
                        $(element).append('<table id="'+table_id+'" \
                            class="table table-bordered table-striped" style="width: 100%;"></table>')    

                        var tableobjs = formatObjs(data);
                        var wsobjs = tableobjs[0];
                        var type_counts = tableobjs[1];

                        tableSettings.aaData = wsobjs;

                        // load object table
                        var table = $('#'+table_id).dataTable(tableSettings);

                        // if there are objects, add 'select all' button, type filter,
                        // and trash bin.
                        if (data.length > 0) {

                            // if logged in, add select all button to table options 
                            //datatables.bootstrap file for template
                            if (USER_ID) {
                                $('.table-options').append('<button class="btn btn-default btn-select-all">\
                                    <div class="ncheck check-option"></div></button> ');
                            }

                            // add type filter
                            var select = $('<select class=" type-filter form-control">\
                                                <option selected="selected">All Types</option> \
                                            </select>')
                            for (var type in type_counts) {
                                select.append('<option data-type="'+type+'">'+type+'  ('+type_counts[type]+')</option>');
                            }
                            $('.table-options').append(select);

                            // event for type filter
                            $('.type-filter').change( function () {
                                if ($(this).val() == "All Types") {
                                    table.fnFilter('', 2)
                                } else {
                                    table.fnFilter( $(this).find('option:selected').data('type'), 2);
                                }    
                            });


                            // if logged in, add trash bin link
                            if (USER_ID) {
                                var trash_btn = $('<a class="btn-trash pull-right">Trash \
                                            <span class="badge trash-count">'+deleted_objs.length+'</span><a>');
                                trash_btn.click(function(){
                                    displayTrashBin(deleted_objs)
                                })
                                $('.dataTables_filter').append(trash_btn);
                            }


                            // event for when an object checkbox is clicked
                            checkBoxObjectClickEvent('.obj-check-box');

                            // load description above table if there is one.
                            //var p = kb.ws.get_workspace_description({workspace: ws})
                            //$.when(p).done(function(d){
                            //    if (d != null) {
                            //        $(element).parent().prepend('<div class="text-muted ws-descript" \
                            //            style="line-height: 2.2em">'+d+'</div>');
                            //    }
                            //})
                        }
                    }).fail(function(e){
                        $(element).html('<div class="alert alert-danger">'+e.error.message+'</div>');
                    })

                    // resinstantiate all events.
                    events();
                } // end scope.loadObjTable

                scope.loadObjTable();

                // function that takes json for the object table and formats
                function formatObjs(objs) {
                    var wsobjs = []
                    var type_counts = {}

                    for (var i in objs) {
                        var obj = objs[i];
                        var id = obj[1];
                        var type = obj[2].slice(obj[2].indexOf('.')+1);
                        var timestamp = getTimestamp(obj[3].split('+')[0]);
                        var date = formateDate(timestamp);
                        var instance = obj[4];
                        var owner = obj[5];
                        var ws = obj[7]


                        var check = '<div class="ncheck obj-check-box check-option"'
                                + ' data-workspace="' + ws + '"'
                                + ' data-type="' + type + '"'
                                + ' data-id="' + id + '"></div>';

                        var wsarray = [check, 
                                       id,
                                       type,
                                       date,
                                       owner,
                                       timestamp
                                       ];

                        if (type in type_counts) {
                            type_counts[type] = type_counts[type] + 1;
                        } else {
                            type_counts[type] = 1;
                        }

                        //if (type == 'FBA') {
                        //    wsarray[0] = '<a class="obj-id" data-obj-id="'+id+'" data-obj-type="'+type+'">'
                         //               +id+'</a> (<a class="show-versions">'+instance+'</a>)'
                                        //+'<a class="add-to-mv pull-right">'
                                        //+'add <span class="glyphicon glyphicon-plus-sign"></span> '
                                        //+'</a>';

                        var match = ( type.split('-')[0].match(/^(Genome|FBAModel|Media|FBA|Annotation|Cmonkey)$/) 
                                        !== null ? true : false);

                        if (match) {
                            var new_id = '<a class="obj-id" data-ws="'+ws+'" data-obj-id="'+id+'" data-obj-type="'+type+'">'
                                    +id+'</a> (<a class="show-versions">'+instance+'</a>)\
                                        <a class="btn-show-info hide pull-right">More</a>'
                        } else {
                            var new_id = '<span class="obj-id" data-obj-id="'+id+'" data-obj-type="'+type+'">'
                                    +id+'</span> (<a class="show-versions">'+instance+'</a>)\
                                        <a class="btn-show-info hide pull-right">More</a>';
                        }

                        wsarray[1] = new_id
                        wsobjs.push(wsarray);
                    }
                    return [wsobjs, type_counts]
                }

                // events for object table.  
                // This is reloaded on table change/pagination
                function events() {
                    // event for clicking on a workspace id
                    $('.obj-id').unbind('click');                    
                    $('.obj-id').click(function(){
                        var type = $(this).data('obj-type').split('-')[0];
                        var id = $(this).data('obj-id');
                        var ws = $(this).data('ws');

                        if (type == 'Genome') {
                            scope.$apply( $location.path('/genomes/'+ws+'/'+id) );
                        } else if (type == 'FBAModel') {
                            scope.$apply( $location.path('/models/'+ws+'/'+id) );
                        } else if (type == 'FBA') {
                            scope.$apply( $location.path('/fbas/'+ws+'/'+id) );
                        } else if (type == 'Media') {
                            scope.$apply( $location.path('/media/'+ws+'/'+id) );
                        } else if (type == 'Cmonkey') {
                            scope.$apply( $location.path('/cmonkey/'+ws+'/'+id) );                            
                        } else if (type == 'Bambi') {
                            scope.$apply( $location.path('/bambi/'+ws+'/'+id) );                            
                        }
                    })

                    $('.obj-id').parents('td').unbind('click');
                    $('.obj-id').parents('td').hover(function() {
                        $(this).find('.btn-show-info').removeClass('hide');
                    }, function() {
                        $(this).find('.btn-show-info').addClass('hide');
                    })

                    $('.btn-show-info').unbind('click');
                    $('.btn-show-info').click(function() {
//                        var type = $(this).prev('.obj-id').data('.obj-type').split('.')[0];
                        var id = $(this).parent('td').find('.obj-id').data('obj-id');

                        showObjectInfo(ws, id);
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
                    $('.show-versions').unbind('click')
                    $('.show-versions').click(function() {
                        var type = $(this).prev('.obj-id').data('obj-type');
                        var id = $(this).prev('.obj-id').data('obj-id');

                        var historyModal = $('<div class="history-modal"></div>').kbasePrompt({
                                title : 'History of '+id,
                                //body : '',
                                modalClass : '', 
                                controls : ['closeButton']
                            }
                        );

                        historyModal.openPrompt();
                        var modal_body = historyModal.data('dialogModal').find('.modal-body').loading();
                        historyModal.data('dialogModal').find('.modal-dialog').css('width', '800px')

                        var prom = kb.ws.get_object_history({workspace: ws, name: id});
                        $.when(prom).done(function(data) {
                            modal_body.rmLoading();
                            modal_body.append('<span class="h5"><b>Name</b></span>: '+id+'<br>')                            
                            modal_body.append('<span class="h5"><b>Database ID</b></span>: '+data[0][0]+'<br>')
                            //modal_body.append('<b>Type</b>: '+data[0][2])                            
                            var info = $('<table class="table table-striped table-bordered table-condensed">');
                            var header = $('<tr><th>Mod Date</th>\
                                                <th>Vers</th>\
                                                <th>Type</th>\
                                                <th>Owner</th>\
                                                <th>Cmd</th></tr>');
                            info.append(header);
                            for (var i=0; i<data.length; i++) {
                                var ver = data[i];
                                var row = $('<tr>');
                                row.append('<td>' + ver[3].split('+')[0].replace('T',' ') + '</td>'
                                         + '<td>' + ver[4] + '</td>'
                                         + '<td>' + ver[2] + '</td>'
                                         + '<td>' + ver[5] + '</td>'
                                         + '<td>' + ver[7] + '</td>');
                                info.append(row);
                            }

                            modal_body.append(info)
                        })
                    })

                    checkBoxObjectClickEvent()
                }


                // event for when an object is checked
                function checkBoxObjectClickEvent() {
                    // if select all checkbox was clicked
                    $('.btn-select-all').unbind('click') 
                    $('.btn-select-all').click(function(){
                        // if select all button is already checked, removed all checked
                        if ($(this).find('.check-option').hasClass('ncheck-checked')) {
                            $('.obj-check-box').removeClass('ncheck-checked');
                            $(this).find('.check-option').removeClass('ncheck-checked');
                            checkedList = []
                        // otherwise, check all
                        } else {
                            $('.obj-check-box').addClass('ncheck-checked');
                            $(this).find('.check-option').removeClass('ncheck-minus');
                            $(this).find('.check-option').addClass('ncheck-checked');

                            checkedList = [];
                            $('.obj-check-box').each(function(){
                                var id = $(this).attr('data-id');
                                var dataWS = $(this).attr('data-workspace');
                                var dataType = $(this).attr('data-type');
                                checkedList.push([id, dataWS, dataType]);
                            })
                        }

                        if (!showObjOpts){
                            addOptionButtons()
                            objOptClick()
                            showObjOpts = true;
                        }
                        if (checkedList.length == 0){
                            $('.object-options').html('');
                            showObjOpts = false;                            
                        } 


                    })


                    // checkbox click event
                    $('.obj-check-box').unbind('click');
                    $('.obj-check-box').click(function(){
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


                        if (!showObjOpts){
                            addOptionButtons()
                            objOptClick()
                            showObjOpts = true;
                        }

                        if (checkedList.length == 0){
                            $('.object-options').html('');
                            $('.btn-select-all').find('.check-option')
                                        .removeClass('ncheck-checked');                            
                            showObjOpts = false;
                        } 
                    })

                }

                function addOptionButtons() {
                    var options = $('<span class="object-options">');

                    options.append('<button class="btn btn-danger btn-delete-obj">\
                        <span class="glyphicon glyphicon-trash"></span></button> ');

                    options.append('<div class="btn-group"><button class="btn btn-default btn-mv-dd" \
                                        data-toggle="dropdown">\
                                    <span class="glyphicon glyphicon-folder-open"></span>\
                                    <span class="caret"></span></button>\
                                    <ul class="dropdown-menu" role="menu">\
                                        <!--<li><a class="btn-mv-obj">Move</a></li>-->\
                                        <li><a class="btn-cp-obj">Copy</a></li>\
                                    </ul></div>');
                    // if user has narrative home workspace, add option to copy there
                    if (scope.workspace_dict[USER_ID+':home']) {
                        var dd = options.find('.dropdown-menu')
                        dd.append('<li class="divider"></li>');
                        dd.append('<li><a class="btn-mv-obj-to-nar">Copy to Narrative Home</a></li>');
                    }

                    //options.find('.btn-mv-obj').on('click', moveObjects);
                    options.find('.btn-cp-obj').on('click', copyObjects);
                    options.find('.btn-mv-obj-to-nar').on('click', copyObjectsToNarrative);                                        


                    var container = $('.table-options').append(options);
                }
 
                // events for top row options on objects, after checked
                function objOptClick() {
                    $('.btn-delete-obj').unbind('click')
                    $('.btn-delete-obj').click(function(){
                        deleteObjects()
                    });

                    $('.opt-dropdown ul li').unbind('click')
                    $('.opt-dropdown ul li').click(function(){
                        if ($(this).attr('opt') == 'copy'){
                            copyObjects();
                        } else if ($(this).attr('opt') == 'move'){
                            moveObjects();
                        }
                    })
                }

                function showObjectInfo(ws, id) {
                    var info_modal = $('<div></div>').kbasePrompt({
                            title : id,
                            modalClass : '', 
                            controls : ['closeButton']
                        })

                    info_modal.openPrompt();
                    info_modal.data('dialogModal').find('.modal-dialog').css('width', '500px');
                    var modal_body = info_modal.data('dialogModal').find('.modal-body');

                    var params = [{workspace: ws, name: id}]
                    var prom = kb.ws.get_object_info(params);
                    modal_body.loading();
                    $.when(prom).done(function(data) {
                        modal_body.rmLoading();
                        var data = data[0];  // only 1 object was requested
                        
                        modal_body.append('<h4>Meta Data</h4>');
                        if (data[10] > 0) {
                            var table = $('<table class="table table-striped table-bordered table-condensed">');
                            var keys = [];
                            for (var key in data[10]) {
                                table.append('<tr><td><b>'+key+'</b></td><td>'+data[i]+'</td></tr>')
                            }
                            modal_body.append(table);
                        } else {
                            modal_body.append('none');                            
                        }

                        var items = ['ID', 'Name', 'Type', 'Moddate', 'Instance','Command',
                                        'Owner','Workspace','Reference','Checksum']
                        modal_body.append('<h4>Properties</h4>');
                        var table = $('<table class="table table-striped table-bordered table-condensed">');
                        for (var i=0; i <data.length-1; i++) {
                            table.append('<tr><td><b>'+items[i]+'</b></td><td>'+data[i]+'</td></tr>')
                        }
                        modal_body.append(table);                        

                        var download = $('<a class="btn btn-default pull-left">Download\
                                    <span class="glyphicon glyphicon-download-alt"></span></a>')
                        download.click(function() {

                            var saveData = (function () {
                                var a = document.createElement("a");
                                document.body.appendChild(a);
                                a.style = "display: none";
                                return function (data, fileName) {
                                    var json = JSON.stringify(data),
                                        blob = new Blob([json], {type: "octet/stream"}),
                                        url = window.URL.createObjectURL(blob);
                                    a.href = url;
                                    a.download = fileName;
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                };
                            }());

                            var prom = kb.ws.get_objects([{workspace: ws, name:id}])
                            $.when(prom).done(function(json) {
                                var fileName = id+'.'+data[4]+'.json';
                                saveData(json[0], fileName);
                            })

                        })
                        info_modal.data('dialogModal').find('.modal-footer .text-left').append(download);

                        var open = $('<a class="open-obj pull-left">Open</a>')
                        open.click(function() {
                            var fileName = id+'.'+data[4]+'.json';
                            var jsonWindow = window.open(fileName,"_blank");
                            var prom = kb.ws.get_objects([{workspace: ws, name:id}])
                            $.when(prom).done(function(json) {
                                jsonWindow.document.write(JSON.stringify(json[0]));
                            })                            
                        })
                        info_modal.data('dialogModal').find('.modal-footer .text-left').append(open);
                    })





                }

                var trashbin;
                function displayTrashBin(objs) {
                    var tableSettings = {
                        "sPaginationType": "bootstrap",
                        //"sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aaData": [],
                        //"fnDrawCallback": events,
                        "aaSorting": [[ 3, "desc" ]],
                      "aoColumns": [
                          { "sTitle": "", bSortable: false},
                          { "sTitle": "Name"}, //"sWidth": "10%"
                          { "sTitle": "Type", "sWidth": "20%"},
                          { "sTitle": "Last Modified", "iDataSort": 5},
                          { "sTitle": "Owner"},
                          { "sTitle": "unix time", "bVisible": false, "sType": 'numeric'}                   

                      ],                         
                        "oLanguage": {
                            "sEmptyTable": "No objects in workspace",
                            "sSearch": "Search:"
                        }
                    }

                    // hide the objecttable, add back button{}
                    var table_id = 'obj-table-'+ws.replace(':','_');
                    $('#'+table_id+'_wrapper').hide();
                    $(element).prepend('<h4 class="trash-header"><a class="btn btn-primary">\
                        <span class="glyphicon glyphicon-circle-arrow-left"></span> Back</a> '+ws+' \
                        <span class="text-danger">Trash Bin</span> <small><span class="text-muted">(Undelete option coming soon)</span></small></h4>');

                    // event for back to workspace button
                    $('.trash-header .btn').unbind('click');
                    $('.trash-header .btn').click(function() {
                        if (typeof trashbin) { // fixme: cleanup
                            trashbin.fnDestroy();
                            $('#'+table_id+'-trash').remove();
                            trashbin = undefined;
                        }

                        $('.trash-header').remove();
                        $('#'+table_id+'_wrapper').show();
                    })

                    // if trash table hasn't already been rendered, render it
                    if (typeof trashbin == 'undefined') {
                        $(element).append('<table id="'+table_id+'-trash" \
                            class="table table-bordered table-striped" style="width: 100%;"></table>');

                        var tableobjs = formatObjs(objs);
                        var wsobjs = tableobjs[0];
                        var type_counts = tableobjs[1];

                        tableSettings.aaData = wsobjs;

                        // load object table
                        trashbin = $('#'+table_id+'-trash').dataTable(tableSettings);
                    } else {
                        $('#'+table_id+'-trash_wrapper').show()
                    }

                }


                function deleteObjects() {
                    var params = {};
                    var obj_ids = [];
                    for (var i in checkedList) {
                        var obj = {};
                        obj.workspace = checkedList[i][1];
                        obj.name = checkedList[i][0];
                        obj_ids.push(obj);
                    }

                    var prom = kb.ws.delete_objects(obj_ids)
                    $.when(prom).done(function(data){
                        scope.loadObjTable();
                    })
                }


                function copyObjects() {
                    var workspace = ws; // just getting current workspace

                    var wsSelect = $('<form class="form-horizontal" role="form">\
                                        <div class="form-group">\
                                          <label class="col-sm-5 control-label">Destination Workspace</label>\
                                        </div>\
                                     </div>');

                    var select = $('<select class="form-control select-ws"></select>')
                    for (var key in scope.workspace_dict) {
                        select.append('<option>'+key+'</option>')
                    }
                    select = $('<div class="col-sm-5">').append(select);
                    wsSelect.find('.form-group').append(select);

                    var copyObjectsModal = $('<div></div>').kbasePrompt({
                            title : 'Copy Objects',
                            body: wsSelect,
                            modalClass : '', 
                            controls : ['cancelButton',
                                {name : 'Copy',
                                type : 'primary',
                                callback : function(e, $prompt) {
                                    var ws = $('.select-ws option:selected').val()
                                    confirmCopy(ws);
                                }
                            }]
                        }
                    );

                    copyObjectsModal.openPrompt();
                }


                function copyObjectsToNarrative() {
                    confirmCopy(USER_ID+':home');
                }


                function confirmCopy(new_ws) {
                    var alert = '<div class="alert alert-danger"><strong>Warning</strong> Are you sure you want to copy these <b>'
                            +checkedList.length+'</b> objects to <i>'+new_ws+'</i>?';

                    var confirmCopy = $('<div></div>').kbasePrompt({
                            title : 'Confirm',
                            body: alert,
                            modalClass : '',
                            controls : [{
                                name: 'No',
                                type: 'default',
                                callback: function(e, $prompt) {
                                    $prompt.closePrompt();
                                    }
                                },
                                {name : 'Yes',
                                type : 'primary',
                                callback : function(e, $prompt) {
                                    var proms = [];
                                    for (var i in checkedList) {
                                        var obj_name = checkedList[i][0];
                                        var params = {from: {workspace: ws, name: obj_name},
                                                      to: {workspace: new_ws, name: obj_name}}
                                        var prom = kb.ws.copy_object(params);
                                        proms.push(prom);
                                    }

                                    $.when.apply($, proms).done(function() {
                                        $prompt.addCover('Copied objects to: <i>'+new_ws+'</i>');
                                        scope.loadObjectTable();
                                        var btn = $('<button type="button" class="btn btn-primary">Close</button>');
                                        btn.click(function() { $prompt.closePrompt(); })
                                        $prompt.data('dialogModal').find('.modal-footer').html(btn);
                                    }).fail(function(e) {
                                        $prompt.addCover('Could not copy some or all of the objects. '
                                                            +e.error.message, 'danger');
                                    })
                                }
                            }]
                        }
                    );
                    confirmCopy.openPrompt();
                }                

            }

        };
    })




function parse_name(name) {
    if (name.indexOf(USER_ID+':') != -1) {
        return name.split(':')[1];
    } else {
        return name;
    }
}



