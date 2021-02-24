define([
    'bluebird',
    'jquery',
    'narrativeConfig'
], (
    Promise,
    $,
    Config
) => {
    'use strict';

    function factory(config) {
        const url = config.url;
        const secureCookies = typeof config.secureCookies === 'undefined' ? true : config.secureCookies;

        /*
            Each cookie is defined
        */
        const cookieConfig = {
            auth: {
                name: 'kbase_session'
            },
            backup: {
                name: 'kbase_session_backup',
                domain: 'kbase.us',
                enableIn: ['prod']
            },
            narrativeSession: {
                name: 'narrative_session'
            }
        };

        const TOKEN_AGE = 14; // days

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
         *  - expires = TOKEN_AGE (default 14) days
         * @param {object} cookie
         *  - has the cookie keys: name, value, path, expires, max-age, domain
         *  - adds secure=true, samesite=Lax for KBase use.
         *  - When used in a localhost dev environment samesite=Lax and secure=false
         *    should be sufficient for browsers.
         */
        function setCookie(cookie) {
            if (!cookie.name) {
                return;
            }
            const name = encodeURIComponent(cookie.name);
            const value = encodeURIComponent(cookie.value || '');
            const props = {
                expires: TOKEN_AGE,        // gets translated to GMT string
                path: '/',
                samesite: 'Lax'
            };
            if (Number.isInteger(cookie.expires)) {
                props.expires = cookie.expires;
            }

            // Default to secure cookies global setting if not specified.
            if (typeof cookie.secure === 'undefined') {
                cookie.secure = secureCookies;
            }

            if (cookie.domain) {
                props.domain = cookie.domain;
            }
            props['max-age'] = 86400 * props.expires;
            if (props.expires === 0) {
                props.expires = new Date(0).toUTCString();
            } else {
                props.expires = new Date(new Date().getTime() + (86400000*props.expires)).toUTCString();
            }

            const fields = Object.keys(props).map((key) => {
                return `${key}=${props[key]}`;
            });

            if (cookie.secure) {
                fields.push('secure');
            }

            const propStr = fields.join(';');

            const newCookie = `${name}=${value}; ${propStr}`;
            document.cookie=newCookie;
        }

        /**
         * If present in the browser, returns the value for the cookie. If not present, returns undefined.
         * @param {string} name
         */
        function getCookie(name) {
            const allCookies = {};
            document.cookie.split(';').forEach((cookie) => {
                const parts = cookie.trim().split('=');
                allCookies[parts[0]] = parts[1];
            });
            return allCookies[name] || null;
        }

        /**
         * Removes a cookie from the browser. Meant for removing auth token and narrative session
         * cookies on logout.
         * @param {string} name
         * @param {string} path
         * @param {string || undefined} domain
         */
        function removeCookie(name, path, domain) {
            const cookieToRemove = {
                name,
                value: '',
                path,
                expires: 0
            };
            if (domain) {
                cookieToRemove.domain = domain;
            }
            setCookie(cookieToRemove);
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
            return getCookie(cookieConfig.auth.name);
        }

        /* Sets the given auth token into the browser's cookie.
         * Does nothing if the token is null.
         */
        function setAuthToken(token) {
            const deployEnv = Config.get('environment');

            function setToken(config) {
                // Honor cookie host whitelist if present.
                if (config.enableIn) {
                    if (config.enableIn.indexOf(deployEnv) === -1) {
                        return;
                    }
                }
                const cookieField = {
                    name: config.name,
                    value: token
                };
                if (config.domain) {
                    cookieField.domain = config.domain;
                }
                setCookie(cookieField);
            }

            setToken(cookieConfig.auth);
            setToken(cookieConfig.backup);
        }

        /* Deletes the auth cookies */
        function clearAuthToken() {
            const deployEnv = Config.get('environment');

            function removeToken(config) {
                // Honor the cookie host whitelist if present.
                if (config.enableIn) {
                    if (config.enableIn.indexOf(deployEnv) === -1) {
                        return;
                    }
                }
                removeCookie(config.name, '/', config.domain);
            }

            Object.keys(cookieConfig).forEach((name) => {
                removeToken(cookieConfig[name]);
            });
        }

        function revokeAuthToken(token, id) {
            const operation = '/tokens/revoke/' + id;
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
            const encodedUsers = users.map((u) => encodeURIComponent(u));
            const operation = '/users/?list=' + encodedUsers.join(',');
            return makeAuthCall(token, {
                operation: operation,
                method: 'GET'
            });
        }

        function searchUserNames(token, query, options) {
            if (!token) {
                token = getAuthToken();
            }
            let operation = '/users/search/' + query;
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
            const version = callParams.version || 'V2';
            const callString = [
                url,
                '/api/',
                version,
                callParams.operation
            ].join('');

            return Promise.resolve($.ajax({
                url: callString,
                method: callParams.method,
                dataType: 'json',
                crossDomain: true,
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
                .then((info) => {
                    if (info.expires && info.expires > new Date().getTime()) {
                        return true;
                    }
                    return false;
                })
                .catch((error) => {
                    if (error.status === 401 || error.status === 403 || retries < 0) {
                        return false;
                    }
                    else {
                        throw error;
                    }
                });
        }

        return {
            putCurrentProfile,
            getCurrentProfile,
            getUserProfile: getCurrentProfile,
            getAuthToken,
            setAuthToken,
            clearAuthToken,
            revokeAuthToken,
            getTokenInfo,
            getUserNames,
            searchUserNames,
            validateToken,
            setCookie,
            getCookie
        };
    }

    return {
        make: factory
    };
});
