

/*  Controllers
 *
 *  These are the 'glue' between models and views.
 *  See: http://docs.angularjs.org/guide/dev_guide.mvc.understanding_controller
 *
*/


app.controller('ModelViewer', function($scope, $stateParams, $location) {
    // style active tab
    var tab = $location.path().split('/')[2];
    $('.mv-tabs li').removeClass('active');
    $('.'+tab+'-tab').addClass('active');


    var q_string = $location.search();

    // set selected workspace.
    // this is only used for the objtable tab right now
    //$scope.selected_ws = q_string.selected_ws;
    //$scope.selected_ws = q_string.selected_ws ? q_string.selected_ws :
    //                    $stateParams.selected_ws;
    $scope.selected_ws = q_string.selected_ws ? q_string.selected_ws : false;


    // set workspaces and ids.
    $scope.ws_param = q_string.ws;
    $scope.ids_param = q_string.ids;
    $scope.ws = q_string.ws ? q_string.ws.split('+') : '';
    $scope.ids = q_string.ids ? q_string.ids.split('+') : '';

    // show tabs if there are objects selected
    if ($scope.ids.length > 0) {
        $('.core-tab').removeClass('hide');
        $('.heatmap-tab').removeClass('hide');
    } else {
        $('.core-tab').addClass('hide');
        $('.heatmap-tab').addClass('hide');
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

    console.log('called controller')
 

    // removes items from the selected objects view
    $scope.removeItem = function(index){
        $scope.selectedObjs.splice(index, 1);
    }

    console.log('tab', tab)

})


.controller('Selector', function($scope, $location) {

})

.controller('RxnDetail', function($scope, $stateParams) {
    $scope.ids = $stateParams.ids.split('&');
})


.controller('CpdDetail', function($scope, $stateParams) {
    $scope.ids = $stateParams.ids.split('&');
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

.controller('GWASPopDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id,
                     'workspaceID': $stateParams.ws}
})

.controller('MediaDetail', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
})

.controller('ModelDetailCards', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
})  

.controller('MemeDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id,
                     'ws': $stateParams.ws};
})

.controller('CmonkeyDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id,
                     'ws': $stateParams.ws};
})

.controller('InferelatorDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id,
                     'ws': $stateParams.ws};
})

        .controller('BambiDetail', function($scope, $stateParams) {
    $scope.params = {'bambi_run_result_id': $stateParams.id,
                     'workspace_id': $stateParams.ws}
})

.controller('SpecDetail', function($scope, $stateParams) {
    $scope.params = {
        'kind' : $stateParams.kind,
        'id' : $stateParams.id
    };
})


.controller('GPTypeDetail', function($scope, $stateParams) {
    $scope.params = {'gwaspopulationId': $stateParams.id}
})

.controller('GTTypeDetail', function($scope, $stateParams) {
    $scope.params = {'gwastraitId': $stateParams.id}
})


.controller('GeneDetail', function($scope, $stateParams) {
    $scope.params = {'geneID': $stateParams.id,
                     'workspaceID': $stateParams.ws}
})

.controller('ModelDetail', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
})

.controller('ModelDetailCards', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
})

.controller('FBADetail', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
})

.controller('FBADetailCards', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
})

.controller('WSObjects', function($scope, $stateParams, $location) {
    var type = $location.path().match(/\/\w*\/*/g)[0]
             .replace('/','').replace('/','');

    $scope.type = type;
    $scope.ws = $stateParams.ws;
})

.controller('Trees', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
    })

.controller('WorkspaceBrowser', function($scope, $stateParams) {
    $scope.selected_ws = $stateParams.ws;
    console.log($scope.selected_ws)
})



function LPHelp($scope, $stateParams, $location) {
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


function ScrollCtrl($scope, $location, $anchorScroll) {
  $scope.gotoAnchor = function (id){
    $location.hash(id);
    $anchorScroll();
  }
}



