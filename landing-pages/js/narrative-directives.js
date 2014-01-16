
/*
 *  Directives
 *  
 *  These can be thought of as the 'widgets' on a page.  
 *  Scope comes from the controllers.
 *
*/


angular.module('narrative-directives', []);
angular.module('narrative-directives')
    .directive('recentnarratives', function($location) {
        return {
            link: function(scope, element, attrs) {

                $(element).loading()
                project.get_narratives({
                    callback: function(results) {
                        $(element).rmLoading();
                        if (Object.keys(results).length > 0) {
                            console.log(results)
                            //first sort
                            for (var i in results) {
                                results[i].timestamp = getTimestamp(results[i].moddate);
                                results[i].nealtime = formateDate(results[i].timestamp) 
                                                ? formateDate(results[i].timestamp) : results[i].moddate.replace('T',' ');
                            }

                            scope.$apply(function() {
                                scope.narratives = results;
                                console.log('applied')
                            })

                        } else {
                            $(element).append('no narratives')

                        }
                    }
                })

            }  /* end link */
        };
    })






    .directive('recentprojects', function($location) {
        return {

            link: function(scope, element, attrs) {
                
            }

        };
    })

    .directive('projectlist', function($location) {
        return {
            templateUrl: 'partials/narrative/project_table.html',
            link: function(scope, element, attrs) {
                $('body').scrollspy({ target: '#sidebar'});


                var tableId = 'project-table';
                var table;


                // this "api" method loads the project/narrative table; 
                scope.loadData = function() {
                    //tableEle.remove();
                    if (table) {
                        $('#'+tableId).dataTable().fnDestroy();                     
                        $('#'+tableId).remove();
                        $(element).append('<table class="table table-bordered" id="'+tableId+'"></table>')
                    }

                    $(element).loading();
                    var proj_ids = []

                    project.get_projects({
                        callback: function(projs) {
                            var projects = [];

                            for (var key in projs) {
                                projects.push([key, 'blah']);
                                proj_ids.push(projs[key].id);
                            }

                            getNarratives(proj_ids);


                        }
                    })
                }

                scope.loadData();


                function getNarratives(proj_ids) {
                    project.get_narratives({project_ids:proj_ids, 
                        callback: function(nars){
                            $(element).rmLoading();                                

                            var narratives = nars.slice(0);

                            var nar_projs = []
                            for (var i in narratives) {
                                var nar = narratives[i];
                                var nar_id = nar.id;
                                var proj = nar.workspace; // projects are workspaces right now
                                nar.id = '<a href="http://narrative.kbase.us/'
                                            +proj+'.'+nar_id+'" >'+nar_id+'</a>';
                                // projects are workspaces right now
                                nar.project = '<span class="proj-link" data-proj="'+proj+'"><span class="caret"></span>\
                                                 <i>Project</i> <b>'+proj+'</b></span>';//<b>Project:</b>


                                nar.timestamp = getTimestamp(nar.moddate)
                                nar.moddate = formateDate(nar.timestamp) ? formateDate(nar.timestamp) : nar.moddate.replace('T',' ')

                                //nar.moddate = nar.moddate

                                nar.deleteButton = '<span data-proj="'+proj+'" data-nar="'+nar_id+'" class="glyphicon glyphicon-trash btn-delete-narrative"></span>'

                                //fixme: wow!  This is horrible.
                                nar.users = '<span id="'+ nar.workspace+"-"+nar_id+'_users" >loading...</span>';
                                addUserColumn(nar.workspace, nar_id)

                
                                nar_projs.push(nar.workspace)
                                //nar.users = 
                            }

                            // if project is empty, add to empty_projects.

                            var empty_projects = []
                            for (var i in proj_ids) {
                                if (nar_projs.indexOf(proj_ids[i]) == -1) {
                                    //empty_projects.push(proj_ids[i])
                                    narratives.push({project: '<span class="caret"></span> <i>Project</i>  <b>'+proj_ids[i]+'</b>',
                                                    id: '<span class="text-muted">Empty Project</span>', 
                                                    owner: '', moddate: '', users: '', deleteButton: '', timestamp: ''})
                                }
                            }

                            buildTable(narratives);                                
                        }
                    })

                }


                function addUserColumn(ws, id) {
                    project.get_project_perms({
                        project_id: ws,
                        callback: function(results) {
                            var user_list = formatUsers(results);
                            $("#"+ws+"-"+id+"_users").html(user_list);
                        }
                    });                    
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
                              { "sTitle": "Shared With", "mData": "users"},
                              { "sTitle": "Last Modified", "mData": "moddate", "iDataSort": 6},
                              { "sTitle": "", "mData": "deleteButton", 'bSortable': false, 'sWidth': '1%'},
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
                        new FixedHeader( table , {offsetTop: 50, "zTop": 1000});
                        //$('.fixedHeader').remove();                         

                }



                function events() {

                    // adding buttons to project header
                    $('.group-item-expander').each(function() {
                        var proj = $(this).find('.proj-link').data('proj')                        

                        $(this).append('<span class="proj-opts pull-right">\
                                          <a class="btn btn-default btn-xs btn-new-narrative"><span class="glyphicon glyphicon-plus"></span> Narrative</a> \
                                          <a class="btn-view-data" data-proj="'+proj+'" >Data</a> |\
                                          <a class="edit-perms">Manage</a>\
                                       </span>');
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
                        editPermsModal(proj)
                    })

                    // event for delete narrative button
                    $('.btn-delete-narrative').unbind('click')
                    $('.btn-delete-narrative').click(function(e){
                        var proj = $(this).data('proj');
                        var nar = $(this).data('nar');                        
                        deleteNarrativeModal(proj, nar);
                    })                    


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
                                    name = name.replace(/\W/g,"");
                                    

                                    if (proj_id === '') {
                                        $prompt.addAlert('must enter');
                                        $('.create-id').focus();
                                        return;
                                    }               

                                    //create the new narrative in ws
                                    $prompt.addCover()
                                    $prompt.getCover().loading()                                  
                                    project.new_narrative({
                                        narrative_id: name, 
                                        project_id: proj_id,
                                        callback: function(results) {

                                            $prompt.addCover('Created narrative <b><i>'+name
                                                            +'</i></b> in project <b><i>'+proj_id+'</i></b>');
                                            scope.loadData()

                                            var btn = $('<button type="button" class="btn btn-primary">Close</button>');
                                            btn.click(function() { 
                                                $prompt.closePrompt(); 
                                            });

                                            $prompt.data('dialogModal').find('.modal-footer').html(btn);     

                                            //redirect to the narrative page
                                            //var userId = $("#login-widget").kbaseLogin("get_kbase_cookie", "user_id");
                                            //window.location.href = "http://narrative.kbase.us/"+proj_id+"."+name;
                                        }
                                    }); 

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
                                    project.new_narrative({
                                        workspace: proj_id, 
                                        id: nar_id,
                                        type: 'Narrative',
                                        callback: function(results) {
                                            $prompt.addCover('Deleted narrative: '+nar_id);
                                            scope.loadData()

                                            var btn = $('<button type="button" class="btn btn-primary">Close</button>');
                                            btn.click(function() { 
                                                $prompt.closePrompt(); 
                                            });

                                            $prompt.data('dialogModal').find('.modal-footer').html(btn);     
                                        }
                                    }); 

                                }
                            }]
                        }
                    );

                    deleteModal.openPrompt();
                    deleteModal.addAlert('<strong>Warning</strong> this narrative will be deleted!');
                }


                function deleteProject(proj_id)  {



                }



                function editPermsModal(proj_id) {

                    var perm_dict = {'a': 'Admin',
                                     'r': 'Read',
                                     'w': 'Write',
                                     'o': 'Owner',
                                     'n': 'None'};


                    var content = $('<div class="manage-content"></div>');
                    // modal for managing project permissions, and delete
                    var permData; 
                    var manage_modal = $('<div></div>').kbasePrompt({
                            title : 'Manage Project',
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
                                            $prompt.addCover(e.error.message, 'danger');                                            
                                        })
                                }
                            }]
                        })

                    manage_modal.openPrompt();
                    manage_modal.data('dialogModal').find('.modal-dialog').css('width', '500px');

                    var deleteWS = $('<button class="btn btn-link pull-right">Delete</button>');
                    deleteWS.click(function() {
                        manage_modal.closePrompt();
                        deleteWorkspace(ws_name);
                    });

                    var modal_body = manage_modal.data('dialogModal').find('.modal-body');

                    // if user is logged in and admin 

                    var placeholder = $('<div></div>').loading()
                    modal_body.append(placeholder); 

                    project.get_project_perms({
                        project_id: proj_id,
                        callback: function(data) {
                            permData = data

                            placeholder.rmLoading();

                            modal_body.append('<h5>User Permissions <small><a class="edit-perms">Edit</a></small><h5>')


                            var perm_container = $('<div class="perm-container"></div>');
                            modal_body.append(perm_container);

                            var perm_table = getPermTable(data)
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

                            del_proj.click(function() { deleteProject(proj_id) });
                            manage_modal.data('dialogModal').find('.modal-footer .text-left').append(del_proj);
                        }
                    })



                    //table for displaying user permissions
                    function getPermTable(data) {
                        var table = $('<table class="table table-bordered perm-table"></table>');
                        // if there are no user permissions, display 'none'
                        // (excluding ~global 'user' and owner)
                        var perm_count = Object.keys(data).length;

                        if (perm_count <= 2) {
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


            } // end link


        }

    })




//
// utility functions 
//

function getTimestamp(datetime){
    var ymd = datetime.split('T')[0].split('-');
    var hms = datetime.split('T')[1].split(':');
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
        var time = d.toLocaleTimeString().split(':');
        return day + " at " + t[0]+':'+t[1]+' '+t[2].split(' ')[1]; //check
    } else {
        return false;
    }

}



var dayOfWeek = {0: 'Sun', 1: 'Mon', 2:'Tues',3:'Wed',
                     4:'Thurs', 5:'Fri', 6: 'Sat'}