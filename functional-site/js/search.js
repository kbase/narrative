/* Directives */

//app.directive();
var searchApp = angular.module('search', ['ui.router', 'kbaseLogin']);


// enable CORS for Angular
searchApp.config(function($httpProvider) {
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
        
        $(document).ajaxStop($.unblockUI());
    }
);


// Services

/*
searchApp.service('searchQueryService', function() {
    this.query = "";    
});
*/


searchApp.service('searchCategoryLoadService', function($q, $http, $rootScope) {
    // Functions for fetching and manipulating model data
    return {
        getCategoryInfo : function () {
            var deferred = $q.defer();
    
            $http.get($rootScope.kb.search_url + "categories").then(function fetchCategories(results) {
                this.categoriesJSON = results.data;
                deferred.resolve(results);                    
            });            
            
            return deferred.promise;
        }        
    };
});


searchApp.service('searchOptionsService', function searchOptionsService() {
    // Model data that persists for all searches
    return {
        categoryInfo : {},
        categoryTemplates : {},
        categoryGroups : {},
        searchCategories : {},
        categoryRelationships : {},
        related: {},
        numPageLinks : 10,
        defaultSearchOptions : {"general": {"itemsPerPage": 10},
                                "perCategory": {}
                               },    
        categoryCounts : {},
        searchOptions : this.defaultSearchOptions,                                          
        defaultMessage : "KBase is processing your request...",
        userState : {"token": null,
                     "selectAll": {},
                     "selectedWorkspace": null,
                     "workspaces": null,
                     "selections": null,
                     "selectionsLength": 0,
                     "viewType": "compact",
                     "loggedIn": false,
                     "user_id": null,
                     "active_facets": {},
                     "dataTransferred": []
                    },
        landingPages : {"genome": "/genomes/CDS/",
                        "feature": "/genes/CDS/",
                        "gwasPopulation": "/KBaseGwasData.GwasPopulation/",
                        "gwasTrait": "/KBaseGwasData.GwasPopulationTrait/",
                        "gwasVariation": "/KBaseGwasData.GwasPopulationVariation/",
                        "gwasGeneList": "/KBaseGwasData.GwasGeneList/",
                        "metagenome": "http://metagenomics.anl.gov/?page=MetagenomeOverview&metagenome=",
                       },
        resultJSON : {},
        objectCopyInfo : null,
        resultsAvailable : false,
        countsAvailable : false,
        selectedCategory : null,
        pageLinksRange : [],
        facets : null,

        reset : function() {
            this.categoryCounts = {};
            this.resultJSON = {};
            this.objectCopyInfo = null;
            this.resultsAvailable = false;
            this.countsAvailable = false;
            this.selectedCategory = null;
            this.pageLinksRange = [];
            this.facets = null;
            this.searchOptions = this.defaultSearchOptions;                                          
            
            this.userState = {"token": null,
                              "selectAll": {},
                              "selectedWorkspace": null,
                              "workspaces": null,
                              "selections": null,
                              "selectionsLength": 0,
                              "viewType": "compact",
                              "loggedIn": false,
                              "user_id": null,
                              "active_facets": {},
                              "dataTransferred": []
                             };
        }
    };
});

/* Controllers */



searchApp.controller('searchBarController', function searchBarCtrl($rootScope, $scope, $state) {
    $scope.$on('queryChange', function(event, query) {
        $scope.query = query;
    });

    $scope.newSearch = function () {
        if ($scope.query && $scope.query.length > 0) {
            $rootScope.$state.go('search', {q: $scope.query});
            $state.go('search', {q: $scope.query});
        }
        else {
            $rootScope.$state.go('search', {q: "*"});
            $state.go('search', {q: "*"});        
        }
    };    
});


