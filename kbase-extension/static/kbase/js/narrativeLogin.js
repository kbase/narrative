/*global define,window*/
/*jslint white:true,browser:true*/
/**
 * Uses the user's login information to initialize the IPython environment.
 * This should be one of the very first functions to be run on the page, as it sets up
 * the login widget, and wires the environment together.
 * @author Bill Riehl wjriehl@lbl.gov
 */
define ([
    'jquery',
    'kbapi',
    'base/js/utils',
    'narrativeConfig',
    'api/auth'
], function(
    $,
    kbapi,
    JupyterUtils,
    Config,
    Auth
) {
    'use strict';
    var baseUrl = JupyterUtils.get_body_data('baseUrl'),
        cookieName = Config.get('auth_cookie'),
        authClient = Auth.make({url: Config.url('auth')}),
        sessionInfo = null;

    /* set the auth token by calling the kernel execute method on a function in
     * the magics module
     */
    function ipythonLogin(token) {
        window.kb = new KBCacheClient(token);
        $.ajax({
            url: JupyterUtils.url_join_encode(baseUrl, 'login')
        }).then(
            function(ret) {
                // console.log(ret);
            }
        ).fail(
            function(err) {
                // console.err(err);
            }
        );
    }

    function ipythonLogout() {
        $.ajax({
            url: JupyterUtils.url_join_encode(baseUrl, 'logout')
        }).then(
            function(ret) {
                // console.log(ret);
            }
        ).fail(
            function(err) {
                // console.err(err);
            }
        );
        window.location.href = '/';
    }

    function showNotLoggedInDialog() {
        alert('You ain\'t logged in!');
    }

    function initEvents() {
        $(document).on('loggedInQuery.kbase', function() {
            return sessionInfo;
        });
        $(document).on('logout.kbase', function() {
            // redirect.
            ipythonLogout();
            alert('heading to logout page');
        });
    }

    function initUserWidget($elem) {
        $elem.append($('<div>thingy</div>').click(function() { $(document).trigger('logout.kbase'); }));
    }

    function init($elem) {
        /* Flow.
         * 1. Get cookie. If present and valid, yay. If not, dialog / redirect to login page.
         * 2. Setup event triggers. need loggedInQuery.kbase, promptForLogin.kbase, logout.kbase,
         * 3. events to trigger: loggedIn, loggedInFailure, loggedOut
         * 4. Set up user widget thing on #signin-button
         */
        var sessionToken = $.cookie(cookieName);
        return authClient.getTokenInfo(sessionToken)
        .then(function(tokenInfo) {
            this.sessionInfo = tokenInfo;
            this.sessionInfo.token = sessionToken;
            this.sessionInfo.kbase_sessionid = this.sessionInfo.id;
            initEvents();
            initUserWidget($elem);
            ipythonLogin(sessionToken);
            $(document).trigger('loggedIn');
        }.bind(this))
        .catch(function(error) {
            alert(JSON.stringify(error));
            showNotLoggedInDialog();
        });


        // loginWidget = new KBaseLogin($elem, {
        //     login_callback: function(args) {
        //         ipythonLogin(args.token);
        //     },
        //     logout_callback: function(args) {
        //         ipythonLogout();
        //     },
        //     prior_login_callback: function(args) {
        //         ipythonLogin(args.token);
        //     }
        // });
        //
        // if (loginWidget.token() === undefined) {
        //     loginWidget.openDialog();
        // }
    }
    //
    // var getLoginWidget = function($elem) {
    //     if (loginWidget === undefined && $elem !== undefined) {
    //         init($elem);
    //     }
    //     return loginWidget;
    // };

    return {
        init: init,
        sessionInfo: sessionInfo
        // loginWidget: getLoginWidget
    };
});
