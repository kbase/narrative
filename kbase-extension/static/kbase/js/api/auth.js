define([
    'bluebird',
    'jquery',
    'jqueryCookie'
], function(Promise, $) {
    'use strict';

    function factory(config) {
        var url = config.url;
        var cookieName = 'kbase_session';

        /**
         * Does a GET request to get the profile of the currently logged in user.
         * Returns a json structure with these keys:
         * created - millis since epoch - date user was created
         * lastlogin - millis since epoch
         * display - user's display name
         * roles - list of strings
         * customroles - list of strings
         * user - kbase user id
         * local - boolean, if true, it's a local account
         * email - email address
         * idents - list of identities tied to that account, if non local.
         * a single ident looks like this:
         * - provider = google or globus
         * - id = some id for that provider/user?
         * - username = for that provider
         */
        function getCurrentProfile(token) {
            if (!token) {
                token = getAuthToken();
            }
            return makeAuthCall(token, {
                operation: '/me',
                method: 'GET'
            });
        }

        /* Does a PUT request to post/update the profile of the current user */
        function putCurrentProfile(profile) {
            return null;
        }

        /* Returns the current auth token that's stuffed in a cookie.
         * Returns null if not logged in.
         */
        function getAuthToken() {
            if (!$.cookie(cookieName)) {
                return null;
            }
            return $.cookie(cookieName);
        }

        /* Sets the given auth token into the browser's cookie.
         * Does nothing if the token is null.
         */
        function setAuthToken(token) {
            if (token) {
                $.cookie(cookieName, token, {path: '/', domain: 'kbase.us', expires: 60});
                $.cookie(cookieName, token, {path: '/', expires: 60});
            }
        }

        /* Deletes the auth token cookie */
        function clearAuthToken() {
            $.removeCookie(cookieName, {path: '/'});
            $.removeCookie(cookieName, {path: '/', domain: 'kbase.us'});
        }

        function revokeAuthToken(token, id) {
            var operation = '/tokens/revoke/' + id;
            return makeAuthCall(token, {
                operation: operation,
                method: 'DELETE'
            });
        }

        /* Returns profile info for the given list of usernames.
         */
        function getUserNames(token, users) {
            if (!token) {
                token = getAuthToken();
            }
            var operation = '/users/?list=' + users.join(',');
            return makeAuthCall(token, {
                operation: operation,
                method: 'GET'
            });
        }

        function searchUserNames(token, query, options) {
            if (!token) {
                token = getAuthToken();
            }
            var operation = '/users/search/' + query;
            if (options) {
                operation += '/?fields=' + options.join(',');
            }
            return makeAuthCall(token, {
                operation: operation,
                method: 'GET'
            });
        }

        /* does a GET request to fetch a token's introspection.
         * Returns a json doc with these keys:
         * expires - millis since epoch
         * created - millis since epoch
         * name - if the token has a name
         * id - a UUID for that token
         * type - Login, etc.
         * user - KBase user id
         * cachefor - millis
         */
        function getTokenInfo(token) {
            return makeAuthCall(token ? token : getAuthToken(), {
                operation: '/token',
                method: 'GET'
            });
        }

        /**
         * returns a Promise that makes the API call.
         * the call that gets made looks like:
         * Configured URL + '/api/' + version + '/' + method
         * the "method" string should contain all url encoded
         * parameters as expected.
         */
        function makeAuthCall(token, callParams) {
            var version = callParams.version || 'V2',
                callString = [
                    url,
                    '/api/',
                    version,
                    callParams.operation
                ].join('');

            return Promise.resolve($.ajax({
                url: callString,
                method: callParams.method,
                dataType: 'json',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            }));
        }

        return {
            putCurrentProfile: putCurrentProfile,
            getCurrentProfile: getCurrentProfile,
            getUserProfile: getCurrentProfile,
            getAuthToken: getAuthToken,
            setAuthToken: setAuthToken,
            clearAuthToken: clearAuthToken,
            revokeAuthToken: revokeAuthToken,
            getTokenInfo: getTokenInfo,
            getUserNames: getUserNames,
            searchUserNames: searchUserNames
        };

    }

    return {
        make: factory
    };
});
