
/*
 *  Card Directives  (widgets to draggable cards)
 *  
 *  These can be thought of as the 'widgets' on a page.  
 *  Scope comes from the controllers.
 *
*/

angular.module('card-directives', []);
angular.module('card-directives')
    .directive('genomecards', function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                $(element).KBaseCardLayoutManager({template: "genome", 
                                                   data: scope.params, 
                                                   auth: $rootScope.USER_TOKEN,
                                                   userId: $rootScope.USER_ID});
            }
        };
    })
    .directive('gwaspopulationcards', function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                $(element).KBaseCardLayoutManager({template: "gwaspopulation", 
                                                   data: scope.params, 
                                                   auth: $rootScope.USER_TOKEN,
                                                   userId: $rootScope.USER_ID});
            }
        };
    })
    .directive('genecards', function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                $(element).KBaseCardLayoutManager({template: "gene", 
                                                   data: scope.params, 
                                                   auth: $rootScope.USER_TOKEN,
                                                   userId: $rootScope.USER_ID});
            }
        };
    })
    .directive('memecards', function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                $(element).KBaseCardLayoutManager({template: "meme", 
                                                   data: scope.params, 
                                                   auth: $rootScope.USER_TOKEN,
                                                   userId: $rootScope.USER_ID});
            }
        };
    })
    .directive('cmonkeycards', function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                $(element).KBaseCardLayoutManager({template: "cmonkey", 
                                                   data: scope.params, 
                                                   auth: $rootScope.USER_TOKEN,
                                                   userId: $rootScope.USER_ID});
            }
        };
    })
    .directive('inferelatorcards', function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                $(element).KBaseCardLayoutManager({template: "inferelator", 
                                                   data: scope.params, 
                                                   auth: $rootScope.USER_TOKEN,
                                                   userId: $rootScope.USER_ID});
            }
        };
    })
    .directive('bambicards', function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                $(element).KBaseCardLayoutManager({template: "bambi", 
                                                   data: scope.params, 
                                                   auth: $rootScope.USER_TOKEN,
                                                   userId: $rootScope.USER_ID});
            }
        };
    })
    .directive('modelcards', function($rootScope, $location) {
        return {
            link: function(scope, element, attrs) {
                var prom = kb.req('ws', 'get_objectmeta',
                            {type:'Model', id: scope.id, workspace: scope.ws, auth: scope.USER_TOKEN});
                $.when(prom).done(function(data){
                    $(element).KBaseCardLayoutManager().addNewCard("kbaseModelMeta", 
                        { title: 'Model Info',
                          data: data,
                          id: scope.id,
                          ws: scope.ws },
                        { my: "left top+100",
                          at: "left bottom",
                          of: "#app"
                    });
                });

                var prom = kb.req('fba', 'get_models',
                            {models: [scope.id], workspaces: [scope.ws], auth: scope.USER_TOKEN});
                $.when(prom).done(function(data) {
                    $(element).KBaseCardLayoutManager().addNewCard("kbaseModelTabs", 
                        { modelsData: data,
                          title: 'Model Details',
                          id: scope.id,
                          ws: scope.ws,
                          width: 700 },
                        { my: "left+400 top+100",
                          at: "left bottom",
                          of: "#app"
                    });
                    $(element).KBaseCardLayoutManager().addNewCard("kbaseModelCore", 
                        { title: 'Central Carbon Core Metabolic Pathway',
                          modelsData: data,
                          ids: [scope.id],
                          workspaces: [scope.ws],
                          width: 900 },
                        { my: "left+800 top+600",
                          at: "left bottom",
                          of: "#app"
                    });
                    events();
                });

                function events() {
                    $(document).on('rxnClick', function(e, data) {
                        var url = '/rxns/'+data.ids;
                        scope.$apply( $location.path(url) );
                    });
                    $(document).on('coreRxnClick', function(e, data) {
                        console.log(data.ids)
                        var url = '/rxns/'+data.ids.join('&');
                        scope.$apply( $location.path(url) );
                    });         
                }
            }
        }
 
    })
    .directive('fbacards', function($rootScope, $location) {
        return {
            link: function(scope, element, attrs) {
                var prom = kb.req('ws', 'get_objectmeta',
                            {type:'FBA', id: scope.id, workspace: scope.ws, auth: scope.USER_TOKEN});
                $.when(prom).done(function(data){
                    $(element).KBaseCardLayoutManager().addNewCard("kbaseFbaMeta", 
                        { title: 'Model Info',
                          data: data,
                          id: scope.id,
                          ws: scope.ws },
                        { my: "left top+100",
                          at: "left bottom",
                          of: "#app"
                    });
                });


                var prom = kb.req('fba', 'get_fbas',
                            {fbas: [scope.id], workspaces: [scope.ws], auth: scope.USER_TOKEN})
                $.when(prom).done(function(fbas_data) {
                    $(element).KBaseCardLayoutManager().addNewCard("kbaseFbaTabs", 
                        { title: 'FBA Details',
                          fbaData: fbas_data,
                          id: scope.id,
                          ws: scope.ws,
                          width: 700 },
                        { my: "left+400 top+100",
                          at: "left bottom",
                          of: "#app"
                    });
                    var model_ws = fbas_data[0].model_workspace;
                    var model_id = fbas_data[0].model;

                    var prom2 = kb.req('fba', 'get_models',
                            {models: [model_id], workspaces: [model_ws], auth: scope.USER_TOKEN});
                    $.when(prom2).done(function(models_data){
                        $(element).KBaseCardLayoutManager().addNewCard("kbaseModelCore", 
                            { title: 'Central Carbon Core Metabolic Pathway',
                              modelsData: models_data,
                              fbasData: fbas_data,
                              ids: [scope.id],
                              workspaces: [scope.ws],
                              width: 900 },
                            { my: "left+800 top+600",
                              at: "left bottom",
                              of: "#app"
                        });

                        events();
                    });
                });


                function events() {
                    $(document).on('rxnClick', function(e, data) {
                        var url = '/rxns/'+data.ids;
                        scope.$apply( $location.path(url) );
                    });
                    $(document).on('cpdClick', function(e, data) {
                        var url = '/cpds/'+data.ids;
                        scope.$apply( $location.path(url) );
                    });                      
                    $(document).on('coreRxnClick', function(e, data) {
                        console.log(data.ids)
                        var url = '/rxns/'+data.ids.join('&');
                        scope.$apply( $location.path(url) );
                    });         
                }

            }
        }
    })
    .directive('speccards', function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                $(element).KBaseCardLayoutManager({template: "spec", 
                                                   data: scope.params,
                                                   auth: $rootScope.USER_TOKEN});
            }
        };
    })

