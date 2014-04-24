

/*  Controllers
 *
 *  These are the 'glue' between models and views.
 *  See: http://docs.angularjs.org/guide/dev_guide.mvc.understanding_controller
 *  
 *  Controllers are responsible for state, setting navigation, substate, etc.
*/


app.controller('RxnDetail', function($scope, $stateParams) {
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
    $scope.params = {'genomeID' : $stateParams.id,
                     'workspaceID' : $stateParams.ws,
                     'kbCache' : kb}
})

.controller('GeneDetail', function($scope, $stateParams) {
    $scope.params = {'genomeID' : $stateParams.gid,
                     'featureID' : $stateParams.fid,
                     'workspaceID' : $stateParams.ws,
                     'version' : $stateParams.ver,
                     'kbCache' : kb}
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

.controller('MAKDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id,
                     'ws': $stateParams.ws};
})

.controller('RegpreciseDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id,
                     'ws': $stateParams.ws};
})

.controller('BambiDetail', function($scope, $stateParams) {
    $scope.params = {'bambi_run_result_id': $stateParams.id,
                     'workspace_id': $stateParams.ws}
})

.controller('PPIDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id,
		     'ws': $stateParams.ws};
})

.controller('SpecDetail', function($scope, $stateParams) {
    $scope.params = {
        'kind' : $stateParams.kind,
        'id' : $stateParams.id
    };
})


.controller('GPTypeDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id, 'ws':$stateParams.ws}
})

.controller('GTTypeDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id, 'ws':$stateParams.ws}
})

.controller('GVTypeDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id, 'ws':$stateParams.ws}
})

.controller('GGLTypeDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id, 'ws':$stateParams.ws}
})

.controller('GTVTypeDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id, 'ws':$stateParams.ws}
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

.controller('WB', function($scope, $stateParams) {
    $scope.selected_ws = $stateParams.ws;
})


.controller('WBLanding', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;

    $( "#sortable-landing" ).sortable({placeholder: "drag-placeholder", 
        handle: '.panel-heading',
        cancel: '.panel-title,.panel-subtitle,.label,.glyphicon',
        start: function() {
          $(this).find('.panel-body').addClass('hide');
          $(this).sortable('refreshPositions');
        },
        stop: function() {
          $(this).find('.panel-body').removeClass('hide');
        }
    });

    //$( "#sortable-landing" ).disableSelection();
})


.controller('WBModelLanding', function($scope, $stateParams, $location) {

    var type = $location.path().split('/')[2];
    if (type == 'fbas') {
        type = "FBA";
    } else if (type == "models") {
        type = "Model";
    }

    $scope.type = type;  
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
    $scope.selected = [{workspace: $scope.ws, name: $scope.id}]

    $scope.defaultMap = $stateParams.map;


    $( "#sortable-landing" ).sortable({placeholder: "drag-placeholder", 
        handle: '.panel-heading',
        cancel: '.panel-title,.panel-subtitle,.label,.glyphicon',
        start: function() {
          $(this).find('.panel-body').addClass('hide');
          $(this).sortable('refreshPositions');
        },
        stop: function() {
          $(this).find('.panel-body').removeClass('hide');
        }
    });
})

.controller('WBJSON', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
})

