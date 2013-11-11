
/*
 *  Landing Page App 
 *
 *  Right now, this file is responsible for landing page URLs
 *  and which controllers and templates are used.
 *
 *  The app uses angular.js, a MVC front-end framework.
 *
 *  -- Some of the critical files --
 *  Controllers:       landing-pages/js/controllers.js
 *  Directives:        landing-pages/js/directives.js 
 *                                     /iris-directives.js
 *  Views (templates): landing-pages/views/* 
 *
*/


var app = angular.module('landing-pages', 
    ['lp-directives', 'card-directives', 'mv-directives', 'ui.router'])
    .config(['$routeProvider', '$locationProvider', '$stateProvider', '$urlRouterProvider', 
    function($routeProvider, $locationProvider, $stateProvider, $urlRouterProvider) {

    // with some configuration, we can change this in the future.
    $locationProvider.html5Mode(false);  

    $stateProvider
        .state('mv', {
          url: "/mv/",
          templateUrl: 'views/mv/mv.html',
          controller: 'ModelViewer'
        })   
        
        .state('mv.objtable', {
          url: "objtable/?selected_ws&ws&ids",
          templateUrl: 'views/mv/objtable.html',
          controller: 'ModelViewer'
        })
        /*
        .state('mv.objtable.selectedobjs', {
          url: "?selected_ws&ws&ids",
          templateUrl: 'views/mv/objtable.html',
          controller: 'ModelViewer'
        })*/       
        .state('mv.core', {
            url: "core/?ws&ids",
            templateUrl: 'views/mv/core.html',
            controller: 'ModelViewer'
        })
        .state('mv.heatmap', {
            url: "heatmap/?ws&ids",
            templateUrl: 'views/mv/heatmap.html',
            controller: 'ModelViewer'
        })

    $stateProvider
        .state('rxns', {
            url: "/rxns/:test",
            templateUrl: 'views/objects/rxn.html',
            controller: RxnDetail
        })


    $stateProvider
        .state('models', {
             url: '/models',
             templateUrl: 'views/object-list.html',
             controller: WSObjects})  
        .state('modelsbyws', {
             url: '/models/:ws',
             templateUrl: 'views/object-list.html',
             controller: WSObjects})
        .state('modelbyid', {
             url: '/models/:ws/:id',
             templateUrl: 'views/objects/model.html',
             controller: ModelDetail})

    $stateProvider
        .state('modelcards', {
             url: '/cards/models/:ws/:id',
             templateUrl: 'views/objects/modelcards.html',
             controller: ModelDetailCards})

    $stateProvider
        .state('fbasbyws', {
                url:'/fbas/:ws', 
                templateUrl: 'views/object-list.html',
                controller: WSObjects})
        .state('fbabyid', {
                url: '/fbas/:ws/:id',
                templateUrl: 'views/objects/fba.html',
                controller: FBADetail})
        .state('fbacards', {
                url: '/cards/fbas/:ws/:id',
                templateUrl: 'views/objects/fbacards.html',
                controller: FBADetailCards})


    $stateProvider
        .state('mvhelp',
            {url: '/mv-help',
             templateUrl: 'views/mv/mv-help.html',
             controller: 'MVHelp'})


    $stateProvider
        .state('genomes',
            {url: '/genomes/CDS/:id',
             templateUrl: 'views/objects/genome.html',
             controller: 'GenomeDetail'})

    $stateProvider
        .state('genomesbyws',
            {url: '/genomes/:ws',
             templateUrl: 'views/objects/genome.html',
             controller: 'GenomeDetail'})

    $stateProvider
        .state('genomesbyid',
            {url: '/genomes/:ws/:id',
             templateUrl: 'views/objects/genome.html',
             controller: 'GenomeDetail'})

    /*

    $routeProvider
        .when('/workspace-browser', 
            {templateUrl: 'views/ws-browser.html',
             controller: WSBrowser})

        .when('/genomes/CDS/:id',
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
        .when('/cards/models/:ws/:id', 
            {templateUrl: 'views/objects/modelcards.html',
             controller: ModelDetailCards})

        .when('/media',
            {templateUrl: 'views/object-list.html',
             controller: WSObjects})
        .when('/media/:ws',
            {templateUrl: 'views/object-list.html',
             controller: WSObjects})
        .when('/media/:ws/:id',
            {templateUrl: 'views/objects/media.html',
             controller: MediaDetail})

        .when('/fbas/:ws', 
            {templateUrl: 'views/object-list.html',
             controller: WSObjects})
        .when('/fbas/:ws/:id',
            {templateUrl: 'views/objects/fba.html',
             controller: FBADetail})
        .when('/cards/fbas/:ws/:id',
            {templateUrl: 'views/objects/fbacards.html',
             controller: FBADetailCards})

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

        .when('/meme',
            {templateUrl: 'views/meme-list.html',
             controller: WSObjects})
        .when('/meme/:ws',
            {templateUrl: 'views/meme-list.html',
             controller: WSObjects})
        .when('/meme/:ws/:id',
            {templateUrl: 'views/objects/meme.html',
             controller: MemeDetail})
         
        .when('/iris', 
            {templateUrl: 'views/iris.html',
             controller: IRIS})   

        .when('/landing-pages-help',
            {templateUrl: 'views/landing-pages-help.html',
             controller: LPHelp})

        .when('/404',
            {templateUrl: 'views/404.html'})

        .when('/',
            {templateUrl: 'views/landing-pages-help.html',
             controller: LPHelp})
        */

//        .otherwise({redirectTo: '/404'})

}])


