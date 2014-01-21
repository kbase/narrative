
/*
 *  Landing Page App 
 *
 *  Right now, this file is responsible for landing page URLs
 *  and which controllers and templates are used.
 *
 *  The app uses angular.js, a MVC front-end framework.
 *
 *  -- Some of the critical files --
 *  App:               landing-pages/js/app.js
 *  Controllers:       landing-pages/js/controllers.js
 *  Directives:        landing-pages/js/directives.js 
 *                                     /card-directives.js 
 *                                     /iris-directives.js
 *                                     /mv-directives.js 
 *  Views (templates): landing-pages/views/* 
 *
*/


var app = angular.module('landing-pages', 
    ['lp-directives', 'card-directives', 'mv-directives', 'trees-directives', 'ws-directives', 'ui.router'])
    .config(['$routeProvider', '$locationProvider', '$stateProvider', '$urlRouterProvider', 
    function($routeProvider, $locationProvider, $stateProvider, $urlRouterProvider) {

    // with some configuration, we can change this in the future.
    $locationProvider.html5Mode(false);  


    $stateProvider
        .state('ws', {
          url: "/ws/",
          templateUrl: 'views/ws/ws.html',
          controller: 'WorkspaceBrowser'
        }).state('ws.id', {
          url: "objtable/:ws",
          templateUrl: 'views/ws/objtable.html',
          controller: 'WorkspaceBrowser'
        })


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
        .state('mv.tree', {
            url: "tree/?ws&ids",
            templateUrl: 'views/mv/tree.html',
            controller: 'ModelViewer'
        })        

    $stateProvider
        .state('trees', {
          url: "/trees/",
          templateUrl: 'views/trees/trees.html',
          controller: 'Trees'
        })

    $stateProvider
        .state('rxns',
            {url:'/rxns', 
             templateUrl: 'views/object-list.html',
             controller: 'WSObjects'}) 
        .state('rxnsids', {
            url: "/rxns/:ids",
            templateUrl: 'views/objects/rxn.html',
            controller: 'RxnDetail'
        })



    $stateProvider
        .state('cpds',
            {url:'/cpds', 
             templateUrl: 'views/object-list.html',
             controller: 'WSObjects'})   
        .state('cpdsids',
            {url:'/cpds/:ids', 
             templateUrl: 'views/objects/cpd.html',
             controller: 'CpdDetail'
         })       

    $stateProvider
        .state('models', {
             url: '/models',
             templateUrl: 'views/object-list.html',
             controller: 'WSObjects'})  
        .state('modelsbyws', {
             url: '/models/:ws',
             templateUrl: 'views/object-list.html',
             controller: 'WSObjects'})
        .state('modelbyid', {
             url: '/models/:ws/:id',
             templateUrl: 'views/objects/model.html',
             controller: 'ModelDetail'})

    $stateProvider
        .state('modelcards', {
             url: '/cards/models/:ws/:id',
             templateUrl: 'views/objects/modelcards.html',
             controller: 'ModelDetailCards'})

    $stateProvider
       .state('gptype', {
            url: '/gwaspopulation/:id',
            templateUrl: 'views/objects/gptype.html',
            controller: 'GPTypeDetail'})  
       .state('gttype', {
            url: '/gwastraits/:id',
            templateUrl: 'views/objects/gttype.html',
            controller: 'GTTypeDetail'})  

    $stateProvider
        .state('fbasbyws', {
                url:'/fbas/:ws', 
                templateUrl: 'views/object-list.html',
                controller: 'WSObjects'})
        .state('fbabyid', {
                url: '/fbas/:ws/:id',
                templateUrl: 'views/objects/fba.html',
                controller: 'FBADetail'})
        .state('fbacards', {
                url: '/cards/fbas/:ws/:id',
                templateUrl: 'views/objects/fbacards.html',
                controller: 'FBADetailCards'})

    $stateProvider
        .state('media',
            {url:'/media',
            templateUrl: 'views/object-list.html',
             controller: 'WSObjects'})
        .state('mediabyws',
            {url:'/media/:ws',
             templateUrl: 'views/object-list.html',
             controller: 'WSObjects'})
        .state('mediabyid',
            {url:'/media/:ws/:id',
             templateUrl: 'views/objects/media.html',
             controller: 'MediaDetail'})

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

    $stateProvider
        .state('gwaspop',
            {url: '/gwas/gwaspopulation/:ws/:id',
             templateUrl: 'views/objects/gwaspopulation.html',
             controller: 'GWASPopDetail'})


    $stateProvider
        .state('meme',
            {url:'/meme',
             templateUrl: 'views/meme-list.html',
             controller: 'WSObjects'})
        .state('memebyws',
            {url: '/meme/:ws',
             templateUrl: 'views/meme-list.html',
             controller: 'WSObjects'})
        .state('memebyname',
            {url: '/meme/:ws/:id',
             templateUrl: 'views/objects/meme.html',
             controller: 'MemeDetail'})

    $stateProvider
        .state('cmonkeybyname',
            {url: '/cmonkey/:ws/:id',
             templateUrl: 'views/objects/cmonkey.html',
             controller: 'CmonkeyDetail'})

    $stateProvider
        .state('inferelator',
            {url: '/inferelator/:ws/:id',
             templateUrl: 'views/objects/inferelator.html',
             controller: 'InferelatorDetail'})

    $stateProvider
        .state('regprecise',
            {url: '/regprecise/:ws/:id',
             templateUrl: 'views/objects/regprecise.html',
             controller: 'RegpreciseDetail'})

    $stateProvider
        .state('mak',
            {url: '/mak/:ws/:id',
             templateUrl: 'views/objects/mak.html',
             controller: 'MAKDetail'})

    $stateProvider
        .state('spec',
            {url: '/spec/:kind/:id',
             templateUrl: 'views/objects/spec.html',
             controller: 'SpecDetail'})

    $stateProvider
        .state('bambibyid',
            {url: '/bambi/:ws/:id',
            templateUrl: 'views/objects/bambi.html',
             controller: 'BambiDetail'})

    $stateProvider
	.state('ppid',
	   {url: '/ppid/:ws/:id',
	    templateUrl: 'views/objects/ppid.html',
	    controller: 'PPIDetail'})

    $stateProvider
        .state('landing-pages-help',
            {url: '/landing-pages-help',
             templateUrl: 'views/landing-pages-help.html',
             controller: LPHelp})

    $urlRouterProvider.when('', '/landing-pages-help');

    $stateProvider
        .state('otherwise', 
            {url: '*path', 
             templateUrl : 'views/404.html'})

}])