searchApp.controller('searchController', function searchCtrl($rootScope, $scope, $q, $http, $state, $stateParams, searchCategoryLoadService, searchOptionsService) {
    $scope.options = searchOptionsService;

    $(document).on('loggedIn', function () {
        $scope.options.userState.loggedIn = true;
        $scope.options.userState.token = $('#signin-button').kbaseLogin('session', 'token');
        $scope.options.userState.user_id = $('#signin-button').kbaseLogin('session', 'user_id');
        $scope.workspace_service = new Workspace($rootScope.kb.ws_url, {"token": $scope.options.userState.token});
    });


    $(document).on('loggedOut', function () {
        $scope.options.userState.loggedIn = false;
        $scope.options.userState.token = null;
        $scope.options.userState.user_id = null;
        $scope.workspace_service = null;
    });


    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        if (toState.name === "search") {
            $scope.startSearch();      
        }  
    });


    $scope.login = function() {
        $('#signin-button').kbaseLogin('openDialog');
    };


    $scope.logout = function() {
        $('#signin-button').kbaseLogin('logout');        
    };


    $scope.loadCategories = function() {
        var flattenCategories = function(resource) {
            if (resource.hasOwnProperty("category") && $scope.options.categoryInfo.categories.hasOwnProperty(resource.category)) {
                $scope.options.searchCategories[resource.category] = {"category": resource.category, "label": resource.label};
            }            
        
            if (resource.hasOwnProperty("children")) {
                for (var i = 0; i < resource.children.length; i++) {
                    flattenCategories(resource.children[i]);
                }    
            }
        };

        for (var p in $scope.options.categoryInfo.displayTree) {
            if ($scope.options.categoryInfo.displayTree.hasOwnProperty(p)) {
                flattenCategories($scope.options.categoryInfo.displayTree[p]);
            }
        }                 

        var recordRelationships = function(node, nodeParent) {
            if (node.hasOwnProperty("category")) {
                $scope.options.categoryRelationships[node.category] = {"parent": nodeParent, "children": []};    
            
                if (node.hasOwnProperty("children")) {
                    for (var i = 0; i < node.children.length; i++) {
                        if (node.children[i].hasOwnProperty("category")) {
                            $scope.options.categoryRelationships[node.category].children.push(node.children[i].category);
                    
                            recordRelationships(node.children[i], node.category);
                        }
                    }
                }
            }
            else {
                if (node.hasOwnProperty("children")) {
                    for (var i = 0; i < node.children.length; i++) {
                        recordRelationships(node.children[i], nodeParent);
                    }
                }
            }
        };

        recordRelationships($scope.options.categoryInfo.displayTree['unauthenticated'], null);

        var isRelated = function(a, b) {
            var splits = [a.split("_"), b.split("_")];
        
            if (splits[0][0] !== splits[1][0]) {
                return false;
            }

            // test to see if a is an ancestor of b or just siblings
            if (splits[0].length < splits[1].length) {
                if (splits[0].length === 1) {
                    return true;
                }
                
                for (var i = 0; i < splits[0].length; i++) {
                    if (splits[0][i] !== splits[1][i]) {
                        return false;
                    }
                }
                return true;
            }
            // test to see if b is an ancestor of a or just siblings
            else {
                if (splits[1].length === 1) {
                    return true;
                }
                
                for (var i = 0; i < splits[1].length; i++) {
                    if (splits[1][i] !== splits[0][i]) {
                        return false;
                    }
                }
                return true;
            }
        };
        
        
        for (var p in $scope.options.categoryRelationships) {
            if ($scope.options.categoryRelationships.hasOwnProperty(p)) {
                $scope.options.related[p] = {};
                
                for (var psub in $scope.options.categoryRelationships) {
                    $scope.options.related[p][psub] = isRelated(p, psub);          
                }
            }
        }
        
        //console.log($scope.options.related);
    };

    $scope.getCount = function(options, category) {
        var queryOptions = {};

        angular.copy(options, queryOptions);
        
        queryOptions["page"] = 1;
        queryOptions["itemsPerPage"] = 0;
        queryOptions["category"] = category;

        $scope.options.userState.ajax_requests.push(
            $http({method: 'GET', 
                   url: $rootScope.kb.search_url + "getResults",
                   params: queryOptions,      
                   responseType: 'json'
                  }).then(function (jsonResult) {
                      if (jsonResult.data.totalResults === undefined) {
                          $scope.options.categoryCounts[category] = 0;
                      }
                      else {
                          $scope.options.categoryCounts[category] = jsonResult.data.totalResults;                  
                      }
                  }, function (error) {
                      console.log(error);
                      $scope.options.categoryCounts[category] = 0;
                  }, function (update) {
                      console.log(update);
                  })
        );
    };
    
    $scope.getTotalCount = function() {
        var sum = 0;
        for (var p in $scope.options.categoryCounts) {
            if ($scope.options.categoryCounts.hasOwnProperty(p)) {
                sum += $scope.options.categoryCounts[p];
            }
        }
        
        return sum;
    };
    
    $scope.getResults = function(category, options) {
        //console.log($scope.options);
        var queryOptions = {};

        if (!$scope.options.userState.ajax_requests) {
            $scope.options.userState.ajax_requests = [];
        }
        
        if (category === null || category === undefined) {
            queryOptions = {'q': options.general.q};

            $("#loading_message_text").html(options.defaultMessage);
            $.blockUI({message: $("#loading_message")});
            
            for (var p in $scope.options.searchCategories) {
                if ($scope.options.searchCategories.hasOwnProperty(p)) {
                    $scope.getCount(queryOptions, $scope.options.searchCategories[p].category);            
                }
                else {
                    $scope.options.categoryCounts[category] = 0;
                }
            }
    
            $scope.options.countsAvailable = true;

            // here we are waiting for all the ajax count calls to complete before unblocking the UI            
            $q.all($scope.options.userState.ajax_requests).then(function() {
                $.unblockUI();
                $scope.options.userState.ajax_requests = [];
            });
            
            return;
        }

        queryOptions.category = category;
        for (var prop in options) {        
            if (prop === "general") {
                for (var gen_prop in options.general) {
                    if (options.general.hasOwnProperty(gen_prop)) {
                        queryOptions[gen_prop] = options.general[gen_prop];
                    }
                }
        
                if (queryOptions.hasOwnProperty("token")) {
                    delete queryOptions.token;
                }
            }        
            else if (prop === "perCategory") {
                for (var cat_prop in options.perCategory[category]) {
                    if (options.perCategory[category].hasOwnProperty(cat_prop)) {
                        queryOptions[cat_prop] = options.perCategory[category][cat_prop];
                    }
                }
            }    
        }

        $("#loading_message_text").html(options.defaultMessage);
        $.blockUI({message: $("#loading_message")});


        $http({method: 'GET', 
               url: $rootScope.kb.search_url + "getResults",
               params: queryOptions,      
               responseType: 'json'
              }).then(function (jsonResult) {
              
                  for (var i = 0; i < jsonResult.data.items.length; i++) {
                      jsonResult.data.items[i].position = (jsonResult.data.currentPage - 1) * jsonResult.data.itemsPerPage + i + 1;

                      if (jsonResult.data.items[i].hasOwnProperty("object_id")) {
                          jsonResult.data.items[i].row_id = jsonResult.data.items[i].object_id.replace(/\||\./g,"_");
                      }
                      else {
                          if (jsonResult.data.items[i].hasOwnProperty("feature_id")) {
                              jsonResult.data.items[i].row_id = jsonResult.data.items[i].feature_id.replace(/\||\./g,"_");
                          }
                          else if (jsonResult.data.items[i].hasOwnProperty("genome_id")) {
                              jsonResult.data.items[i].row_id = jsonResult.data.items[i].genome_id.replace(/\||\./g,"_");
                          }
                      }
                  }

                  $scope.options.resultJSON = jsonResult.data;
                  $scope.options.resultsAvailable = true;
                  $scope.options.pageLinksRange = [];
              
                  $scope.options.facets = null;
              
                  if ($scope.options.resultJSON.hasOwnProperty('facets')) {
                      $scope.options.facets = [];

                      for (var p in $scope.options.resultJSON.facets) {
                          if ($scope.options.resultJSON.facets.hasOwnProperty(p)) {
                              var facet_options = [];
                      
                              for (var i = 0; i < $scope.options.resultJSON.facets[p].length - 1; i += 2) {
                                  facet_options.push({key: $scope.options.resultJSON.facets[p][i], value: $scope.options.resultJSON.facets[p][i+1]});                              
                              }
                  
                              $scope.options.facets.push({key: p, value: facet_options});
                          }
                      }
                  }
              
                  var position = $scope.options.resultJSON.currentPage % $scope.options.numPageLinks;
                  var start;
              
                  if (position === 0) {
                      start = $scope.options.resultJSON.currentPage - $scope.options.numPageLinks + 1;                  
                  }
                  else {
                      start = $scope.options.resultJSON.currentPage - position + 1;                  
                  }
              
                  var end = start + $scope.options.numPageLinks;

                  for (var p = start; p < end && (p - 1) * $scope.options.resultJSON.itemsPerPage < $scope.options.resultJSON.totalResults; p++) {                      
                      $scope.options.pageLinksRange.push(p);                      
                  }                  
                           
                  //console.log($scope.options.resultJSON);     
                  $.unblockUI();
              }, function (error) {
                  console.log("getResults threw an error!");
                  console.log(error);
                  $scope.options.resultsAvailable = false;
                  $.unblockUI();
              }, function (update) {
                  console.log(update);
              });
    };


    $scope.newSearch = function () {
        if ($scope.options.searchOptions.general.q && $scope.options.searchOptions.general.q.length > 0) {
            //$rootScope.$state.go('search', {q: $scope.options.searchOptions.general.q});
            $scope.$emit('queryChange', $scope.options.searchOptions.general.q);
            $state.go('search', {q: $scope.options.searchOptions.general.q});
        }
    };    

    
    $scope.startSearch = function () {
        //console.log("Starting search with : " + $stateParams.q);
        //console.log($stateParams);

        var init = function () {
            // in here we initialize anything we would want to reset on starting a new search
            return searchCategoryLoadService.getCategoryInfo().then(function(results) {
                $scope.options.categoryInfo = results.data;
                $scope.loadCategories();
            });
        };

        var captureState = function () {
            if ($scope.options.searchOptions === undefined) {
                $scope.options.reset();
            }

            if ($stateParams.q !== undefined && $stateParams.q !== null && $stateParams.q !== '') {
                $scope.options.searchOptions.general.q = $stateParams.q;
            }
            else { // search view reached without a query, reset
                $scope.options.reset();
            }            

            if ($stateParams.category !== null && $stateParams.category in $scope.options.searchCategories) {
                $scope.selectCategory($stateParams.category);
                
                if ($stateParams.page !== undefined) {
                    $scope.setCurrentPage($stateParams.page);
                }
                else {
                    $scope.setCurrentPage(1);
                }

                if ($stateParams.itemsPerPage !== null && $stateParams.itemsPerPage > 0 && $stateParams.itemsPerPage <= 100) {
                    $scope.options.searchOptions.general.itemsPerPage = $stateParams.itemsPerPage;
                }
                else {
                    $scope.options.searchOptions.general.itemsPerPage = 10;                
                }
            }
            else {
                $scope.options.reset();
            }            
    
            if ($stateParams.facets !== null) {
                  var addFacetParam = function(name, value) {
                      if (!$scope.options.userState.active_facets.hasOwnProperty($scope.options.selectedCategory)) {        
                          $scope.options.userState.active_facets[$scope.options.selectedCategory] = {};
                      }

                      if (!$scope.options.userState.active_facets[$scope.options.selectedCategory].hasOwnProperty(name)) {
                          $scope.options.userState.active_facets[$scope.options.selectedCategory][name] = {};        
                      }
        
                      $scope.options.userState.active_facets[$scope.options.selectedCategory][name][value] = true;                                            
                  };
            
                  $scope.options.facets = [];                  
                  
                  var facetSplit = $stateParams.facets.split(",");
                  
                  var options = {};
                  var facet_options = [];
                  var facet_keyval = [];

                  for (var i = 0; i < facetSplit.length; i++) {
                      facet_keyval = facetSplit[i].split(":");                      
                      
                      addFacetParam(facet_keyval[0],facet_keyval[1]);
                  }                
            }
            else {
                $scope.options.facets = null;
            }

            // verify logged in state
            try {
                $scope.options.userState.token = $("#signin-button").kbaseLogin("session", "token");
                $scope.options.userState.user_id = $("#signin-button").kbaseLogin("session", "user_id");
                
                if ($scope.options.userState.token !== undefined) {
                    $scope.options.userState.loggedIn = true;
                }
                else {
                    $scope.options.userState.loggedIn = false;
                    $scope.options.userState.token = null;
                    $scope.options.userState.user_id = null;
                }
            }
            catch (e) {
                $scope.options.userState.loggedIn = false;
                $scope.options.userState.token = null;
                $scope.options.userState.user_id = null;
            }

        };


        if (!$scope.options.categoryInfo.hasOwnProperty("displayTree")) {
            init().then(function () {
                captureState();
                $scope.getResults(null, $scope.options.searchOptions);

                $scope.getResults($scope.options.selectedCategory, $scope.options.searchOptions);        
            });
        }
        else {
            captureState();
            //console.log("No category chosen");
            $scope.getResults($scope.options.selectedCategory, $scope.options.searchOptions);        
        }
    };
    
    $scope.selectCategory = function(value) {
        $scope.options.selectedCategory = value;
        
        //console.log("Selected category : " + value);
        
        if (value === null || value === 'null') {
            $scope.options.reset();
            $state.go("search", {category: $scope.options.selectedCategory, page: null, itemsPerPage: null, facets: null, sort: null});
        }            
        else {
            if (!$scope.options.searchOptions.perCategory.hasOwnProperty(value)) {
                $scope.options.searchOptions.perCategory[value] = {"page": 1};
            }
            
            $scope.options.resultsTemplatePath = "views/search/" + value + ".html";
            $state.go("search", {category: $scope.options.selectedCategory});
        }
    };


    $scope.isInActiveCategoryTree = function(value) {
        return $scope.options.related[value][$scope.options.selectedCategory];
    };


    $scope.removeSearchFilter = function(category, type, name, value) {
        //console.log("before remove");
        //console.log($scope.options.searchOptions.perCategory[category][type]);

        // e.g. filters=domain:bacteria,domain:archea,complete:true
        if ($scope.options.searchOptions.perCategory[category].hasOwnProperty(type)) {
            var oldFilter;
            
            if (type === "sort") {
                oldFilter = $scope.options.searchOptions.perCategory[category][type].indexOf(name);
            }
            else if (type === "facets") {
                oldFilter = $scope.options.searchOptions.perCategory[category][type].indexOf(name + ":" + value);
            }
        
            var nextComma = $scope.options.searchOptions.perCategory[category][type].indexOf(",");
    
            if (oldFilter > -1) {
            
                if (oldFilter === 0 && nextComma < 0) {
                    // only one filter, go back to empty string
                    $scope.options.searchOptions.perCategory[category][type] = "";
                }
                else if (oldFilter === 0 && nextComma > oldFilter) {
                    // remove the beginning of the string to the comma
                    $scope.options.searchOptions.perCategory[category][type] = $scope.options.searchOptions.perCategory[category][type].substring(nextComma + 1,$scope.options.searchOptions.perCategory[category][type].length);                                
                }
                else if (oldFilter > 0) {
                    // must be more than one sort option, now get the comma after oldFacet
                    nextComma = $scope.options.searchOptions.perCategory[category][type].indexOf(",", oldFilter);
            
                    // we need to cut off the end of the string before the last comma
                    if (nextComma < 0) {
                        $scope.options.searchOptions.perCategory[category][type] = $scope.options.searchOptions.perCategory[category][type].substring(0,oldFilter - 1);
                    }
                    // we are cutting out the middle of the string
                    else {
                        $scope.options.searchOptions.perCategory[category][type] = $scope.options.searchOptions.perCategory[category][type].substring(0,oldFilter - 1) +
                            $scope.options.searchOptions.perCategory[category][type].substring(nextComma, $scope.options.searchOptions.perCategory[category][type].length);
                    }
                }
            }

            //console.log("after remove");
            //console.log($scope.options.searchOptions.perCategory[category][type]);
            //console.log($scope.options.searchOptions.perCategory[category][type].length);
    
            if ($scope.options.searchOptions.perCategory[category][type].length === 0) {
                delete $scope.options.searchOptions.perCategory[category][type];
            }            
        }    
    };


    $scope.setResultsPerPage = function (value) {
        $scope.options.searchOptions.general.itemsPerPage = parseInt(value);

        $scope.removeAllSelections();
    
        //reset the page to 1
        $state.go("search", {itemsPerPage: $scope.options.searchOptions.general.itemsPerPage, page: 1});
    };


    $scope.addSort = function (category, name, direction) {
        if (!$scope.options.searchOptions.perCategory[category].hasOwnProperty("sort")) {
            $scope.options.searchOptions.perCategory[category].sort = name + " " + direction;
        }
        else {
            // attempt to remove any old sorts of this name before adding the new one
            $scope.removeSort(category, name, false);

            if (!$scope.options.searchOptions.perCategory[category].hasOwnProperty("sort")) {
                $scope.options.searchOptions.perCategory[category].sort = name + " " + direction;
            }
            else if ($scope.options.searchOptions.perCategory[category].sort.length > 0) {
                $scope.options.searchOptions.perCategory[category].sort += "," + name + " " + direction;
            }
            else {
                $scope.options.searchOptions.perCategory[category].sort += name + " " + direction;
            }
        }
        
        $state.go("search", {sort: $scope.options.searchOptions.perCategory[category].sort, page: 1});
    };


    $scope.removeSort = function (category, name, searchAgain) {
        $scope.removeSearchFilter(category, "sort", name, null);
        
        if (searchAgain) {
            $state.go("search", {sort: $scope.options.searchOptions.perCategory[category].sort, page: 1});
        }
    };


    $scope.setCurrentPage = function (page) {
        try {
            $scope.options.searchOptions.perCategory[$scope.options.selectedCategory].page = page;
        }
        catch(e) {
            $scope.options.searchOptions.perCategory[$scope.options.selectedCategory] = {'page': page};
        }
    
        $state.go("search", {page: $scope.options.searchOptions.perCategory[$scope.options.selectedCategory].page});
    };
    

    $scope.toggleFacet = function (name, value, checked) {
        // need to reset the page when a facet changes
        $scope.options.searchOptions.perCategory[$scope.options.selectedCategory].page = 1;

        if (checked) {
            $scope.removeFacet(name, value);
        }
        else {
            $scope.addFacet(name, value);
        }                
    };


    $scope.addFacet = function (name, value) {        
        if (!$scope.options.searchOptions.perCategory[$scope.options.selectedCategory].hasOwnProperty("facets")) {
            $scope.options.searchOptions.perCategory[$scope.options.selectedCategory].facets = name + ":" + value;
        }
        else {
            $scope.options.searchOptions.perCategory[$scope.options.selectedCategory].facets += "," + name + ":" + value;        
        }        
    
        if (!$scope.options.userState.active_facets.hasOwnProperty($scope.options.selectedCategory)) {        
            $scope.options.userState.active_facets[$scope.options.selectedCategory] = {};
        }

        if (!$scope.options.userState.active_facets[$scope.options.selectedCategory].hasOwnProperty(name)) {
            $scope.options.userState.active_facets[$scope.options.selectedCategory][name] = {};        
        }
        
        $scope.options.userState.active_facets[$scope.options.selectedCategory][name][value] = true;        
        
        $state.go("search", {facets: $scope.options.searchOptions.perCategory[$scope.options.selectedCategory].facets, page: 1});
    };


    $scope.removeFacet = function (name, value) {
        $scope.removeSearchFilter($scope.options.selectedCategory, "facets", name, value);
                
        delete $scope.options.userState.active_facets[$scope.options.selectedCategory][name][value];
        
        if ($.isEmptyObject($scope.options.userState.active_facets[$scope.options.selectedCategory].name)) {
            delete $scope.options.userState.active_facets[$scope.options.selectedCategory].name;
        }
    
        if (!$scope.options.searchOptions.perCategory[$scope.options.selectedCategory].hasOwnProperty("facets")) {
            $scope.options.userState.active_facets[$scope.options.selectedCategory] = {};
        }

        //console.log($scope.options.userState.active_facets[$scope.options.selectedCategory]);
    
        //console.log("Removed filter: " + name);
        $state.go("search", {facets: $scope.options.searchOptions.perCategory[$scope.options.selectedCategory].facets, page: 1});
    };


    $scope.setView = function (type) {
        //console.log("Setting " + type);
        $scope.options.userState.viewType = type;
    };


    $scope.listWorkspaces = function() {
        try {
            if (!$scope.workspace_service) {
                $scope.workspace_service = new Workspace($rootScope.kb.ws_url, {"token": $scope.options.userState.token});
            }

            $scope.options.userState.workspaces = [];
                
            $scope.workspace_service.list_workspace_info({"perm": "w"}, 
                function (ws_list) { 
                    $scope.options.userState.workspaces = ws_list.sort(function (a,b) {
                        if (a[1].toLowerCase() < b[1].toLowerCase()) return -1;
                        if (a[1].toLowerCase() > b[1].toLowerCase()) return 1;
                        return 0;
                    });
                    
                    // make sure the above makes it into angular scope
                    $scope.$apply();
                    
                    //console.log($scope.options.userState.workspaces);
                }, 
                function (error) {
                    console.log(error);
                }
            );	    
        }
        catch (e) {
            //var trace = printStackTrace();
            //console.log(trace);

            if (e.message && e.name) {
                console.log(e.name + " : " + e.message);
            }
            else {
                console.log(e);
            }
        }
    };


    $scope.selectWorkspace = function(workspace_info) {
        //console.log(workspace_info);
        
        if (workspace_info.length === 10) {
            $scope.options.userState.selectedWorkspace = workspace_info[2];
        }
        else {
            $scope.options.userState.selectedWorkspace = workspace_info[1];
        }
    };


    // grab all selected search results and copy those objects to the user's selected workspace
    $scope.addAllObjects = function() {
        if (!$scope.options.userState.selectedWorkspace) {
            console.log("select a workspace first");
            return;
        }

        if (!$scope.workspace_service) {
            $scope.workspace_service = new Workspace($rootScope.kb.ws_url, {"token": $scope.options.userState.token});
        }

        var ws_objects = {};

        for(var n in $scope.options.userState.selections) {
            if ($scope.options.userState.selections.hasOwnProperty(n)) {
                if ($scope.options.userState.selections[n]["object_type"].indexOf("KBaseSearch.Genome") > -1) {                    
                    $scope.workspace_service.get_object_info([{"name": $scope.options.userState.selections[n]["genome_id"], "workspace": "KBasePublicGenomesLoad"}])
                        .fail(function (xhr, status, error) {
                            console.log(xhr);
                            console.log(status);
                            console.log(error);
                        })
                        .done(function (info, status, xhr) {
                            function success(result) {
                                $scope.options.userState.dataTransferred.push($scope.options.userState.selections[n]);
                                $scope.removeSelection(n);
                            }
    
                            function error(result) {
                                console.log("Object failed to copy");
                                console.log(result);
                                
                                $scope.transferError($scope.options.userState.selections[n]["object_name"], $scope.options.userState.selections[n]["object_id"], result);
                            }
                                                        
                            $scope.workspace_service.copy_object({"from": {"workspace": "KBasePublicGenomesLoad", "name": info[0][1]}, "to": {"workspace": $scope.options.userState.selectedWorkspace, "name": info[0][1]}}, success, error);        
                        });
                }                    
                else if ($scope.options.userState.selections[n]["object_type"].indexOf("KBaseSearch.Feature") > -1) {                
                    // Get the search Genome object
                    $scope.workspace_service.get_objects([{"name": $scope.options.userState.selections[n]["genome_id"],"workspace":"KBasePublicRichGenomesLoad"}])
                        .fail(function (xhr, status, error) {
                            console.log(xhr);
                            console.log(status);
                            console.log(error);
                        })
                        .done(function (data, status, xhr) {
                            // Get the FeatureSet object
                            $scope.workspace_service.get_objects([{"ref": data[0].data.featureset_ref}])
                                .fail(function (xhr, status, error) {
                                    console.log(xhr);
                                    console.log(status);
                                    console.log(error);
                                })
                                .done(function (data, status, xhr) {
                                    // slow down the save requests to compensate for workspace parse threading issues
                                    setTimeout(function() { ; }, 200);
                                
                                    try {
                                        var feature_obj = data[0].data.features[$scope.options.userState.selections[n]["feature_id"]].data;
                                    } 
                                    catch (e) {
                                        console.log(data[0].data.features);
                                        console.log(n);
                                        console.log($scope.options.userState.selections);
                                        console.log($scope.options.userState.selections[n]);
                                        console.log(e);
                                    }
                                    
                                    var max_tries = 10;
                                    var tries = 0;
                                    
                                    // wrap this in a function so that we can retry on failure
                                    var save_feature = function () {
                                        $scope.workspace_service.save_objects({"workspace": $scope.options.userState.selectedWorkspace, 
                                                                               "objects": [{"data": feature_obj, 
                                                                                            "type": "KBaseSearch.Feature", 
                                                                                            "name": $scope.options.userState.selections[n]["feature_id"], 
                                                                                            "provenance": [{"time": new Date().toISOString().split('.')[0] + "+0000", 
                                                                                                            "service": "Search", 
                                                                                                            "description": "Created from a Public Genome Feature", 
                                                                                                            "input_ws_objects": []}], 
                                                                                            "meta": {}
                                                                                           }]
                                                                               })
                                            .fail(function (xhr, status, error) {
                                                if (tries < max_tries) {
                                                    tries += 1;
                                                    console.log("Failed save, number of retries : " + (tries - 1));
                                                    save_feature();
                                                }
                                                else {
                                                    console.log(xhr);
                                                    console.log(status);
                                                    console.log(error);
                                                    console.log(feature_obj);
                                                }
                                            })
                                            .done(function (info, status, xhr) {
                                                console.log("Save successful, object info : " + info);
                                                $scope.options.userState.dataTransferred.push($scope.options.userState.selections[n]);
                                                $scope.removeSelection(n);
                                            });        
                                            
                                    };
                                    
                                    // start the save
                                    save_feature();                                                                    
                                });
                        });
                }
                else if ($scope.options.userState.selections[n]["object_type"].indexOf("KBaseCommunities.Metagenome") > -1) {
                    $scope.workspace_service.get_object_info([{"name": $scope.options.userState.selections[n]["metagenome_id"], "workspace": "KBasePublicMetagenomes"}])
                        .fail(function (xhr, status, error) {
                            console.log(xhr);
                            console.log(status);
                            console.log(error);
                        })
                        .done(function (info, status, xhr) {
                            console.log(info);
                            
                            function success(result) {
                                $scope.options.userState.dataTransferred.push($scope.options.userState.selections[n]);
                                $(".progress").attr('width',$(".progress").attr('width') + 1);
                                $scope.removeSelection(n);
                            }
    
                            function error(result) {
                                console.log("Object failed to copy");
                                console.log(result);
                                $scope.transferError($scope.options.userState.selections[n]["metagenome_id"], $scope.options.userState.selections[n]["object_id"], result);
                            }
                                                        
                            $scope.workspace_service.copy_object({"from": {"workspace": "KBasePublicMetagenomes", "name": info[0][1]}, "to": {"workspace": $scope.options.userState.selectedWorkspace, "name": info[0][1]}}, success, error);        
                        });                
                }
                else {
                    //generic solution for types
                    if ($scope.options.userState.selections[n].hasOwnProperty("object_name") === true) {
                        $scope.copyTypedObject($scope.options.userState.selections[n]["object_name"], $scope.options.userState.selections[n]["object_id"], $scope.options.userState.selections[n]["workspace_name"], $scope.options.userState.selectedWorkspace);                    
                    }
                    else if ($scope.options.userState.selections[n].hasOwnProperty("object_id") === true) {
                        console.log($scope.options.userState.selections[n]);
                    
                        $scope.workspace_service.get_object_info([{"name": $scope.options.userState.selections[n]["object_id"], "workspace": $scope.options.userState.selections[n]["workspace_name"]}])
                            .fail(function (xhr, status, error) {
                                console.log(xhr);
                                console.log(status);
                                console.log(error);
                            })
                            .done(function (info, status, xhr) {
                                console.log(info);
                                console.log([info[0][0], $scope.options.userState.selections[n]["object_id"], $scope.options.userState.selections[n]["workspace_name"], $scope.options.userState.selectedWorkspace]);
                                $scope.copyTypedObject(info[0][1], $scope.options.userState.selections[n]["object_id"], $scope.options.userState.selections[n]["workspace_name"], $scope.options.userState.selectedWorkspace);
                            });
                    }
                    else {
                        // create  error popover
                        console.log("no object reference found");
                        return;
                    }
                }
            } 
        }
    };

    
    $scope.removeSelection = function(n) {
        delete $scope.options.userState.selections[n];
        $scope.options.userState.selectionsLength -= 1;
    };
    
    $scope.removeAllSelections = function() {
        $scope.options.userState.selectAll = {};
        $scope.options.userState.selections = {};
        $scope.options.userState.selectionsLength = 0;
    };
    
    
    $scope.transferError = function(object_name, object_ref, result) {
        if (!$scope.options.userState.transferErrors) {
            $scope.options.userState.tansferErrors = {};
        }
        $scope.options.userState.tansferErrors[object_name] = {error: result};        
    };
    

    // grab a public object and make a copy to a user's workspace
    $scope.copyTypedObject = function(object_name, object_ref, from_workspace_name, to_workspace_name) {
        if (!$scope.workspace_service) {
            $scope.workspace_service = new Workspace($rootScope.kb.ws_url, {"token": $scope.options.userState.token});
        }

        function success(result) {
            console.log("Object " + object_name + " copied successfully from " + from_workspace_name + " to " + to_workspace_name + " .");
            console.log(result);
            $scope.removeSelection(n);
        }
    
        function error(result) {
            console.log("Object " + object_name + " failed to copy from " + from_workspace_name + " to " + to_workspace_name + " .");
            console.log(result);
            $scope.transferError(object_name, object_ref, result);
        }

        if (object_ref === undefined || object_ref === null) {
            console.log("no object ref for name " + object_name);
            $scope.workspace_service.copy_object({"from": {"workspace": from_workspace_name, "name": object_name}, "to": {"workspace": to_workspace_name, "name": object_name}}, success, error);        
        }
        else {
            console.log("had object ref " + object_ref);
            $scope.workspace_service.copy_object({"from": {"ref": object_ref}, "to": {"workspace": to_workspace_name, "name": object_name}}, success, error);
        }
    }

    $scope.toggleCheckbox = function(id, item) {
        if ($scope.options.userState.selections === null) {
            $scope.options.userState.selections = {};
            $scope.options.userState.selectionsLength = 0;
        }
    
        if (!$scope.options.userState.selections.hasOwnProperty(id)) {
            $scope.options.userState.selections[id] = item;
            $scope.options.userState.selectionsLength += 1;
        }
        else {
            delete $scope.options.userState.selections[id];           
            $scope.options.userState.selectionsLength -= 1;
        }
    };

    $scope.toggleAll = function(items) {
        //console.log(items);
    
        if ($scope.options.userState.selections === null) {
            $scope.options.userState.selections = {};            
        }
        
        for(var i = items.length - 1; i > -1; i--) {
            $scope.toggleCheckbox(items[i].row_id,items[i]);
        }            
        
        if ($scope.options.userState.selectAll.hasOwnProperty($scope.options.selectedCategory)) {
            if ($scope.options.userState.selectAll[$scope.options.selectedCategory].hasOwnProperty($scope.options.searchOptions.perCategory[$scope.options.selectedCategory].page)) {
                $scope.options.userState.selectAll[$scope.options.selectedCategory][$scope.options.searchOptions.perCategory[$scope.options.selectedCategory].page] = !$scope.options.userState.selectAll[$scope.options.selectedCategory][$scope.options.searchOptions.perCategory[$scope.options.selectedCategory].page];
            }
            else {
                $scope.options.userState.selectAll[$scope.options.selectedCategory][$scope.options.searchOptions.perCategory[$scope.options.selectedCategory].page] = true;
            }
        }
        else {
            $scope.options.userState.selectAll[$scope.options.selectedCategory] = {};
            $scope.options.userState.selectAll[$scope.options.selectedCategory][$scope.options.searchOptions.perCategory[$scope.options.selectedCategory].page] = true;
        }
    };

});

