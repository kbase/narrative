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
    'bluebird',
    'kbapi',
    'base/js/utils',
    'narrativeConfig',
    'api/auth',
    'userMenu',
    'util/bootstrapDialog'
], function(
    $,
    Promise,
    kbapi,
    JupyterUtils,
    Config,
    Auth,
    UserMenu,
    BootstrapDialog
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
        var dialog = new BootstrapDialog({
            'title': 'Not Logged In',
            'body': $('<div>').append('You are not logged in (or your session has expired), and you will be redirected to the sign in page shortly.'),
            'buttons': [$('<a type="button" class="btn btn-default">')
                        .append('OK')
                        .click(function () {
                            dialog.hide();
                        })]
        });
        dialog.show();
    }

    function initEvents() {
        $(document).on('loggedInQuery.kbase', function(e, callback) {
            if (callback) {
                callback(sessionInfo);
            }
        });

        $(document).on('logout.kbase', function() {
            alert('Thanks for using KBase!');
            ipythonLogout();
        });
    }

    function init($elem) {
        /* Flow.
         * 1. Get cookie. If present and valid, yay. If not, dialog / redirect to login page.
         * 2. Setup event triggers. need loggedInQuery.kbase, promptForLogin.kbase, logout.kbase,
         * 3. events to trigger: loggedIn, loggedInFailure, loggedOut
         * 4. Set up user widget thing on #signin-button
         */
        var sessionToken = $.cookie(cookieName);
        return Promise.all([authClient.getTokenInfo(sessionToken), authClient.getUserProfile(sessionToken)])
            .then(function(results) {
                var tokenInfo = results[0];
                sessionInfo = tokenInfo;
                this.sessionInfo = tokenInfo;
                this.sessionInfo.token = sessionToken;
                this.sessionInfo.kbase_sessionid = this.sessionInfo.id;
                initEvents();
                UserMenu.make({
                    target: $elem,
                    token: sessionToken,
                    userName: sessionInfo.user,
                    email: results[1].email,
                    displayName: results[1].display
                });
                ipythonLogin(sessionToken);
                $(document).trigger('loggedIn', this.sessionInfo);
                $(document).trigger('loggedIn.kbase', this.sessionInfo);
            }.bind(this))
            .catch(function(error) {
                showNotLoggedInDialog();
            });
    }

    return {
        init: init,
        sessionInfo: sessionInfo
    };
});