.controller('WBTour', function($scope, $stateParams, $location) {
    $scope.selected_ws = 'chenryExample';  // workspace to use for tour

    // if not logged in, prompt for login
    if (!USER_ID) {
        var signin_btn = $('#signin-button');
        signin_btn.popover({content: "You must login before taking the tour", 
                            trigger: 'manual', placement: 'bottom'})
        signin_btn.popover('show');

    // otherwise, do the tour
    } else {
        function checkSomething() {
            $scope.checkedList.push([ 'kb|g.0.fbamdl', 'chenryExample', 'FBAModel-2.0' ]);
            $('.ncheck').eq(2).addClass('ncheck-checked');
            $scope.$apply();
        }

        var tour = [{element: '.new-ws', text:'Create a new workspace here', placement: 'left'},
                    {element: '.btn-ws-settings', n: 2,
                        text:'Manage workspsace sharing and other settings, as \
                        well as clone and delete workspaces using the gear button.', 
                        bVisible: true, time: 4000},
                    {element: '.obj-id', n: 2, 
                        text: 'View data about the object, including visualizations and KBase widgets'},
                    {element: '.show-versions', n: 2, text: 'View the objects history.'},
                    {element: '.btn-show-info', n: 2, 
                        text: 'View meta data, download the objects, etc', bVisible: true},
                    {element: '.ncheck', n: 2, text: 'Select objects by using checkboxes<br> and see options appear above', 
                        event: checkSomething},
                    {element: '.type-filter', text: 'Filter objects by type'},
                    {element: '.btn-obj-table-settings', text: 'Show and hide columns and set other object table settings'},   
                    {element: '.btn-delete-obj', text: 'Delete the objects selected in the table'},
                    {element: '.btn-mv-dd', text: 'Go ahead, copy your colleague\'s objects to your own workspace'},
                    {element: '.btn-rename-obj', text: 'Rename a selected object'},                        
                    {element: '.btn-trash', text: 'View the trash bin for this workspace.<br>  \
                                    Unreferenced objects will be deleted after 30 days.'}]                        

        function exit_callback() {
            $scope.$apply( $location.path( '/ws/' ) );
        }

        new Tour({tour: tour, exit_callback: exit_callback});
    }   
})

.controller('Favorites', function($scope, $stateParams, favoriteService) {

    $scope.selected = [{workspace: 'chenrydemo', 
                        name: 'kb|g.9.fbamdl.25.fba.55'}];
    $scope.type = 'FBA'                        

    $scope.prom = kb.ujs.get_state('favorites', 'queue', 0);

    $.when($scope.prom).done(function(data) {
        $scope.favs = data;
        $scope.fav_by_kind = $scope.processData();
        $scope.$apply();
        console.log('fav_by_kind', $scope.fav_by_kind);
    })



    $scope.processData = function() {
        fav_by_kind = {}
        for (var i in $scope.favs) {
            var kind = $scope.favs[i].type.split('-')[0];
            if (kind in fav_by_kind) {
                fav_by_kind[kind].push($scope.favs[i])
            } else {
                fav_by_kind[kind] = []
                fav_by_kind[kind].push($scope.favs[i])
            }
        }

        return fav_by_kind;
    }

    $scope.rmObject = function(ws, id, type) {
        for (var i in $scope.favs) {
            if ($scope.favs[i].ws == ws
                && $scope.favs[i].id == id
                && $scope.favs[i].type == type) {
                $scope.favs.splice(i, 1);
            }
        }
        favoriteService.remove(ws, id, type);
        $scope.fav_by_kind = $scope.processData();
    }

    $scope.clearList = function() {
        console.log('clearing list')
        favoriteService.clear();
        $scope.favs = [];
        $scope.$apply();
    }


    $scope.displayViewer = function(ws, id, type) {
        console.log(this)
        console.log(ws,id,type)

    }


    //$scope.displayViewer('chenrydemo', 'kb|g.9.fbamdl.25.fba.55', 'FBA')


    $scope.AccordionCtrl = function($scope) {
      $scope.oneAtATime = true;



      $scope.items = ['Item 1', 'Item 2', 'Item 3'];

      $scope.addItem = function() {
        var newItemNo = $scope.items.length + 1;
        $scope.items.push('Item ' + newItemNo);
      };
    }



})


