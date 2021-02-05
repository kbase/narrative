/* global describe, it, expect, jasmine, beforeEach, afterEach */
define ([
    'jquery',
    'narrativeLogin',
    'narrativeConfig'
], (
    $,
    Login,
    Config
) => {
    'use strict';

    const cookieKeys = ['kbase_session'],
        FAKE_TOKEN = 'some_fake_token';

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
        let reqUrl = `${Config.url('auth')}/api/V2/${request}`;
        jasmine.Ajax.stubRequest(reqUrl)
            .andReturn({
                status: status,
                contentType: 'application/json',
                responseText: JSON.stringify(responseObj)
            });
    }

    describe('Test the kbaseNarrative module', () => {
        beforeEach(() => {
            setToken(FAKE_TOKEN);
            jasmine.Ajax.install();
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            clearToken();
        });

        it('Should instantiate and have expected functions', () => {
            expect(Login).toBeDefined();
            ['init', 'sessionInfo', 'getAuthToken', 'clearTokenCheckTimers'].forEach(item => {
                expect(Login[item]).toBeDefined();
            });
        });

        it('Should instantiate on a DOM node in the happy path', () => {
            const $node = $('<div>'),
                fakeUser = 'some_user',
                fakeName = 'Some User',
                tokenInfo = {
                    expires: Date.now() + 10 * 60 * 60 * 24 * 1000,
                    created: Date.now(),
                    name: 'some_token',
                    id: 'some_uuid',
                    type: 'Login',
                    user: 'some_user',
                    cachefor: 500000
                },
                profileInfo = {
                    created: Date.now() - 10000,
                    lastlogin: Date.now(),
                    display: fakeName,
                    roles: [],
                    customroles: [],
                    user: fakeUser,
                    local: false,
                    email: `${fakeName}@kbase.us`,
                    idents: []

                };
            // these should capture the happy path calls that Login.init should make
            // copying some boilerplate from specs/api/authSpec
            // TODO: move boilerplate to a mocks module

            mockAuthRequest('token', tokenInfo, 200);
            mockAuthRequest('me', profileInfo, 200);
            return Login.init($node, true)  // true here means there's no kernel
                .then(() => {
                    const request = jasmine.Ajax.requests.mostRecent();
                    expect(request.requestHeaders.Authorization).toEqual(FAKE_TOKEN);
                    Login.clearTokenCheckTimers();
                });
        });

        it('Should throw an error when instantiating with a bad token', () => {
            const $node = $('<div>');
            mockAuthRequest('token', {error: {}}, 401);
            mockAuthRequest('me', {error: {}}, 401);
            return Login.init($node, true)  // true here means there's no kernel
                .then(() => {
                    const request = jasmine.Ajax.requests.mostRecent();
                    expect(request.requestHeaders.Authorization).toEqual(FAKE_TOKEN);
                    Login.clearTokenCheckTimers();
                });
        });
    });
});
