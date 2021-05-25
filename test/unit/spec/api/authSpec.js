define(['api/auth', 'narrativeConfig', 'uuid'], (Auth, Config, Uuid) => {
    'use strict';

    let authClient;
    const FAKE_TOKEN = 'a_fake_auth_token',
        FAKE_USER = 'some_user',
        FAKE_NAME = 'Some User',
        VERSION = 'V2',
        cookieKeys = ['kbase_session'];

    const UNAUTH_ERROR = {
        error: {
            httpcode: 401,
            httpstatus: 'Unauthorized',
            appcode: 10020,
            apperror: 'Invalid token',
            message: '10020 Invalid token',
            callid: 'some_call_id',
            time: 1612476968817,
        },
    };

    const NO_TOKEN_ERROR = {
        error: {
            httpcode: 400,
            httpstatus: 'Bad Request',
            appcode: 10010,
            apperror: 'No authentication token',
            message: '10010 No authentication token: No user token provided',
            callid: '4979935107294962',
            time: 1612477725701,
        },
    };

    const USER_PROFILE = {
        created: Date.now() - 10000,
        lastlogin: Date.now(),
        display: FAKE_NAME,
        roles: [],
        customroles: [],
        user: FAKE_USER,
        local: false,
        email: `${FAKE_NAME}@kbase.us`,
        idents: [],
    };

    function setToken(token) {
        cookieKeys.forEach((key) => {
            document.cookie = `${key}=${token}`;
        });
    }

    function clearToken() {
        cookieKeys.forEach((key) => {
            document.cookie = `${key}=`;
        });
    }

    /**
     *
     * @param {string} request the path request
     * @param {object} responseObj the response to send
     * @param {int} status the status code to return
     */
    function mockAuthRequest(request, responseObj, status) {
        const reqUrl = `${Config.url('auth')}/api/${VERSION}/${request}`;
        jasmine.Ajax.stubRequest(reqUrl).andReturn({
            status: status,
            contentType: 'application/json',
            responseText: JSON.stringify(responseObj),
        });
    }

    /*
     * Each case here represents the following:
     * - an auth api method that can accept no input (it gets the token straight from the
     *   cookie)
     * - a set of inputs for that method
     * - the auth service api request endpoint
     * These will then all be tested when no token is available.
     */
    const noTokenCases = [
        {
            method: 'getTokenInfo',
            inputs: [],
            request: 'token',
        },
        {
            method: 'getUserProfile',
            inputs: [],
            request: 'me',
        },
        {
            method: 'getCurrentProfile',
            inputs: [],
            request: 'me',
        },
        {
            method: 'getUserNames',
            inputs: [undefined, ['userId', 'nonUserId']],
            request: 'users/?list=userId,nonUserId',
        },
        {
            method: 'searchUserNames',
            inputs: [undefined, 'foo'],
            request: 'users/search/foo',
        },
    ];

    /*
     * Each case here represents the following:
     * - an auth api method that can accept either no input (it gets the token straight from the
     *   cookie) or a given token
     * - a set of inputs for that method
     * - the auth service api request endpoint
     * These will then be tested when a mocked invalid token is given.
     */
    const badTokenCases = [
        ...noTokenCases,
        {
            method: 'getTokenInfo',
            inputs: [FAKE_TOKEN],
            request: 'token',
        },
        {
            method: 'getUserNames',
            inputs: [FAKE_TOKEN, ['userId', 'nonUserId']],
            request: 'users/?list=userId,nonUserId',
        },
        {
            method: 'searchUserNames',
            inputs: [FAKE_TOKEN, 'foo'],
            request: 'users/search/foo',
        },
        {
            method: 'searchUserNames',
            inputs: [FAKE_TOKEN, 'foo', ['username', 'displayname']],
            request: 'users/search/foo/?fields=username,displayname',
        },
    ];

    describe('Test the Auth API module', () => {
        beforeEach(() => {
            setToken(FAKE_TOKEN);
            authClient = Auth.make({
                url: Config.url('auth'),
                // Can't use secure cookies for testing.
                secureCookies: false,
            });
            jasmine.Ajax.install();
        });

        afterEach(() => {
            clearToken();
            jasmine.Ajax.uninstall();
        });

        it('Should make a new Auth client that has the expected functions', () => {
            const auth = Auth.make({ url: Config.url('auth') });
            expect(auth).not.toBeNull();
            [
                'putCurrentProfile',
                'getCurrentProfile',
                'getUserProfile',
                'getAuthToken',
                'setAuthToken',
                'clearAuthToken',
                'revokeAuthToken',
                'getTokenInfo',
                'getUserNames',
                'searchUserNames',
                'validateToken',
                'setCookie',
                'getCookie',
            ].forEach((fn) => {
                expect(auth[fn]).toBeDefined();
            });
        });

        /* test that running functions with "invalid" tokens fail properly, such that
         * 1. the token is attached to the Auth header
         * 2. an error is returned from the request
         * 3. the promise is resolved as an error
         */
        badTokenCases.forEach((badCase) => {
            it(`${badCase.method} should get a 401 failure with a bad token`, () => {
                mockAuthRequest(badCase.request, UNAUTH_ERROR, 401);
                // the below is like calling:
                // authClient.getTokenInfo(token)
                // just slightly fancier
                return authClient[badCase.method](...badCase.inputs)
                    .then(() => {
                        throw new Error('This should have failed!');
                    })
                    .catch((error) => {
                        const request = jasmine.Ajax.requests.mostRecent();
                        // expect that the token was applied here
                        expect(request.requestHeaders.Authorization).toEqual(FAKE_TOKEN);
                        expect(error).toBeDefined();
                        expect(error.responseJSON).toBeDefined();
                        expect(error.responseJSON).toEqual(UNAUTH_ERROR);
                    });
            });
        });

        /* test that running functions with missing tokens fail properly, such that
         * 1. no token is attached to the Auth header
         * 2. an error is returned from the request
         * 3. the promise is resolved as an error
         */
        noTokenCases.forEach((badCase) => {
            it(`${badCase.method} should get a 400 failure with no token`, () => {
                clearToken();
                mockAuthRequest(badCase.request, NO_TOKEN_ERROR, 400);
                return authClient[badCase.method](...badCase.inputs)
                    .then(() => {
                        throw new Error('This should have failed!');
                    })
                    .catch((error) => {
                        const request = jasmine.Ajax.requests.mostRecent();
                        expect(request.requestHeaders.Authorization).toBeNull();
                        expect(error).toBeDefined();
                        expect(error.responseJSON).toBeDefined();
                        expect(error.responseJSON).toEqual(NO_TOKEN_ERROR);
                    });
            });
        });

        it('Should get auth token info', () => {
            const tokenInfo = {
                expires: Date.now() + 10 * 60 * 60 * 24 * 1000,
                created: Date.now(),
                name: 'some_token',
                id: 'some_uuid',
                type: 'Login',
                user: FAKE_USER,
                cachefor: 500000,
            };
            mockAuthRequest('token', tokenInfo, 200);
            return authClient.getTokenInfo(FAKE_TOKEN).then((response) => {
                Object.keys(tokenInfo).forEach((tokenKey) => {
                    expect(response[tokenKey]).toEqual(tokenInfo[tokenKey]);
                });
                const request = jasmine.Ajax.requests.mostRecent();
                expect(request.requestHeaders.Authorization).toEqual(FAKE_TOKEN);
            });
        });

        it('Should return my profile', () => {
            mockAuthRequest('me', USER_PROFILE, 200);
            return authClient.getUserProfile().then((response) => {
                expect(response).not.toBeNull();
                expect(response).toEqual(USER_PROFILE);
                const request = jasmine.Ajax.requests.mostRecent();
                expect(request.requestHeaders.Authorization).toEqual(FAKE_TOKEN);
            });
        });

        it('Should return a list of users', () => {
            const nonUser = 'not_a_user_name',
                userIds = [FAKE_USER, nonUser],
                response = {};
            response[FAKE_USER] = FAKE_NAME;
            mockAuthRequest(`users/?list=${FAKE_USER},${nonUser}`, response, 200);

            return authClient.getUserNames(FAKE_TOKEN, userIds).then((names) => {
                expect(names[FAKE_USER]).toEqual(FAKE_NAME);
                expect(Object.keys(names)).not.toContain(nonUser);
                const request = jasmine.Ajax.requests.mostRecent();
                expect(request.requestHeaders.Authorization).toEqual(FAKE_TOKEN);
            });
        });

        it('Should search for users', () => {
            const query = 'us',
                result = { user1: 'User 1' };
            mockAuthRequest(`users/search/${query}`, result, 200);
            return authClient.searchUserNames(FAKE_TOKEN, query).then((results) => {
                expect(results).toEqual(result);
                const request = jasmine.Ajax.requests.mostRecent();
                expect(request.requestHeaders.Authorization).toEqual(FAKE_TOKEN);
            });
        });

        it('Should search for users with extra options', () => {
            const query = 'user',
                options = ['username', 'displayname'],
                result = {
                    user1: 'User 1',
                    otherperson: 'User 2',
                    user3: 'Another Person',
                };
            mockAuthRequest(`users/search/${query}/?fields=${options.join(',')}`, result, 200);
            return authClient.searchUserNames(FAKE_TOKEN, query, options).then((results) => {
                expect(results).toEqual(result);
                const request = jasmine.Ajax.requests.mostRecent();
                expect(request.requestHeaders.Authorization).toEqual(FAKE_TOKEN);
            });
        });

        it('Should set an auth token cookie', () => {
            clearToken();
            const newToken = 'someRandomToken';
            authClient.setAuthToken(newToken);
            expect(authClient.getAuthToken()).toEqual(newToken);
        });

        // test validateToken with either good or invalid tokens
        const validationTrials = [
            {
                label: ' null',
                token: null,
                isValid: true, // should get it from cookie
            },
            {
                label: 'n undefined',
                token: undefined,
                isValid: true, // should get from cookie
            },
            {
                label: 'n old',
                token: FAKE_TOKEN,
                isValid: false,
            },
        ];
        validationTrials.forEach((trial) => {
            it(`Should ${!trial.isValid ? 'in' : ''}validate a${trial.label} token`, () => {
                const tokenInfo = {
                    expires: Date.now() + (trial.isValid ? 10000 : -10000),
                    created: Date.now(),
                    name: 'some_token',
                    id: 'some_uuid',
                    type: 'Login',
                    user: FAKE_USER,
                    cachefor: 500000,
                };
                mockAuthRequest('token', tokenInfo, 200);
                return authClient.validateToken(trial.token).then((isValid) => {
                    expect(isValid).toBe(trial.isValid);
                    const request = jasmine.Ajax.requests.mostRecent();
                    expect(request.requestHeaders.Authorization).toEqual(FAKE_TOKEN);
                });
            });
        });

        it('Should invalidate an invalid token', () => {
            mockAuthRequest('token', UNAUTH_ERROR, 401);
            return authClient.validateToken().then((isValid) => {
                expect(isValid).toBe(false);
                const request = jasmine.Ajax.requests.mostRecent();
                expect(request.requestHeaders.Authorization).toEqual(FAKE_TOKEN);
            });
        });

        it('Should clear auth token cookie on request', () => {
            // Ensure that the token automagically set is removed first.
            clearToken();

            // Setting an arbitrary token should work.
            const cookieValue = new Uuid(4).format();
            authClient.setAuthToken(cookieValue);
            expect(authClient.getAuthToken()).toEqual(cookieValue);

            // Clearing an auth token should also work.
            authClient.clearAuthToken();
            expect(authClient.getAuthToken()).toBeNull();

            // Just to be totally sure.
            expect(authClient.getCookie('kbase_session')).toBeNull();
        });

        it('Should properly handle backup cookie in non-prod environment', () => {
            const env = Config.get('environment');
            const backupCookieName = 'kbase_session_backup';
            if (env === 'prod') {
                pending('This test is not valid for a prod config');
                return;
            }

            // Ensure that the token automagically set is removed first.
            clearToken();

            // Get a unique fake token, to ensure we don't conflict with
            // another cookie value.
            const cookieValue = new Uuid(4).format();

            authClient.setAuthToken(cookieValue);
            expect(authClient.getAuthToken()).toEqual(cookieValue);

            // There should not be a backup cookie set yet
            expect(authClient.getCookie(backupCookieName)).toBeNull();

            // Since the backup cookie is only set in prod, we simulate the backup
            // cookie having been set in prod in another session.
            const backupCookieValue = new Uuid(4).format();

            // Note the domain of localhost -- we can't use the real kbase.us domain.
            authClient.setCookie({
                name: backupCookieName,
                value: backupCookieValue,
                domain: 'localhost',
            });

            // The backup cookie should be set.
            expect(authClient.getCookie(backupCookieName)).toEqual(backupCookieValue);

            // Clearing an auth token should also work.
            authClient.clearAuthToken();
            expect(authClient.getAuthToken()).toBeNull();
            expect(authClient.getCookie('kbase_session')).toBeNull();
            expect(authClient.getCookie(backupCookieName)).toEqual(backupCookieValue);
        });

        it('Should set and clear backup cookie in prod', () => {
            const env = Config.get('environment');
            const backupCookieName = 'kbase_session_backup';
            if (env !== 'prod') {
                pending('This test is only valid for a prod config');
                return;
            }

            // Ensure that the token automagically set is removed first.
            clearToken();

            // Setting an arbitrary token should work.
            const cookieValue = new Uuid(4).format();
            authClient.setAuthToken(cookieValue);
            expect(authClient.getAuthToken()).toEqual(cookieValue);
            expect(authClient.getCookie(backupCookieName)).toEqual(cookieValue);

            // Clearing an auth token should also work.
            authClient.clearAuthToken();
            expect(authClient.getAuthToken()).toBeNull();
            expect(authClient.getCookie('kbase_session')).toBeNull();
            expect(authClient.getCookie(backupCookieName)).toBeNull();
        });

        it('Should clear the narrative_session cookie when the auth cookie is cleared', () => {
            // Ensure that the token automagically set is removed first.
            clearToken();

            // We'll simulate the narrative_session token.
            // This token is not set by the Narrative, but Traefik.
            const cookieValue = new Uuid(4).format();
            authClient.setCookie({
                name: 'narrative_session',
                value: cookieValue,
                expires: 14,
            });

            // Okay, it should be set.
            expect(authClient.getCookie('narrative_session')).toEqual(cookieValue);

            // Clearing the auth token should zap the narrative_session cookie too.
            authClient.clearAuthToken();
            expect(authClient.getAuthToken()).toBeNull();
            expect(authClient.getCookie('narrative_session')).toBeNull();
        });
    });
});
