
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
    .directive('modelcards', function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                var prom = wsGet('objectMeta', 'Model', scope.ws, scope.id);
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

                var prom = fbaGet('Model', scope.ws, scope.id);
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
                });

            }
        }
 
    })
    .directive('fbacards', function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                var prom = wsGet('objectMeta', 'FBA', scope.ws, scope.id);
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

                var prom = fbaGet('FBA', scope.ws, scope.id);
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

                    var prom2 = fbaGet('Model', model_ws, model_id);
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
                    });
                });
            }
        }
    })

