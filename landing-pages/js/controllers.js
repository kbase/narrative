

/*  Controllers
 *
 *  These are the glue between models and views.
 *  The scope is global for these right now.  These should be modules
 *  or even services in the future.  
 *
 *  See: http://docs.angularjs.org/guide/dev_guide.mvc.understanding_controller
 *
 *
 *
*/

//angular.module('controllers', [])
//angular.module('controllers')
//.controller('WSBrowser', ['$scope', function($scope) {}])
//   ...

function IRIS($scope, $routeParams) {
}

function WSBrowser($scope, $routeParams) {
}


function GenomeDetail($scope, $routeParams) {
    $scope.params = {'genomeID': $routeParams.id,
                    'workspaceID': $routeParams.ws}
}

function GeneDetail($scope, $routeParams) {
    $scope.params = {'geneID': $routeParams.id,
                     'workspaceID': $routeParams.ws}
}

function ModelDetail($scope, $routeParams) {
    $scope.ws = $routeParams.ws;
    $scope.id = $routeParams.id;
}


function LPHelp($scope, $routeParams) {
    // Fixme: move out of controller
    $('.api-url-submit').click(function() {
        var form = $(this).parents('form');
        var url = '/'+form.attr('type')+'/'+form.find('#input1').val();
        if (form.find('#input2').val()) {
            url = url+'/'+form.find('#input2').val();
        }
        window.location.hash = url;
    });
}

function WSObjects($scope, $routeParams, $location) {
    var type = $location.path().match(/\/\w*\/*/g)[0]
             .replace('/','').replace('/','');

    $scope.type = type;
    $scope.ws = $routeParams.ws;
}

function RxnDetail($scope, $routeParams, $location) {
    $scope.ids = $routeParams.ids.split('&');
}

function CpdDetail($scope, $routeParams, $location) {
    $scope.ids = $routeParams.ids.split('&');
}


/*
var cache = $cacheFactory('lpCache');

var data = cache.get(someKey);

if (!data) {
   $http.get(url).success(function(result) {
      data = result;
      cache.put(someKey, data);
   });
  */ 