LPDROPDOWN = '<a href="#" class="dropdown-toggle" data-toggle="dropdown">Help <b class="caret"></b></a> \
                 <ul class="dropdown-menu"> \
                 <li><a href="#/landing-pages-help">Landing Page Documentation</a></li> \
              </ul>';


app.run(function ($rootScope, $location) {
    // use partials nav_func.html for narrative/functional website look
    // Fixme: this should be a template, loaded with ui-router the same way
    // as the rest of the app.

    $('#navigation').load('partials/nav.html', function(){
        navbar_cb();
    });

    $rootScope.$on('$stateChangeStart',
        function (event, toState, toParams, fromState, fromParams) {
            subURL = toState.name.split('.')[0];
            if (subURL == 'trees') {
                $('#navigation').load('partials/nav-trees.html', navbar_cb);
            } else if (subURL == 'mv') {
                $('#navigation').load('partials/nav-mv.html', navbar_cb);
            } else if (subURL == 'ws') {
                $('#navigation').load('partials/nav-ws.html', navbar_cb);
            } else {
                $('#navigation').load('partials/nav.html', navbar_cb);              
            }

        });

    //  Here's a sort of hack to remove any cards when a view changes.
    //  There may be a better way to manage this.
    $rootScope.$on('$stateChangeSuccess', function() {
        removeCards();
    })

    // here's a workaround so that ui-router doesn't remove query strings.
    /*
    $rootScope.$on('$stateChangeStart',
    function (event, toState, toParams, fromState, fromParams) {
        this.locationSearch = $location.search();
    });
    $rootScope.$on('$stateChangeSuccess',
        function (event, toState, toParams, fromState, fromParams) {
            $location.search(this.locationSearch);
        });
    */

    function navbar_cb() {
        // sign in button
        $('#signin-button').kbaseLogin({login_callback: login_change,
                                        logout_callback: login_change});
        $('#signin-button').css('padding', '0');  // Jim!

        $('.help-dropdown').html(LPDROPDOWN);

        $rootScope.USER_TOKEN = $("#signin-button").kbaseLogin('session').token;
        $rootScope.USER_ID = $("#signin-button").kbaseLogin('session').user_id;

        // hack
        USER_ID = $rootScope.USER_ID;
        USER_TOKEN = $rootScope.USER_TOKEN;
        kb = new KBCacheClient(USER_TOKEN);

        // global state object to store state
        state = new State();

        // set the currently selected workspace.
        set_selected_workspace();

    }

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

