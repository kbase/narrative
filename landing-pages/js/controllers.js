

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


app.controller('ModelViewer', function($scope, $stateParams, $location) {
    // style active tab
    var tab = $location.path().split('/')[2];
    $('.mv-tabs li').removeClass('active')
    $('.'+tab+'-tab').addClass('active')


    var q_string = $location.search();

    // set selected workspace.
    // this is only used for the objtable tab right now
    //$scope.selected_ws = q_string.selected_ws;
    //$scope.selected_ws = q_string.selected_ws ? q_string.selected_ws :
    //                    $stateParams.selected_ws;
    $scope.selected_ws = q_string.selected_ws;


    // set workspaces and ids.
    $scope.ws_param = q_string.ws;
    $scope.ids_param = q_string.ids;
    $scope.ws = q_string.ws ? q_string.ws.split('+') : '';
    $scope.ids = q_string.ids ? q_string.ids.split('+') : '';

    // show tabs if there are objects selected
    if ($scope.ids.length > 0) {
        $('.core-tab').removeClass('hide');
        $('.heatmap-tab').removeClass('hide');
        //$scope.showSelectedObjs();
    } else {
        $('.core-tab').addClass('hide')        
        $('.heatmap-tab').addClass('hide')
    }

    // events for workspace and selected object sidebar
    $('.show-ws').unbind('click');
    $('.show-ws').click(function(){
        $(this).siblings('button').removeClass('active');
        $(this).addClass('active');
        $scope.showWSSelector();
    });

    $('.show-objs').unbind('click');    
    $('.show-objs').click(function(){
        $(this).siblings('button').removeClass('active');
        $(this).addClass('active');
        $scope.showSelectedObjs();

    });

    // define some functions for the navigation of the left sidebar
    $scope.showSelectedObjs = function() {
        $('.wsselector').toggle('slide', {
                                direction: 'left',
                                duration: 'fast',
                                complete: function() {
                                    $('.selectedobjs').toggle('slide', {
                                        direction: 'left',
                                        duration: 'fast'});
                                }
        });
    }

    $scope.showWSSelector = function() {
        $('.selectedobjs').toggle('slide', {
                                    direction: 'left',
                                    duration: 'fast',
                                    complete: function() {
                                        $('.wsselector').toggle('slide', {
                                            direction: 'left',
                                            duration: 'fast'});
                                    }
        });
    }




    // removes items from the selected objects view
    $scope.removeItem = function(index){
        $scope.selectedObjs.splice(index, 1);
    }

})


.controller('Selector', function($scope, $location) {


})





.controller('MVHelp', function($scope, $stateParams, $location) {

    // Fixme: move out of controller
    $('.api-url-submit').click(function() {
        var form = $(this).parents('form');
        var url = '/'+form.attr('type')+'/'+form.find('#input1').val();
        if (form.find('#input2').val()) {
            url = url+'/'+form.find('#input2').val();
        }
    
        $scope.$apply( $location.path( url ) );
    });
})




.controller('GenomeDetail', function($scope, $stateParams) {

    $scope.params = {'genomeID': $stateParams.id,
                     'workspaceID': $stateParams.ws}
})

function MemeDetail($scope, $routeParams) {
    $scope.params = {'meme_run_result_id': $routeParams.id,
                     'workspace_id': $routeParams.ws}
}

function BambiDetail($scope, $routeParams) {
    $scope.params = {'bambi_run_result_id': $routeParams.id,
                     'workspace_id': $routeParams.ws}
}

function GeneDetail($scope, $routeParams) {
    $scope.params = {'geneID': $routeParams.id,
                     'workspaceID': $routeParams.ws}
}

function ModelDetail($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
}

function ModelDetailCards($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
}

function MediaDetail($scope, $routeParams) {
    $scope.ws = $routeParams.ws;
    $scope.id = $routeParams.id;
}

function MediaDetailCards($scope, $routeParams) {
    $scope.ws = $routeParams.ws;
    $scope.id = $routeParams.id;
}

function FBADetail($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
}
function FBADetailCards($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
}

function LPHelp($scope, $routeParams, $location) {
    // Fixme: move out of controller
    $('.api-url-submit').click(function() {
        var form = $(this).parents('form');
        var url = '/'+form.attr('type')+'/'+form.find('#input1').val();
        if (form.find('#input2').val()) {
            url = url+'/'+form.find('#input2').val();
        }
    
        $scope.$apply( $location.path( url ) );
    });
}

function WSObjects($scope, $routeParams, $location) {
    var type = $location.path().match(/\/\w*\/*/g)[0]
             .replace('/','').replace('/','');

    $scope.type = type;
    $scope.ws = $routeParams.ws;
}

function RxnDetail($scope, $routeParams, $location) {

    //$scope.ids = $routeParams.test.split('&');
    $scope.ids = ['rxn00001', 'rxn00002'];
}

function CpdDetail($scope, $routeParams, $location) {
    $scope.ids = $routeParams.ids.split('&');
}


function ScrollCtrl($scope, $location, $anchorScroll) {
  $scope.gotoAnchor = function (id){
    $location.hash(id);
    $anchorScroll();
  }
}

function SpecDetail($scope, $routeParams) {
	$scope.params = {
		'kind' : $routeParams.kind,
		'id' : $routeParams.id
	};
}


