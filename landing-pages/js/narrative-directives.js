
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
            template: "blah blah blah",
            link: function(scope, element, attrs) {
                $(element).append('blah blah blah')
            }  /* end link */
        };
    })






    .directive('recentprojects', function($location) {
        return {

            link: function(scope, element, attrs) {
                
            }

        };
    })

    .directive('projectlist', function() {
        return {
            templateUrl: 'partials/narrative/project_table.html',
            link: function(scope, element, attrs) {
                $(element).loading();

                project.get_projects({
                    callback: function(projs) {

                        var projects = [];
                        var proj_ids = [];
                        for (var key in projs) {
                            projects.push([key, 'blah']);
                            proj_ids.push(projs[key].id);
                        }

                        project.get_narratives({project_ids:proj_ids, 
                            callback: function(nars){
                                $(element).rmLoading();                                

                                var narratives = nars.slice(0);

                                var nar_projs = []
                               console.log('narratives',narratives)
                                for (var i in narratives) {
                                    var nar = narratives[i];
                                    nar.id = '<a href="http://narrative.kbase.us/'
                                                +nar.workspace+'.'+nar.id+'" >'+nar.id+'</a>';
                                    // projects are workspaces right now
                                    nar.project = '<span class="caret"></span> <b>Project:</b> '+nar.workspace 
                                    nar.moddate = nar.moddate.replace('T', ' ');
                                    nar_projs.push(nar.workspace)
                                }

                                // if project is empty, add to empty_projects.
                                var empty_projects = []
                                for (var i in proj_ids) {
                                    if (nar_projs.indexOf(proj_ids[i]) == -1) {
                                        //empty_projects.push(proj_ids[i])
                                        narratives.push({project: '<span class="caret"></span> <b>Project:</b> '+proj_ids[i],
                                                        id: '<span class="text-muted">Empty Project</span>', owner: '', moddate: ''})
                                    }
                                }

                                buildTable(narratives, empty_projects);                                
                            }
                        })


                    }
                })

                function getNarratives(proj_ids) {

                }


                function buildTable(narratives, empty_projs) {
                        var tableSettings = {
                            "sPaginationType": "bootstrap",
                            //"sPaginationType": "full_numbers",
                            //"iDisplayLength": 10,
                            //"aaData": [],
                            "fnDrawCallback": events,
                            //"aaSorting": [[ 3, "desc" ]],
                          "aoColumns": [
                              { "sTitle": "Name", "mData": "id"},
                              { "sTitle": "Owner", "mData": "owner"},
                              { "sTitle": "Project", "mData": "project"},
                              { "sTitle": "Last Modified", "mData": "moddate"}                              
                          ],                         
                            "oLanguage": {
                                //"sEmptyTable": "No objects in workspace",
                                "sSearch": "Search:"
                            }
                        }


                        tableSettings.aaData = narratives;

                        var table = $('#project-table').dataTable(tableSettings)
                                        .rowGrouping({iGroupingColumnIndex: 2,
                                                      bExpandableGrouping: true});

//                        $('#project-table').append('<td class="group -span-class-caret-span-b-project-b-nconrad-home group-item-expander expanded-group" colspan="3" data-group="-span-class-caret-span-b-project-b-nconrad-home" data-group-level="0">\
  //                                                  <span class="caret"></span> <b>Project:</b> nconrad_home</td>')
                }



                function events() {

                }

            }


        }

    })






