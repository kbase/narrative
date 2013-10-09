
var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
var kbws = new workspaceService('http://kbase.us/services/workspace_service/');


var app = angular.module('landing-pages', ['lp-directives', 'iris-directives']).
    config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/workspace-browser', 
            {templateUrl: 'views/ws-browser.html',
             controller: WSBrowser})

        .when('/genomes/cs/:id',
            {templateUrl: 'views/objects/genome.html',
             controller: GenomeDetail})
        .when('/genomes/:ws',
            {templateUrl: 'views/objects/genome.html',
             controller: GenomeDetail})
        .when('/genomes/:ws/:id',
            {templateUrl: 'views/objects/genome.html',
             controller: GenomeDetail})

        .when('/genes/CDS/:id',
            {templateUrl: 'views/objects/gene.html',
             controller: GeneDetail })
        .when('/genes/:ws/:id',
            {templateUrl: 'views/objects/gene.html',
             controller: GeneDetail })

        .when('/models',
            {templateUrl: 'views/object-list.html',
             controller: WSObjects})        
        .when('/models/:ws',
            {templateUrl: 'views/object-list.html',
             controller: WSObjects})
        .when('/models/:ws/:id', 
            {templateUrl: 'views/objects/model.html',
             controller: ModelDetail})

        .when('/media',
            {templateUrl: 'views/object-list.html',
             controller: WSObjects})        
        .when('/media/:ws',
            {templateUrl: 'views/object-list.html',
             controller: WSObjects})

        .when('/fbas/:ws', 
            {templateUrl: 'views/object-list.html',
             controller: WSObjects})
        .when('/fbas/:ws/:id', 
            {templateUrl: 'views/objects/model.html',
             controller: ModelDetail})        

        .when('/rxns', 
            {templateUrl: 'views/object-list.html',
             controller: WSObjects})
        .when('/rxns/:ids', 
            {templateUrl: 'views/objects/rxn.html',
             controller: RxnDetail}) 
        .when('/rxns/:ws/:ids', 
            {templateUrl: 'views/objects/coming-soon.html',
             controller: RxnDetail})

        .when('/cpds', 
            {templateUrl: 'views/object-list.html',
             controller: WSObjects})
        .when('/cpds/:ids', 
            {templateUrl: 'views/objects/cpd.html',
             controller: CpdDetail})           
      
   
        .when('/iris', 
            {templateUrl: 'views/iris.html',
             controller: IRIS})   

        .when('/landing-pages-help',
            {templateUrl: 'views/landing-pages-help.html',
             controller: LPHelp})

        .when('/404',
            {templateUrl: 'views/404.html'})

        .otherwise({redirectTo: '/404'})

}])


app.run(function ($rootScope) {
    $('#navigation').load('partials/nav.html', function(){	
	    // sign in button
	    $('#signin-button').kbaseLogin({style: 'text', 
	        login_callback: reload_window, logout_callback: reload_window});

	    $rootScope.USER_TOKEN = $("#signin-button").kbaseLogin('session').token;
        $rootScope.USER_ID = $("#signin-button").kbaseLogin('session').user_id;

	    // global state object to store state
	    state = new State();

	    // set the currently selected workspace.
	    set_selected_workspace();
	});
});


/*
 *   landing page app helper functions
 */

function reload_window() {
    window.location.reload();
}

function get_selected_ws() {
    if (state.get('selected')) {
        return state.get('selected')[0];
    }
}

function set_selected_workspace() {
    if (state.get('selected')) {
        $('#selected-workspace').html(state.get('selected')[0]);
    }
}

function navEvent() {
    console.log('nav event');
    $(document).trigger("navEvent");
}




/***************************  END landing page stuff  ********************************/

/*
 *  Function to store state in local storage.
 */
function State() {
    // Adapted from here: http://diveintohtml5.info/storage.html
    var ls;
    try {
        ls = 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        ls = false;
    }

    //var user = (auth.isLoggedIn() ? auth.getUserData().user_id : 'public');

    this.get = function(key) {
        if (!ls) {
            return null;
        }

        //key = user + '.' + key;

        var val = localStorage.getItem(key);

        try {
            val = JSON.parse(val);
        } catch(e) {
            return null;
        };

        return val;
    };

    this.set = function(key, val) {
        if (!ls) {
            return null;
        }

        //key = user + '.' + key;
        
        try {
            val = JSON.stringify(val);
        } catch(e) {
            return null;
        }

        return localStorage.setItem(key, val);
    };
}




