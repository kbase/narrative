
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
.directive('modeltabs', function($location, $rootScope) {
    return {
        link: function(scope, element, attrs) {
            var ws = scope.ws;
            var id = scope.id;
            /*var p = $(element).kbasePanel({title: 'Model Details', 
                                           rightLabel: ws ,
                                           subText: id,
                                           type: 'FBAModel', 
                                           widget: 'modeltabs'});
                */
            $(element).loading();

            //var prom = kb.req('fba', 'get_models',
            //            {models: [id], workspaces: [ws]});

            var prom = kb.get_model(scope.ws, scope.id)
            $.when(prom).done(function(data){
                console.log('model data', data)
                $(element).rmLoading();

                $rootScope.org_name = data[0].data.name;
                scope.$apply();

                $(element).kbaseModelTabs({modelsData: data, api: kb.fba, ws: ws});
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
            /*var p = $(element).kbasePanel({title: 'FBA Details', 
                                           rightLabel: scope.ws,
                                           subText: scope.id,
                                           widget: 'fbatabs'});
            */
            //p.loading();

            //var prom = kb.req('fba', 'get_fbas',
            //            {fbas: [scope.id], workspaces: [scope.ws]});

            $(element).loading();
            console.log('referenced objects', scope.selected)
            var p = kb.ws.list_referencing_objects(scope.selected)
            $.when(p).done(loadTabs)
                     .fail(function() {
                        $(element).html("<h5>There are currently no FBA \
                                            results associated with this model.\
                                              You may want to FBA analysis.</h5>")
                     })


            function loadTabs(data) {
                // only care about first object
                var data = data[0]
                console.log('referenced objects', data)

                var fba_refs = []
                for (var i in data) {
                    var meta = data[i];
                    var type = meta[2].split('-')[0]

                    if (type == "KBaseFBA.FBA") {
                        fba_refs.push({ws: meta[7], 
                                       name: meta[1], 
                                       date: kb.ui.formateDate(meta[3]),
                                       timestamp: kb.ui.getTimestamp(meta[3])
                                      });
                    }
                }

                fba_refs.sort(compare)
                console.log('fba_refs', fba_refs)

                var vers = $('<select>');
                for (var i in fba_refs) {
                    var ref = fba_refs[i];
                    vers.append('<option>'+ref.name+' ('+ref.ws+') '+'['+ref.date+'</option>')
                }
                $(element).prepend(vers)

                var p1 = kb.get_fba(fba_refs[0].ws, fba_refs[0].name)
                $.when(p1).done(function(d){
                    $(element).rmLoading();
                    var data = d;
                    $(element).kbaseFbaTabs({fbaData: data});
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

            function compare(a,b) {
              if (a.timestamp < b.timestamp)
                 return -1;
              if (a.timestamp > b.timestamp)
                return 1;
              return 0;
            }



        } /* end link */
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



.directive('fbapathways', function($location) {
    return {
        link: function(scope, element, attrs) {
            var map_ws = 'nconrad:paths';
            var p = $(element).kbasePanel({title: 'Pathways', 
                                           type: 'Pathway',
                                           rightLabel: map_ws,
                                           subText: scope.id});
            p.loading();

            var prom1 = kb.get_models(scope.ws, scope.id);
            $.when(prom1).done(function(fbas_data) {
                $(p.body()).pathways({fbaData: fbas_data, 
                            ws: map_ws, defaultMap: scope.defaultMap,
                            scope: scope})

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
            console.log('*************')
            var p1 = kb.req('ws', 'get_objects',
                        [{name: scope.id, workspace: scope.ws}]);
            $.when(p1).done(function(d) {
                var d = d[0].data;
                $(p.body()).kbasePathway({ws: scope.ws,
                                          mapID: scope.id, 
                                          mapData: d, 
                                          editable:true})
            }).fail(function(e){
                    $(p.body()).append('<div class="alert alert-danger">'+
                                e.error.message+'</div>');
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
            $(element).append('<b>Sorry!</b>  No landing page is availble for this object. \
                            In the meantime, view the JSON below or consider contributing.')

            $(element).loading()
            var p = kb.req('ws', 'get_object', 
                    {workspace: scope.ws, id: scope.id})
            $.when(p).done(function(data) {
                var data = data;
                $(element).rmLoading();
                scope.data = data;
                displayData(data);
            })

            function displayData(data) {
                $(element).append('<h3>Metadata</h3><br>');
                var c = $('<div id="metadata">');
                $(element).append(c);
                c.JSONView(JSON.stringify(data.metadata));

                $(element).append('<h3>Data</h3><br>');
                var c = $('<div id="data">');
                $(element).append(c);
                c.JSONView(JSON.stringify(data.data))
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