app.run(function ($rootScope, $location) {
    // use partials nav_func.html for narrative/functional website look
    // Fixme: this should be a template, loaded with ui-router the same way
    // as the rest of the app.
    $('#navigation').load('partials/nav-mv.html', function(){ 
        // sign in button
        $('#signin-button').kbaseLogin({style: 'narrative', 
                                        login_callback: login_change,
                                        logout_callback: login_change
                                       });

        $rootScope.USER_TOKEN = $("#signin-button").kbaseLogin('session').token;
        $rootScope.USER_ID = $("#signin-button").kbaseLogin('session').user_id;

        // hack
        USER_ID = $rootScope.USER_ID;
        USER_TOKEN = $rootScope.USER_TOKEN;
        kb = new kb(USER_TOKEN);

        // global state object to store state
        state = new State();

        // set the currently selected workspace.
        set_selected_workspace();
    });


    // here's a workaround so that ui-router doesn't remove query strings.
    $rootScope.$on('$stateChangeStart',
    function (event, toState, toParams, fromState, fromParams) {
        //save location.search so we can add it back after transition is done
        this.locationSearch = $location.search();
    });
    $rootScope.$on('$stateChangeSuccess',
    function (event, toState, toParams, fromState, fromParams) {
        //restore all query string parameters back to $location.search
        $location.search(this.locationSearch);
    });


    //  Here's a sort of hack to remove any cards when a view changes.
    //  There may be a better way to manage this.
    $rootScope.$on('$stateChangeSuccess', function() {
        //$('.popover').each(function() { $(this).remove() }); 
        removeCards();
    })
});


/*
 *   landing page app helper functions
 */

function login_change() {
    window.location.reload();
    set_cookie();
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

function removeCards() {
    $(".ui-dialog").remove();    
    //$("#genomes").KBaseCardLayoutManager("destroy");
}


function set_cookie() {
   var c = $("#signin-button").kbaseLogin('get_kbase_cookie');
   console.log( 'Setting kbase_session cookie');
   $.cookie('kbase_session',
    'un=' + c.user_id
    + '|'
    + 'kbase_sessionid=' + c.kbase_sessionid
    + '|'
    + 'user_id=' + c.user_id
    + '|'
    + 'token=' + c.token.replace(/=/g, 'EQUALSSIGN').replace(/\|/g,'PIPESIGN'),
    { path: '/'});
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
};


$.fn.loading = function(text) {
    $(this).rmLoading()

    if (text) {
        $(this).append('<p class="text-muted loader"> \
             <img src="assets/img/ajax-loader.gif"> '+text+'</p>');
    } else {
        $(this).append('<p class="text-muted loader"> \
             <img src="assets/img/ajax-loader.gif"> loading...</p>')        
    }
    return this;
}

$.fn.rmLoading = function() {
    $(this).find('.loader').remove();
}



/*
 *  Object to store state in local storage.
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




