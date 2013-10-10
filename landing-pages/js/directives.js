
/*
 *  Directives
 *  
 *  These can be thought of as the 'widgets' on a page.  
 *  Scope comes from the controllers.
 *
*/


angular.module('lp-directives', []);
angular.module('lp-directives')
    .directive('objectlist', function() {
        return {
            link: function(scope, element, attrs) {
                if (scope.type == 'models') {
                    var ws = scope.ws ? scope.ws : "KBaseCDMModels";

                    var panel = $(element).kbasePanel({title: 'KBase Models', 
                                                       rightLabel: ws});
                    panel.loading();
                    var prom = wsGet('listWSObject', 'Model', ws);
                    $.when(prom).done(function(d){
                        $(panel.body()).kbaseWSModelTable({ws: ws, data: d}); 
                    })
                } else if (scope.type == 'media') {
                    var ws = scope.ws ? scope.ws : "KBaseMedia"; 

                    var panel = $(element).kbasePanel({title: 'KBase Media', 
                                                       rightLabel: ws});
                    panel.loading();
                    var prom = wsGet('listWSObject', 'Media', ws);
                    $.when(prom).done(function(d){
                        $(element).kbaseWSMediaTable({ws: ws, data: d}); 
                    })
                } else if (scope.type == 'rxns') {
                    var panel = $(element).kbasePanel({title: 'Biochemistry Reactions'});
                    panel.loading();

                    var bioTable = $(panel.body()).kbaseBioRxnTable(); 

                    var prom = getBio('rxns', panel.body(), function(data) {
                        bioTable.loadTable(data);
                    });
                } else if (scope.type == 'cpds') {
                    var panel = $(element).kbasePanel({title: 'Biochemistry Compounds'});
                    panel.loading();

                    var bioTable = $(panel.body()).kbaseBioCpdTable();

                    var prom = getBio('cpds', panel.body(), function(data) {
                        bioTable.loadTable(data);
                    });
                }
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

                var prom = wsGet('objectMeta', 'Model', scope.ws, scope.id);
                $.when(prom).done(function(data){
                    $(p.body()).kbaseModelMeta({data: data});
                })
            }
        };
    })
    .directive('modeltabs', function() {
        return {
            link: function(scope, element, attrs) {
                var p = $(element).kbasePanel({title: 'Model Details', 
                                               rightLabel: scope.ws,
                                               subText: scope.id});
                p.loading();

                var prom = fbaGet('Model', scope.ws, scope.id)
                $.when(prom).done(function(data){
                    $(p.body()).kbaseModelTabs({modelsData: data});
                })
            }
        };
    })
    .directive('modelcore', function() {
        return {
            link: function(scope, element, attrs) {
                var p = $(element).kbasePanel({title: 'Core Metabolic Pathway', 
                                               rightLabel: scope.ws,
                                               subText: scope.id});
                p.loading();

                var prom = fbaGet('Model', scope.ws, scope.id)
                $.when(prom).done(function(data) {
                    $(p.body()).kbaseModelCore({ids: [scope.id], 
                                                workspaces : [scope.ws],
                                                modelsData: data});
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

                var prom = wsGet('objectMeta', 'FBA', scope.ws, scope.id);
                $.when(prom).done(function(data){
                    $(p.body()).kbaseFbaMeta({data: data});
                })
            }
        };
    })
    .directive('fbatabs', function() {
        return {
            link: function(scope, element, attrs) {
                var p = $(element).kbasePanel({title: 'FBA Details', 
                                               rightLabel: scope.ws,
                                               subText: scope.id});
                p.loading();

                var prom = fbaGet('FBA', scope.ws, scope.id)
                $.when(prom).done(function(data){
                    $(p.body()).kbaseFbaTabs({fbaData: data});
                })
            }
        };
    })
    .directive('fbacore', function() {
        return {
            link: function(scope, element, attrs) {
                var p = $(element).kbasePanel({title: 'Core Metabolic Pathway', 
                                               rightLabel: scope.ws,
                                               subText: scope.id});
                p.loading();

                var prom1 = fbaGet('FBA', scope.ws, scope.id);
                $.when(prom1).done(function(fbas_data) {
                    var model_ws = fbas_data[0].model_workspace;
                    var model_id = fbas_data[0].model;

                    var prom2 = fbaGet('Model', model_ws, model_id);
                    $.when(prom2).done(function(models_data){
                        $(p.body()).kbaseModelCore({ids: [scope.id], 
                                                    workspaces : [scope.ws],
                                                    modelsData: models_data,
                                                    fbasData: fbas_data});
                    })

                })
            }
        };
    })

    .directive('rxndetail', function() {
        return {
            link: function(scope, element, attrs) {
                var prom = fbaGet('Rxn', '', scope.ids);
                $.when(prom).done(function(data){
                    $(element).kbaseRxn({data: data, ids: scope.ids});
                })
            }
        };
    })
    .directive('cpddetail', function() {
        return {
            link: function(scope, element, attrs) {
                var prom = fbaGet('Cpd', '', scope.ids);
                $.when(prom).done(function(data){
                    $(element).kbaseCpd({data: data, ids: scope.ids});
                })
            }
        };
    })

    .directive('tabs', function() {
        return {
        }
    })
    // Workspace browser widgets (directives)
    .directive('wsobjtable', function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                $rootScope.objectTable = $(element).kbaseWSObjectTable({auth: scope.USER_TOKEN});
            }
        };
    })
    .directive('wsselector', function($rootScope) {
        return {
            link: function(scope, element, attrs, routeParams) {
                var wsSelector = $(element).kbaseWSSelector({userToken: scope.USER_TOKEN,
                                                      selectHandler: selectHandler});
                var first = true;
                var prevPromises = []; // store previous promises to cancel
                function selectHandler(selected) {
                    workspaces = wsSelector.workspaces;
                    set_selected_workspace()

                    // tell the previous promise(s) not to fire
                    prevPromises.cancel = true;

                    // workspaces might have data loaded already
                    var promises = [];
                    prevPromises = promises;

                    // loop through selected workspaces and download objects if they haven't been downloaded yet
                    for (var i=0; i<selected.length; i++) {
                        var workspace = selected[i];

                        var objType = $.type(workspace.objectData);
                        if (objType === 'undefined') {
                            // no data and not being downloaded
                            var p = workspace.getAllObjectsMeta();
                            workspace.objectData = p; // save the promise
                            promises.push(p);

                            // provide closure over workspace
                            (function(workspace) {
                                p.done(function(data) {
                                // save the data and tell workspace selector that the workspace has it's data
                                    workspace.objectData = data;
                                    wsSelector.setLoaded(workspace);
                                });
                            })(workspace);
                        } else if (objType === 'object') {
                            // data being downloaded (objectData is a promise)
                            promises.push(workspace.objectData);
                        }
                    }

                    if (promises.length > 0) {
                        // may take some time to load
                        $rootScope.objectTable.loading(true);
                    }

                    // when all the promises are done...
                    $.when.apply($, promises).done(function() {
                        if (promises.cancel) {
                            // do nothing if it was cancelled
                            return;
                        }

                        // reload the object table
                        $rootScope.objectTable.reload(selected).done(function() {
                            if (promises.cancel) {
                                return;
                            }

                            if (first) {
                                first = false;
                            }
                        });
                    });
                }
            }
        };
    })
