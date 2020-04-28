define([
    'bluebird',
    'jquery'
], function(Promise, $) {
    'use strict';

    function factory(config) {
        const url = config.url,
            cookieNames = {
                auth: 'kbase_session',                  // main auth token, use this
                narrativeSession: 'narrative_session',  // session token - used by the router, not set, but should be deleted
                backup: 'kbase_session_backup'          // used by the reports HTML server, should get deleted
            },
            tokenAge = 14; // days

        /**
         * Meant for managing auth or session cookies (mainly auth cookies as set by
         * a developer working locally - which is why this is very very simple).
         * Get a cookie "object" (key-value pairs) as input.
         * If it's missing name or value, does nothing.
         * Default expiration time is 14 days.
         * domain, expires, and max-age are optional
         * expires is expected to be in days
         * auto set fields are:
         *  - path = '/'
         *  - expires = tokenAge (default 14) days
         * @param {object} cookie
         *  - has the cookie keys: name, value, path, expires, max-age, domain
         *  - adds secure=true, samesite=none for KBase use.
         */
        function setCookie(cookie) {
            if (!cookie.name) {
                return;
            }
            let name = encodeURIComponent(cookie.name);
            let value = encodeURIComponent(cookie.value || '');
            let props = {
                expires: tokenAge,        // gets translated to GMT string
                path: '/',
                samesite: 'none'
            };
            if (Number.isInteger(cookie.expires)) {
                props.expires = cookie.expires;
            }
            if (cookie.domain) {
                props.domain = cookie.domain;
                props.secure = 'true';
            }
            props['max-age'] = 86400 * props.expires;
            if (props.expires === 0) {
                props.expires = new Date(0).toUTCString();
            }
            else {
                props.expires = new Date(new Date().getTime() + (86400000*props.expires)).toUTCString();
            }
            let propStr = Object.keys(props).map(key => `${key}=${props[key]}`).join('; ');
            let newCookie = `${name}=${value}; ${propStr}`;
            document.cookie=newCookie;
        }

        /**
         * If present in the browser, returns the value for the cookie. If not present, returns undefined.
         * @param {string} name
         */
        function getCookie(name) {
            let allCookies = {};
            document.cookie.split(';').forEach(cookie => {
                const parts = cookie.trim().split('=');
                allCookies[parts[0]] = parts[1];
            });
            return allCookies[name];
        }

        /**
         * Removes a cookie from the browser. Meant for removing auth token and narrative session
         * cookies on logout.
         * @param {string} name
         * @param {string} path
         * @param {string || undefined} domain
         */
        function removeCookie(name, path, domain) {
            let removedCookie = {
                name: name,
                value: '',
                path: path,
                expires: 0
            };
            if (domain) {
                removedCookie.domain = domain;
            }
            setCookie(removedCookie);
        }

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
            const token = getCookie(cookieNames.auth);
            if (token) {
                return token;
            }
            return null;
        }

        /* Sets the given auth token into the browser's cookie.
         * Does nothing if the token is null.
         */
        function setAuthToken(token) {
            if (token) {
                ['auth', 'backup'].forEach((name) => {
                    let cookie = {
                        name: cookieNames[name],
                        value: token
                    }
                    setCookie(cookie);
                    cookie.domain='.kbase.us';
                    setCookie(cookie);
                });
            }
        }

        /* Deletes the auth cookies */
        function clearAuthToken() {
            Object.keys(cookieNames).forEach(name => removeCookie(cookieNames[name], '/', '.kbase.us'));
            Object.keys(cookieNames).forEach(name => removeCookie(cookieNames[name], '/'));
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
            let encodedUsers = users.map(u => encodeURIComponent(u));
            var operation = '/users/?list=' + encodedUsers.join(',');
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

        /**
         * Validates a token with the following series of calls.
         * 1. calls GET /token on the auth service.
         * 2. If a 200 is returned (with valid JSON), returns true.
         * 3. If a 401/403 is returned (also with valid JSON), returns false.
         * 4. If anything is returned, it's a server error, and we wait a second before
         *    trying again. This solves the case where a computer is reawakened and still
         *    needs to connect to the internet before making a call.
         */
        function validateToken(token, retries) {
            if (!token) {
                token = getAuthToken();
            }
            if (retries === undefined || retries === null) {
                retries = 3;
            }
            return getTokenInfo(token)
            .then(function(info) {
                if (info.expires && info.expires > new Date().getTime()) {
                    return true;
                }
                return false;
            })
            .catch(function(error) {
                if (error.status === 401 || error.status === 403 || retries < 0) {
                    return false;
                }
                else {
                    throw error;
                }
            });
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
            searchUserNames: searchUserNames,
            validateToken: validateToken
        };

    }

    return {
        make: factory
    };
});
