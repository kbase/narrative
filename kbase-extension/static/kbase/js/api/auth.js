define([
    'bluebird',
    'jquery',
    'jqueryCookie'
], function(Promise, $) {
    'use strict';

    function factory(config) {
        var url = config.url;
        var cookieName = 'kbase_session';

        /* Does a GET request to get the profile of the currently logged in user */
        function getCurrentProfile() {

        }

        /* Does a PUT request to post/update the profile of the current user */
        function putCurrentProfile(profile) {

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

        }

        /* Returns profile info for the given list of usernames.
         */
        function getUserNames(users) {

        }

        function searchUserNames(token, prefix, options) {
            var operation = '/users/search/' + prefix;
            if (options) {
                operation += '/?fields=' + options.join(',');
            }
            return makeAuthCall(token, {
                operation: operation,
                method: 'GET'
            });
        }

        /* does a GET request to fetch a token's introspection. If no token is given,
         * it tries to use the currently logged in token. If that's null, too, throws an error.
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
            getAuthToken: getAuthToken,
            setAuthToken: setAuthToken,
            getTokenInfo: getTokenInfo,
            getUserNames: getUserNames,
            searchUserNames: searchUserNames
        };

    }

    return {
        make: factory
    };
});
