/* global describe, it, expect, jasmine, beforeEach, afterEach */
define ([
    'jquery',
    'narrativeLogin',
    'narrativeConfig',
    'narrativeMocks'
], (
    $,
    Login,
    Config,
    Mocks
) => {
    'use strict';

    const FAKE_TOKEN = 'some_fake_token';

    describe('Test the kbaseNarrative module', () => {
        beforeEach(() => {
            Mocks.setAuthToken(FAKE_TOKEN);
            jasmine.Ajax.install();
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            Mocks.clearAuthToken();
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

            Mocks.mockAuthRequest('token', tokenInfo, 200);
            Mocks.mockAuthRequest('me', profileInfo, 200);
            // a null user profile response is enough to start the dummy UserMenu
            // required here.
            Mocks.mockJsonRpc1Call({
                url: Config.url('user_profile'),
                response: [{}]
            });
            return Login.init($node, true)  // true here means there's no kernel
                .then(() => {
                    const request = jasmine.Ajax.requests.mostRecent();
                    expect(request.requestHeaders.Authorization).toEqual(FAKE_TOKEN);
                    // test that the user menu was created by checking for the username and id
                    // embedded in the node
                    expect($node.text()).toContain(fakeName);
                    expect($node.text()).toContain(fakeUser);
                    Login.clearTokenCheckTimers();
                });
        });

        it('Should throw an error when instantiating with a bad token', () => {
            const $node = $('<div>');
            Mocks.mockAuthRequest('token', {error: {}}, 401);
            Mocks.mockAuthRequest('me', {error: {}}, 401);
            return Login.init($node, true)  // true here means there's no kernel
                .then(() => {
                    const request = jasmine.Ajax.requests.mostRecent();
                    expect(request.requestHeaders.Authorization).toEqual(FAKE_TOKEN);
                    Login.clearTokenCheckTimers();
                });
        });
    });
});
