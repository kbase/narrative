
/*
 *  Directives
 *  
 *  These can be thought of as the 'widgets' on a page.  
 *  Scope comes from the controllers.
 *
*/


angular.module('lp-directives', []);
angular.module('lp-directives')
    .directive('objectlist', function($location) {
        return {
            link: function(scope, element, attr) {
                if (scope.type == 'models') {
                    var ws = scope.ws ? scope.ws : "KBaseCDMModels";

                    var p = $(element).kbasePanel({title: 'KBase Models', 
                                                       rightLabel: ws});
                    p.loading();
                    var prom = kb.req('ws', 'list_workspace_objects',
                                        {type: 'Model', workspace: ws})
                    $.when(prom).done(function(d){
                        $(p.body()).kbaseWSModelTable({ws: ws, data: d});
                        $(document).on('modelClick', function(e, data) {
                            var url = '/models/'+ws+'/'+data.id;
                            scope.$apply( $location.path(url) );
                        });
                    })
                } else if (scope.type == 'media') {
                    var ws = scope.ws ? scope.ws : "KBaseMedia"; 

                    var p = $(element).kbasePanel({title: 'KBase Media', 
                                                       rightLabel: ws});
                    p.loading();
                    var prom = kb.req('ws', 'list_workspace_objects',
                                        {type: 'Media', workspace: ws});

                    $.when(prom).done(function(d){
                        $(element).kbaseWSMediaTable({ws: ws, data: d});
                        $(document).on('mediaClick', function(e, data) {
                            var url = '/media/'+ws+'/'+data.id;
                            scope.$apply( $location.path(url) );
                        });
                    })
                } else if (scope.type == 'rxns') {
                    var p = $(element).kbasePanel({title: 'Biochemistry Reactions'});
                    p.loading();

                    var bioTable = $(p.body()).kbaseBioRxnTable(); 

                    var prom = getBio('rxns', p.body(), function(data) {
                        bioTable.loadTable(data);
                    });
                } else if (scope.type == 'cpds') {
                    var p = $(element).kbasePanel({title: 'Biochemistry Compounds'});
                    p.loading();

                    var bioTable = $(p.body()).kbaseBioCpdTable();

                    var prom = getBio('cpds', p.body(), function(data) {
                        bioTable.loadTable(data);
                    });
                }
            }
            
        };
    })
    .directive('memelist', function($location) {
        return {
            link: function(scope, element, attr) {
                var ws = scope.ws ? scope.ws : "AKtest"; 

                $(element).kbaseMemeTable({ws: ws, auth: scope.USER_TOKEN, userId: scope.USER_ID});
                $(document).on('memeClick', function(e, data) {
                    var url = '/meme/'+ws+'/'+data.id;
                    scope.$apply( $location.path(url) );
                });
            }
            
        };
    })
    .directive('modelmeta', function() {
        return {
            link: function(scope, element, attrs) {
                var p = $(element).kbasePanel({title: 'Model Info', 
                                               rightLabel: scope.ws,
                                               subText: scope.id});
                p.loading();

                var prom = kb.req('ws', 'get_objectmeta',
                            {type:'Model', id: scope.id, workspace: scope.ws});
                $.when(prom).done(function(data){
                    $(p.body()).kbaseModelMeta({data: data});
                })
            }
        };
    })
    .directive('modeltabs', function($location) {
        return {
            link: function(scope, element, attrs) {
                var ws = scope.ws;
                var id = scope.id;
                var p = $(element).kbasePanel({title: 'Model Details', 
                                               rightLabel: ws ,
                                               subText: id,
                                               type: 'FBAModel', 
                                               widget: 'modeltabs'});
                p.loading();

                var prom = kb.req('fba', 'get_models',
                            {models: [id], workspaces: [ws]});
                $.when(prom).done(function(data){
                    $(p.body()).kbaseModelTabs({modelsData: data, api: kb.fba, ws: ws});
                    $(document).on('rxnClick', function(e, data) {
                        var url = '/rxns/'+data.ids;
                        scope.$apply( $location.path(url) );
                    });  
                })
            }
        };
    })
    .directive('modelcore', function($location) {
        return {
            link: function(scope, element, attrs) {
                var ws = scope.ws;
                var id = scope.id;
                var p = $(element).kbasePanel({title: 'Core Metabolic Pathway', 
                                               rightLabel: ws,
                                               subText: id, 
                                               type: 'FBAModel', 
                                               widget: 'modelcore'});
                p.loading();

                var prom = kb.req('fba', 'get_models',
                            {models: [id], workspaces: [ws]})
                $.when(prom).done(function(data) {
                    $(p.body()).kbaseModelCore({ids: [id], 
                                                workspaces : [ws],
                                                modelsData: data});
                    $(document).on('coreRxnClick', function(e, data) {
                        var url = '/rxns/'+data.ids.join('&');
                        scope.$apply( $location.path(url) );
                    });  

                })
            }
        };
    })
    .directive('modelopts', function() {
        return {
            link: function(scope, element, attrs) {
                $(element).kbaseModelOpts({ids: scope.id, 
                                           workspaces : scope.ws})
            }
        };
    })
    .directive('fbameta', function() {
        return {
            link: function(scope, element, attrs) {
                var p = $(element).kbasePanel({title: 'FBA Info', 
                                               rightLabel: scope.ws,
                                               subText: scope.id});
                p.loading();
                var prom = kb.req('ws', 'get_objectmeta',
                            {type:'FBA', id: scope.id, workspace: scope.ws});
                $.when(prom).done(function(data){
                    $(p.body()).kbaseFbaMeta({data: data});                    
                });
            }
        };
    })
    .directive('fbatabs', function($location) {
        return {
            link: function(scope, element, attrs) {
                var p = $(element).kbasePanel({title: 'FBA Details', 
                                               rightLabel: scope.ws,
                                               subText: scope.id,
                                               widget: 'fbatabs'});
                p.loading();

                var prom = kb.req('fba', 'get_fbas',
                            {fbas: [scope.id], workspaces: [scope.ws]});
                $.when(prom).done(function(data){
                    $(p.body()).kbaseFbaTabs({fbaData: data});
                    $(document).on('rxnClick', function(e, data) {
                        var url = '/rxns/'+data.ids;
                        scope.$apply( $location.path(url) );
                    });        
                    $(document).on('cpdClick', function(e, data) {
                        var url = '/cpds/'+data.ids;
                        scope.$apply( $location.path(url) );
                    });                            
                })
            }
        };
    })
    .directive('fbacore', function($location) {
        return {
            link: function(scope, element, attrs) {
                var p = $(element).kbasePanel({title: 'Core Metabolic Pathway', 
                                               rightLabel: scope.ws,
                                               subText: scope.id, 
                                               type: 'FBA', 
                                               widget: 'fbacore'});
                p.loading();

                var prom1 = kb.req('fba', 'get_fbas',
                            {fbas: [scope.id], workspaces: [scope.ws]});
                $.when(prom1).done(function(fbas_data) {
                    var model_ref = fbas_data[0].modelref;
                    var wsid = parseInt(model_ref.split('/')[0]);
                    var objid = parseInt(model_ref.split('/')[1]);

                    var prom2 = kb.req('fba', 'get_models',
                            {models: [objid], workspaces: [wsid]});
                    $.when(prom2).done(function(models_data){
                        $(p.body()).kbaseModelCore({ids: [scope.id],
                                                    workspaces : [scope.ws],
                                                    modelsData: models_data,
                                                    fbasData: fbas_data});
                        $(document).on('coreRxnClick', function(e, data) {
                            var url = '/rxns/'+data.ids.join('&');
                            scope.$apply( $location.path(url) );
                        }); 
                    })
                })
            }
        };
    })

    .directive('pathways', function($location) {
        return {
            link: function(scope, element, attrs) {
                var type = scope.type;
                var map_ws = 'nconrad:paths';
                var p = $(element).kbasePanel({title: 'Pathways', 
                                               type: 'Pathway',
                                               rightLabel: map_ws,
                                               subText: scope.id});
                p.loading();

                if (type == "Model") {
                    var prom = kb.req('fba', 'get_models',
                                {models: [scope.id], workspaces: [scope.ws]});
                                       
                    $.when(prom).done(function(d) {
                        $(p.body()).pathways({modelData: d, 
                                    ws: map_ws, defaultMap: scope.defaultMap,
                                    scope: scope})   
                    }).fail(function(e){
                        $(p.body()).append('<div class="alert alert-danger">'+
                                    e.error.message+'</div>');
                    });

                } else if (type == "FBA") {
                    var prom = kb.req('fba', 'get_fbas',
                                {fbas: [scope.id], workspaces: [scope.ws]});                    
                    $.when(prom).done(function(d) {
                        $(p.body()).pathways({fbaData: d, 
                                    ws: map_ws, defaultMap: scope.defaultMap,
                                    scope: scope})   
                    }).fail(function(e){
                        $(p.body()).append('<div class="alert alert-danger">'+
                                    e.error.message+'</div>');
                    });
                }


                $.fn.pathways = function(options) {
                    self.models = options.modelData;
                    self.fbas = options.fbaData;
                    self.ws = options.ws;
                    self.default_map = options.defaultMap


                    var container = $(this);

                    var stroke_color = '#666';

                    console.log('called widget again')

                    var tableSettings = {
                                    "sPaginationType": "bootstrap",
                                    "iDisplayLength": 10,
                                    "aaData": [],
                                    "fnDrawCallback": events,
                                    "aaSorting": [[ 1, "asc" ]],
                                    "aoColumns": [
                                        { "sTitle": "Name"}, //"sWidth": "10%"
                                        //{ "sTitle": "Map id"} ,                            
                                        //{ "sTitle": "Rxn Count", "sWidth": "12%"},
                                        //{ "sTitle": "Cpd Count", "sWidth": "12%"},
                                        //{ "sTitle": "Source","sWidth": "10%"},
                                    ],                         
                                    "oLanguage": {
                                        "sEmptyTable": "No objects in workspace",
                                        "sSearch": "Search:"
                                    }
                                }

                    var tab = $('<li class="tab active"><a>Maps</a></li>')
                    tab.click(function(){
                        $location.search({map: 'list'})
                        scope.$apply();
                        $('.tab').removeClass('active');
                        $(this).addClass('active')
                        $('.tab-pane').removeClass('active');                             
                        $('#path-list').addClass('active');    
                    })
                    
                    var tabs = $('<ul class="nav nav-tabs"></ul>');
                    tabs.append(tab);

                    container.append(tabs);
                    container.prepend('<span class="label label-danger pull-right">Beta</span>')
                    container.append('<div class="tab-content" style="margin-top:15px;">\
                                          <div class="tab-pane active" style="margin-top:15px;" id="path-list"></div>\
                                      </div>');


                    function load_map_list() {
                        // load table for maps
                        var p = kb.ws.list_objects({workspaces: [self.ws]})
                        $.when(p).done(function(d){
                            var aaData = [];
                            for (var i in d) {

                                var obj = d[i]
                                var name = '<a class="pathway-link" data-map="'+obj[1]+'">'+obj[1]+'</a>';
                                aaData.push([name])
                            }

                            tableSettings.aaData = aaData; 

                            var table_id = 'pathway-table';
                            $('#path-list').append('<table id="'+table_id+'" \
                                           class="table table-bordered table-striped" style="width: 100%;"></table>');
                            var table = $('#'+table_id).dataTable(tableSettings);  
                        }).fail(function(e){
                            container.prepend('<div class="alert alert-danger">'+
                                        e.error.message+'</div>')
                        });
                    }
                    load_map_list()



                    self.loadMap = function(map) {
                        // there needs to be all this manual tab styling due to 
                        // url parms, i think.  I'm not sure
                        $('.tab').removeClass('active')
                        $('#path-tab-'+map).addClass('active');
                        $('.tab-pane').removeClass('active');                             
                        $('#path-'+map).addClass('active');                        
                        var p = kb.ws.get_objects([{workspace: self.ws, name: map}])
                        $.when(p).done(function(d) {
                            var d = d[0].data

                            $('#path-'+map).kbasePathway({ws: self.ws, 
                                                         mapID: map, 
                                                         mapData: d,
                                                         editable:true,
                                                         modelData: self.models,
                                                         fbaData: self.fbas
                                                     })
                        }).fail(function(e){
                            container.prepend('<div class="alert alert-danger">'+
                            e.error.message+'</div>')
                        });
                    }

                    function events() {
                        // event for clicking on pathway link
                        container.find('.pathway-link').unbind('click')
                        container.find('.pathway-link').click(function() {
                            var map = $(this).data('map');
                            new_map_tab(map)
                        });

                        // tooltip for hover on pathway name
                        container.find('.pathway-link').tooltip({title: 'Open path tab', placement: 'right', delay: {show: 500}});

                    } // end events


                    function new_map_tab(map) {
                        var tab = $('<li class="tab pathway-tab" data-map="'+map+'" id="path-tab-'+map+'"><a>'
                                            +map.slice(0, 10)+'</a>'+
                                    '</li>')          

                        container.find('.tab-content')
                                .append('<div class="tab-pane" id="path-'+map+'"></div>'); 

                        container.find('.nav-tabs').append(tab);

                        container.find('.pathway-tab').unbind('click');
                        container.find('.pathway-tab').click(function() {
                            console.log('clicked on tab')
                            var map = $(this).data('map');
                            $location.search({map: map})                           
                            scope.$apply();
                            self.loadMap(map);
                        }); 
                    }

                    if (self.default_map) {
                        new_map_tab(self.default_map);
                        self.loadMap(self.default_map);
                    } 
                }    

            }
        };
    })


    .directive('fbapathways', function($location) {
        return {
            link: function(scope, element, attrs) {
                var map_ws = 'nconrad:paths';
                var p = $(element).kbasePanel({title: 'Pathways', 
                                               type: 'Pathway',
                                               rightLabel: map_ws,
                                               subText: scope.id});
                p.loading();

                var prom1 = kb.req('fba', 'get_fbas',
                            {fbas: [scope.id], workspaces: [scope.ws]});
                $.when(prom1).done(function(fbas_data) {
                    var model_ref = fbas_data[0].modelref;
                    var wsid = parseInt(model_ref.split('/')[0]);
                    var objid = parseInt(model_ref.split('/')[1]);

                    $(p.body()).pathways({fbaData: fbas_data, 
                                ws: map_ws, defaultMap: scope.defaultMap,
                                scope: scope})
                    //$(p.body()).kbasePathways({fbaData: fbas_data, 
                    //            ws: map_ws, defaultMap: scope.defaultMap,
                    //            scope: scope})   

                }).fail(function(e){
                        $(p.body()).append('<div class="alert alert-danger">'+
                                    e.error.message+'</div>')
                });
            } //end link
        }
    })


    .directive('pathway', function() {
        return {
            link: function(scope, element, attrs) {
                var p = $(element).kbasePanel({title: 'Metabolic Pathway', 
                                               type: 'Pathway',
                                               rightLabel: 'N/A',
                                               subText: scope.id});
                p.loading();

                var p1 = kb.req('ws', 'get_object',
                            {id: scope.id, workspace: scope.ws});
                $.when(p1).done(function(d) {
                    $(p.body()).kbasePathway({ws: scope.ws,
                                              map_id: scope.id, 
                                              map_data: d.data, 
                                              editable:true})
                });

            }
        };
    })    

    .directive('mediadetail', function() {
        return {
            link: function(scope, element, attrs) {
                var p = $(element).kbasePanel({title: 'Media Details', 
                                               type: 'Media',
                                               rightLabel: scope.ws,
                                               subText: scope.id,
                                               widget: 'mediadetail'});
                p.loading();

                var prom = kb.req('fba', 'get_media',
                        {medias: [scope.id], workspaces: [scope.ws]})
                $.when(prom).done(function(data) {
                    $(p.body()).kbaseMediaEditor({ids: [scope.id], 
                                                  workspaces : [scope.ws],
                                                data: data});
                })
            }
        };
    })
    .directive('rxndetail', function() {
        return {
            link: function(scope, element, attrs) {
                $(element).loading()
                var prom = kb.req('fba', 'get_reactions',
                            {reactions: scope.ids})
                $.when(prom).done(function(data){
                    $(element).rmLoading();
                    $(element).kbaseRxn({data: data, ids: scope.ids});
                })
            }
        };
    })
    .directive('cpddetail', function() {
        return {
            link: function(scope, element, attrs) {
                $(element).loading()
                var prom = kb.req('fba', 'get_compounds',
                            {compounds: scope.ids});

                $.when(prom).done(function(data){
                    $(element).rmLoading();                     
                    $(element).kbaseCpd({data: data, ids: scope.ids});
                })
            }
        };
    })
    .directive('jsonviewer', function() {
        return {
            link: function(scope, element, attrs) {
                $(element).loading()
                var p = kb.req('ws', 'get_object', 
                        {workspace: scope.ws, id: scope.id})
                $.when(p).done(function(data) {
                    $(element).rmLoading();
                    scope.data = data;
                    displayData(data)
                })

                function displayData(data) {
                    for (key in data) {
                        $(element).append('<h3>'+key+'</h3><br>');
                        var c = $('<div id="data">')
                        $(element).append(c)
                        c.JSONView(JSON.stringify(data[key], {collapsed: true}))
                    }
                }

            }
        };
    })


    .directive('backbutton', function() {
        return {
            link: function(scope, element, attrs) {
                $(element).on('click', function() {
                    window.history.back();
                });
            }

        };
    })

    .directive('genomeoverview', function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                var p = $(element).kbasePanel({title: 'Genome Overview', 
                                               type: 'Genome',
                                               rightLabel: scope.ws,
                                               subText: scope.id,
                                               widget: 'genomeoverview'});
                p.loading(); 
                // not sure why this isn't loading first.  
                // I'm thinking data should be retrieved here.

                $(p.body()).KBaseGenomeOverview({genomeID: scope.id, workspaceID: scope.ws, kbCache: kb})
            }
        };
    })
    .directive('genomewiki', function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                var p = $(element).kbasePanel({title: 'Genome Wiki',
                                                type: 'Genome',
                                               rightLabel: scope.ws,
                                               subText: scope.id,
                                               widget: 'genomewiki'});
                p.loading();
                $(p.body()).KBaseWikiDescription({genomeID: scope.id, workspaceID: scope.ws, kbCache: kb})
            }
        };
    })