.controller('Narrative', function($scope, $stateParams, $location, kbaseLogin, $modal, FeedLoad) {
    //changeNav('narrative', 'newsfeed');
    $scope.nar_url = configJSON.narrative_url; // used for links to narratives

    //to open the copy narrative dialog
    $scope.copyNarrativeForm = function (title) {

        //$scope.narr.title = title;

        var modalInstance = $modal.open({
          templateUrl: 'views/narrative/dialogboxes/copynarrative.html',
          controller: CopyNarrativeModalCtrl,
          resolve: {
                narr: function () {
                    return title;
                    }
                
            }
        });
    };

    // callback for ng-click 'loginUser':
    $scope.loginUser = function (user) {
        $("#loading-indicator").show();
        kbaseLogin.login(
            user.username,
            user.password,
            function(args) {
                console.log(args);
                if (args.success === 1) {
                        
                    this.registerLogin(args);
                    //this.data('_session', kbaseCookie);

                    //set the cookie
                    var c = $("#login-widget").kbaseLogin('get_kbase_cookie');
                    
                    console.log( 'Setting kbase_session cookie');
                    $.cookie('kbase_session',
                             'un=' + c.user_id
                             + '|'
                             + 'kbase_sessionid=' + c.kbase_sessionid
                             + '|'
                             + 'user_id=' + c.user_id
                             + '|'
                             + 'token=' + c.token.replace(/=/g, 'EQUALSSIGN').replace(/\|/g,'PIPESIGN'),
                             { path: '/',
                               domain: 'kbase.us' });
                    $.cookie('kbase_session',
                             'un=' + c.user_id
                             + '|'
                             + 'kbase_sessionid=' + c.kbase_sessionid
                             + '|'
                             + 'user_id=' + c.user_id
                             + '|'
                             + 'token=' + c.token.replace(/=/g, 'EQUALSSIGN').replace(/\|/g,'PIPESIGN'),
                             { path: '/'});

                    //this.data('_session', c);

                    USER_ID = $("#signin-button").kbaseLogin('session').user_id;
                    USER_TOKEN = $("#signin-button").kbaseLogin('session').token;

                    kb = new KBCacheClient(USER_TOKEN);
                    kb.nar.ensure_home_project(USER_ID);

                    $location.path('/narrative/');
                    $scope.$apply();
                    
                } else {
                    console.log("error logging in");
                    $("#loading-indicator").hide();
                    $("#login_error").html(args.message);
                    $("#login_error").show();

                }

            }
        )
        
    };

})

.controller('Search', function($scope, $stateParams, $state) {

    $scope.query = $stateParams.q;

    $scope.startSearch = function (searchquery) {
        $state.transitionTo('search', {q: searchquery})
    };
})


/*
.controller('CopyNarrativeModalCtrl', function ($scope, $modalInstance) {
// controller for the modals to copy a featured narrative 
  $scope.save = function () {
    $modalInstance.dismiss('cancel');
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})
*/
.controller('NarrativeProjects', function($scope, $stateParams) {

})




/* controller for the copy narrative modal */
var CopyNarrativeModalCtrl = function ($scope, $modalInstance, $location, narr) {

    $scope.narr = narr;
    // callback for ng-click 'copy narrative':
    $scope.copyNarrative = function () {
        $('#loading-indicator').show();
        $('#copy-narr-button').attr("disabled", "disabled");
        kb.nar.copy_narrative({
            fq_id: $scope.narr,
            callback: function(results) {
                
                //console.log("copied narrative " + results.fq_id);
                window.location.replace("http://demo.kbase.us/narrative/" + results.fq_id);
                //$modalInstance.dismiss();

                
            },
            error_callback: function(message) {
                //console.log("error occurred " + message);

                if (!message.match("No object with name")) {
                    $('#loading-indicator').hide();

                    $scope.alerts = [];
                    $scope.alerts.push({type: 'danger', msg: "We were unable to copy the narrative and its datasets into your home workspace. Error: " + message});
                    //TODO need to retrieve the actual error message 
                    $scope.$apply();
                }
            }

        })
    }
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };

};


function LPHelp($scope, $stateParams, $location) {
    // Fixme: move out of controller
    $('.api-url-submit').click(function() {
        var form = $(this).parents('form');
        var url = '/'+form.attr('type')+'/'+form.find('#input1').val();
        if (form.find('#input2').val()) {
            url = url+'/'+form.find('#input2').val();
        }
        if (form.find('#input3').val()) {
            url = url+'/'+form.find('#input3').val();
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

