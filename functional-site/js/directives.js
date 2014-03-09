
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
                    $(p.body()).kbaseModelTabs({modelsData: data, api: kb.fba});
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

    .directive('pathways', function() {
        return {
            link: function(scope, element, attrs) {
                var p = $(element).kbasePanel({title: 'Pathways', 
                                               type: 'Pathway',
                                               rightLabel: 'N/A',
                                               subText: scope.id});
                p.loading();

                // fixme: seperate api for models and fba, add error messages
                var p1 = kb.req('fba', 'get_models',
                            {models: [scope.id], workspaces: [scope.ws]});
                //var p2 = kb.req('fba', 'get_fbas',
                //            {fbas: [scope.id], workspaces: [scope.ws]})                
                $.when(p1).done(function(d1, d2) {
                    $(p.body()).kbasePathways({modelData: d1})   
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