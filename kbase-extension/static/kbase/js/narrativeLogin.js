/**
 * Uses the user's login information to initialize the IPython environment.
 * This should be one of the very first functions to be run on the page, as it sets up
 * the login widget, and wires the environment together.
 * @author Bill Riehl wjriehl@lbl.gov
 */
define([
    'jquery',
    'bluebird',
    'kbapi',
    'base/js/utils',
    'narrativeConfig',
    'api/auth',
    'userMenu',
    'util/bootstrapDialog',
], ($, Promise, kbapi, JupyterUtils, Config, Auth, UserMenu, BootstrapDialog) => {
    'use strict';
    const baseUrl = JupyterUtils.get_body_data('baseUrl');
    const authClient = Auth.make({ url: Config.url('auth') });
    let sessionInfo = null;
    let tokenCheckTimer = null;

    // don't warn if less than 30 seconds to auto-logout
    const ABOUT_TO_LOGOUT_MINIMUM = 1000 * 30;

    // Do warn if les than 5 minutes to auto-logout
    const ABOUT_TO_LOGOUT_THRESHOLD = 1000 * 60 * 5;

    // How often to inspect the current browser auth token.
    const TOKEN_MONITORING_INTERVAL = 1000;

    // Delay after which to automatically logout the Narrative
    // after the logging-out dialog is shown.
    const AUTO_LOGOUT_DELAY = 1000 * 30;

    /* set the auth token by calling the kernel execute method on a function in
     * the magics module
     */
    function ipythonLogin(token) {
        window.kb = new window.KBCacheClient(token); // just as bad as global, but passes linting
        $.ajax({
            url: JupyterUtils.url_join_encode(baseUrl, 'login'),
        })
            .then(() => {
                // console.log(ret);
            })
            .fail(() => {
                // console.err(err);
            });
    }

    function ipythonLogout() {
        $.ajax({
            url: JupyterUtils.url_join_encode(baseUrl, 'logout'),
        })
            .then(() => {
                // console.log(ret);
            })
            .fail(() => {
                // console.err(err);
            });
        window.location.href = '/';
    }

    function showTokenInjectionDialog() {
        const $inputField = $('<input type="text" class="form-control">');
        const $body = $('<div data-test-id="dev-login">')
            .append(
                "<div>You appear to be working on a local development environment of the Narrative Interface, but you don't have a valid auth token. You can paste one in below.</div>"
            )
            .append(
                '<div><b>You are operating in the ' + Config.get('environment') + ' environment.'
            )
            .append($('<div>').append($inputField));

        const dialog = new BootstrapDialog({
            title: 'Insert an authentication token?',
            body: $body,
            buttons: [
                $('<a type="button" class="btn btn-default">')
                    .append('OK')
                    .click(() => {
                        dialog.hide();
                        const newToken = $inputField.val();
                        authClient.setCookie({
                            name: 'kbase_session',
                            value: newToken,
                            domain: 'localhost',
                            secure: false,
                        });
                        location.reload();
                    }),
            ],
        });
        dialog.show();
    }

    function showNotLoggedInDialog() {
        const message = `
        <p>You are logged out (or your session has expired).</p>
        <p>You will be redirected to the sign in page after closing this, or ${
            AUTO_LOGOUT_DELAY / 1000
        } seconds,
           whichever comes first.</p>
        `;
        const dialog = new BootstrapDialog({
            title: 'Logged Out',
            body: $('<div>').append(message),
            buttons: [
                $('<a type="button" class="btn btn-default">')
                    .append('OK')
                    .click(() => {
                        dialog.hide();
                    }),
            ],
        });
        dialog.onHide(() => {
            window.clearTimeout(autoLogoutTimer);
            ipythonLogout();
        });
        dialog.show();
        const autoLogoutTimer = window.setTimeout(() => {
            dialog.hide();
            ipythonLogout();
        }, AUTO_LOGOUT_DELAY);
    }

    let aboutToLogoutDialog = null;
    function showAboutToLogoutDialog() {
        aboutToLogoutDialog = new BootstrapDialog({
            title: 'Expiring session',
            body: $('<div>').append(
                'Your authenticated KBase session will expire in 5 minutes or less. To continue using KBase, we suggest you log out and back in.'
            ),
            buttons: [
                $('<a type="button" class="btn btn-default">')
                    .append('OK')
                    .click(() => {
                        aboutToLogoutDialog.hide();
                    }),
            ],
        });
        aboutToLogoutDialog.show();
    }

    function initEvents() {
        $(document).on('loggedInQuery.kbase', (e, callback) => {
            if (callback) {
                callback(sessionInfo);
            }
        });

        $(document).on('logout.kbase', (e, hideMessage) => {
            tokenTimeout(!hideMessage);
        });
    }

    // When true, will cause the token check interval timer to return early.
    // Should be set true when an async process is running inside the
    // interval function, and set false when that process is completed.

    let hasViewedAboutToLogout = false;

    let tokenCheckEnabled = true;

    function disableTokenCheck() {
        tokenCheckEnabled = false;
    }

    function enableTokenCheck() {
        tokenCheckEnabled = true;
    }

    function isTokenCheckEnabled() {
        return tokenCheckEnabled;
    }

    function initTokenTimer(tokenExpirationTime) {
        /**
         * First timer - check for token existence very second.
         * trigger the logout behavior if it's not there.
         */
        let lastCheckTime = Date.now();
        const browserSleepValidateTime = Config.get('auth_sleep_recheck_ms');

        tokenCheckTimer = setInterval(() => {
            if (!isTokenCheckEnabled()) {
                return;
            }
            const token = authClient.getAuthToken();
            if (!token) {
                disableTokenCheck();
                tokenTimeout();
                return;
            }

            const currentTime = Date.now();

            // If the token is expired, force a logout and cookie expunging, even
            // without checking with auth first.
            const timeUntilExpiration = tokenExpirationTime - currentTime;
            if (timeUntilExpiration <= 0) {
                // already expired! logout!
                disableTokenCheck();
                tokenTimeout(true);
                return;
            }

            // Expiring within 5 minutes, but in more than 30 seconds? Show the dialog, but still
            // continue with the possible token validation check.
            // The reason for a minimal time is that a user will not have time to absorb and respond
            // to the dialog in just a few seconds.
            if (
                timeUntilExpiration > ABOUT_TO_LOGOUT_MINIMUM &&
                timeUntilExpiration <= ABOUT_TO_LOGOUT_THRESHOLD
            ) {
                if (!hasViewedAboutToLogout) {
                    hasViewedAboutToLogout = true;
                    showAboutToLogoutDialog();
                }
            }

            const lastCheckInterval = currentTime - lastCheckTime;
            const validateOnCheck = lastCheckInterval > browserSleepValidateTime;
            if (validateOnCheck) {
                // ensure we don't enter this check a second time.
                // hmm, this is really an edge case, but possible.
                // in order to meet this condition, the validateToken() call would
                // need to take longer than browserSleepValidateTime which is currently
                // hard coded in the config at 1 minute.
                disableTokenCheck();
                lastCheckTime = Date.now();
                authClient
                    .validateToken(token)
                    .then((info) => {
                        if (info !== true) {
                            tokenTimeout(true);
                        }
                    })
                    .catch((error) => {
                        // This might happen while waiting for internet to reconnect.
                        console.error('Error while validating token after sleep. Trying again...');
                        console.error(error);
                    })
                    .finally(() => {
                        enableTokenCheck();
                    });
            }
        }, TOKEN_MONITORING_INTERVAL);
    }

    function clearTokenCheckTimers() {
        if (tokenCheckTimer) {
            clearInterval(tokenCheckTimer);
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
        if (aboutToLogoutDialog) {
            aboutToLogoutDialog.hide();
        }
        clearTokenCheckTimers();
        authClient.clearAuthToken();
        authClient.revokeAuthToken(sessionInfo.token, sessionInfo.id);
        // show dialog - you're signed out!
        if (showDialog) {
            showNotLoggedInDialog();
        } else {
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
        const sessionToken = authClient.getAuthToken();
        return Promise.all([
            authClient.getTokenInfo(sessionToken),
            authClient.getUserProfile(sessionToken),
        ])
            .then((results) => {
                const tokenInfo = results[0];
                sessionInfo = tokenInfo;
                this.sessionInfo = tokenInfo;
                this.sessionInfo.token = sessionToken;
                this.sessionInfo.kbase_sessionid = this.sessionInfo.id;
                this.sessionInfo.user_id = this.sessionInfo.user;
                initEvents();
                initTokenTimer(sessionInfo.expires);
                if (!noServer) {
                    ipythonLogin(sessionToken);
                }
                $(document).trigger('loggedIn', this.sessionInfo);
                $(document).trigger('loggedIn.kbase', this.sessionInfo);
                const userMenu = UserMenu.make({
                    target: $elem,
                    token: sessionToken,
                    userName: sessionInfo.user,
                    email: results[1].email,
                    displayName: results[1].display,
                });
                return userMenu.start();
            })
            .catch((error) => {
                console.error(error);
                if (
                    document.location.hostname.indexOf('localhost') !== -1 ||
                    document.location.hostname.indexOf('0.0.0.0') !== -1
                ) {
                    showTokenInjectionDialog();
                } else {
                    showNotLoggedInDialog();
                }
            });
    }

    function destroy() {
        $(document).off('loggedInQuery.kbase');
        $(document).off('logout.kbase');
    }

    return {
        init,
        sessionInfo,
        getAuthToken,
        clearTokenCheckTimers,
        destroy,
    };
});
