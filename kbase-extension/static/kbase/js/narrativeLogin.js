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
        authClient = Auth.make({url: Config.url('auth')}),
        sessionInfo = null,
        tokenCheckTimer,
        tokenWarningTimer;

    /**
     * Sets the auth token in the Tornado server environment that runs the Narrative. This
     * effectively goes to the notebook server /login path, which invokes the auth handler,
     * that handles cookie validation and management.
     * @param {string} token
     */
    function ipythonLogin(token) {
        window.kb = new KBCacheClient(token);
        return Promise.resolve($.ajax({
            url: JupyterUtils.url_join_encode(baseUrl, 'login')
        }))
            .then(ret => {
                // console.log(ret);
            }).catch(err => {
                // console.err(err);
            });
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

    function showTokenInjectionDialog() {
        var $inputField = $('<input type="text" class="form-control">');
        var $body = $('<div>')
            .append('<div>You appear to be working on a local development environment of the Narrative Interface, but you don\'t have a valid auth token. You can paste one in below.</div>')
            .append('<div><b>You are operating in the ' + Config.get('environment') + ' environment.')
            .append($('<div>').append($inputField));
        var dialog = new BootstrapDialog({
            'title': 'Insert an authentication token?',
            'body': $body,
            'buttons': [$('<a type="button" class="btn btn-default">')
                .append('OK')
                .click(function () {
                    dialog.hide();
                    var newToken = $inputField.val();
                    authClient.setAuthToken(newToken);
                    location.reload();
                })]
        });
        dialog.show();
    }

    function showNotLoggedInDialog() {
        var dialog = new BootstrapDialog({
            'title': 'Not Logged In',
            'body': $('<div>').append('You are not logged in (or your session has expired), and you will be redirected to the sign in page shortly.'),
            'buttons': [
                $('<a type="button" class="btn btn-default">')
                    .append('OK')
                    .click(function () {
                        dialog.hide();
                        ipythonLogout();
                    })
            ]
        });
        dialog.show();
    }

    function showAboutToLogoutDialog(tokenExpirationTime) {
        var dialog = new BootstrapDialog({
            'title': 'Expiring session',
            'body': $('<div>').append('Your authenticated KBase session will expire in approximately 5 minutes. To continue using KBase, we suggest you log out and back in.'),
            'buttons': [
                $('<a type="button" class="btn btn-default">')
                    .append('OK')
                    .click(function () {
                        var remainingTime = tokenExpirationTime - new Date().getTime();
                        if (remainingTime < 0) {
                            remainingTime = 0;
                        }
                        tokenWarningTimer = setTimeout(function() {
                            tokenTimeout();
                        });
                        dialog.hide();
                    })
            ]
        });
        dialog.show();
    }

    function initEvents() {
        $(document).on('loggedInQuery.kbase', function(e, callback) {
            if (callback) {
                callback(sessionInfo);
            }
        });

        $(document).on('logout.kbase', function(e, hideMessage) {
            tokenTimeout(!hideMessage);
        });
    }

    function initTokenTimer(tokenExpirationTime) {
        /**
         * First timer - check for token existence very second.
         * trigger the logout behavior if it's not there.
         */
        var lastCheckTime = new Date().getTime(),
            browserSleepValidateTime = Config.get('auth_sleep_recheck_ms'),
            validateOnCheck = false,
            validationInProgress = false;
        clearTokenCheckTimers();
        tokenCheckTimer = setInterval(() => {
            // fetch the token, timeout right away if it's null (i.e., been timed out in another
            // window, had the cookie deleted by the user, etc.)
            const token = authClient.getAuthToken();
            if (!token) {
                tokenTimeout();
            }
            // Shouldn't spam the Auth service with validation every second, just in some
            // interval set by the config.
            const lastCheckInterval = new Date().getTime() - lastCheckTime;
            if (lastCheckInterval > browserSleepValidateTime) {
                validateOnCheck = true;
            }
            // Only revalidate if it's required (Config currently set to 1 minute)
            if (validateOnCheck && !validationInProgress) {
                validationInProgress = true;
                authClient.validateToken(token)
                    .then(function(info) {
                        validateOnCheck = false;
                        if (info !== true) {
                            tokenTimeout(true);
                        } else {
                        }
                    })
                    .catch(function(error) {
                        // This might happen while waiting for internet to reconnect.
                        console.error('Error while validating token after sleep. Trying again...');
                        console.error(error);
                    })
                    .finally(function() {
                        validationInProgress = false;
                    });
                lastCheckTime = new Date().getTime();
            }
        }, 1000);

        var currentTime = new Date().getTime();
        if (currentTime >= tokenExpirationTime) {
            // already expired! logout!
            tokenTimeout();
        }
        var timeToWarning = tokenExpirationTime - currentTime - (1000 * 60 * 5);
        if (timeToWarning <= 0) {
            timeToWarning = 0;
        }
        else {
            tokenWarningTimer = setTimeout(function() {
                showAboutToLogoutDialog(tokenExpirationTime);
            }, timeToWarning);
        }
    }

    function clearTokenCheckTimers() {
        if (tokenCheckTimer) {
            clearInterval(tokenCheckTimer);
            tokenCheckTimer = null;
        }
        if (tokenWarningTimer) {
            clearInterval(tokenWarningTimer);
            tokenWarningTimer = null;
        }
    }

    /**
     * Timeout the auth token, removing it and invalidating it.
     * This follows a few short steps.
     * 1. If there are timers set for checking token validity, expire them.
     * 2. Delete the token from the browser.
     * 3. Revoke the token from the auth server.
     * 4. Redirect to the logout page, with an optional warning that the user's now logged out.
     */
    function tokenTimeout(showDialog) {
        clearTokenCheckTimers();
        authClient.clearAuthToken();
        authClient.revokeAuthToken(sessionInfo.token, sessionInfo.id);
        // show dialog - you're signed out!
        if (showDialog) {
            showNotLoggedInDialog();
        }
        else {
            ipythonLogout();
        }
    }

    function getAuthToken() {
        return authClient.getAuthToken();
    }

    function init($elem, noServer) {
        /* Flow.
         * 1. Get cookie. If present and valid, yay. If not, dialog / redirect to login page.
         * 2. Setup event triggers. need loggedInQuery.kbase, promptForLogin.kbase, logout.kbase,
         * 3. events to trigger: loggedIn, loggedInFailure, loggedOut
         * 4. Set up user widget thing on #signin-button
         *
         * If noServer is present, then DO NOT try to log in to the ipython kernel. Because it
         * won't be there - this is mainly done if there's an error page, and we still want to
         * show that the user is logged in, and potentially provide a resource to do authenticated
         * communication with other KBase resources.
         */
        clearTokenCheckTimers();
        var sessionToken = authClient.getAuthToken();
        return Promise.all([authClient.getTokenInfo(sessionToken), authClient.getUserProfile(sessionToken)])
            .then((results) => {
                var tokenInfo = results[0];
                sessionInfo = tokenInfo;
                this.sessionInfo = tokenInfo;
                this.sessionInfo.token = sessionToken;
                this.sessionInfo.kbase_sessionid = this.sessionInfo.id;
                this.sessionInfo.user_id = this.sessionInfo.user;
                initEvents();
                initTokenTimer(sessionInfo.expires);
                UserMenu.make({
                    target: $elem,
                    token: sessionToken,
                    userName: sessionInfo.user,
                    email: results[1].email,
                    displayName: results[1].display
                });
                if (!noServer) {
                    ipythonLogin(sessionToken);
                }
                $(document).trigger('loggedIn', this.sessionInfo);
                $(document).trigger('loggedIn.kbase', this.sessionInfo);
            })
            .catch((error) => {
                console.error(error);
                if (document.location.hostname.indexOf('localhost') !== -1 ||
                    document.location.hostname.indexOf('0.0.0.0') !== -1) {
                    showTokenInjectionDialog();
                }
                else {
                    showNotLoggedInDialog();
                }
            });
    }

    function restartSession() {
        let token = authClient.getAuthToken();
        return ipythonLogin(token);
    }

    return {
        init: init,
        sessionInfo: sessionInfo,
        getAuthToken: getAuthToken,
        restartSession: restartSession
    };
});
