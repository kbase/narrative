define([
    'jquery',
    'narrativeLogin',
    'testUtil',
    'narrativeConfig'
], function(
    $,
    Login,
    TestUtil,
    Config
) {
    'use strict';

    function insertTokenCookie(token) {
        document.cookie = 'kbase_session=' + token;
    }

    function mockValidToken(token) {
        insertTokenCookie(token);
        // call to auth.getCurrentProfile
        jasmine.Ajax.stubRequest(
            Config.url('auth') + '/api/V2/me'
        ).andReturn({
            status: 200,
            statusText: 'HTTP/1.1 200 OK',
            contentType: 'application/json',
            responseText: JSON.stringify({
                created: 1490219221579,
                lastlogin: 1578423051701,
                display: 'Some User',
                roles: [{
                    id: 'DevToken',
                    desc: 'Create developer tokens'
                }],
                'customroles':['goofypants'],
                'policyids':[
                    {'id':'data-policy.3','agreedon':1490285343224},
                    {'id':'kbase-user.2','agreedon':1490285343222}
                ],
                user: 'some_user',
                local: false,
                email: 'some_user@somewhere.com',
                idents: [{
                    provusername: 'some_user@globusid.org',
                    provider: 'Globus',
                    id: 'some_globus_id'
                }, {
                    provusername: '1234-5678-9876-5432',
                    provider: 'OrcID',
                    id: 'some_OrcID_id'
                }]
            })
        });

        jasmine.Ajax.stubRequest(
            Config.url('auth') + '/api/V2/token'
        ).andReturn({
            status: 200,
            statusText: 'HTTP/1.1 200 OK',
            contentType: 'application/json',
            responseText: JSON.stringify({
                type: "Login",
                id: 'some_token_id',
                expires: new Date().getTime() + 100000,
                created: 1578423051700,
                name: null,
                user: 'some_user',
                custom: {},
                cachefor: 300000
            })
        });
    }

    function mockInvalidToken(token) {
        insertTokenCookie(token);
        const error = JSON.stringify({
            error: {
                httpcode: 401,
                httpstatus: 'Unauthorized',
                appcode: 10020,
                apperror: 'Invalid token',
                message: '10020 Invalid token',
                callid: '8296207964623217',
                time: 1578600439463
            }
        });
        jasmine.Ajax.stubRequest(
            Config.url('auth') + '/api/V2/me'
        ).andReturn({
            status: 401,
            statusText: 'Not allowed',
            contentType: 'application/json',
            responseText: error
        });

        jasmine.Ajax.stubRequest(
            Config.url('auth') + 'api/V2/token'
        ).andReturn({
            status: 401,
            statusText: 'Not allowed',
            contentType: 'application/json',
            responseText: error
        });
    }

    function mockNoToken() {
        const error = JSON.stringify({
            error: {
                httpcode: 400,
                httpstatus: 'Bad Request',
                appcode: 10010,
                apperror: 'No authentication token',
                message: '10010 No authentication token: No user token provided',
                callid: '5753458997874970',
                time: 1578603882613
            }
        });
        jasmine.Ajax.stubRequest(
            Config.url('auth') + '/api/V2/me'
        ).andReturn({
            status: 401,
            statusText: 'Bad Request',
            contentType: 'application/json',
            responseText: error
        });
        jasmine.Ajax.stubRequest(
            Config.url('auth') + '/api/V2/token'
        ).andReturn({
            status: 401,
            statusText: 'Bad Request',
            contentType: 'application/json',
            responseText: error
        });
    }

    describe('Test the kbaseNarrative module', () => {
        beforeEach(() => {
            document.cookie = 'kbase_session=; expires=' + new Date().setTime(1) + '; path=/';
            Login.sessionInfo = null;
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest(
                /\/login$/
            ).andReturn({
                status: 200
            });
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
        });

        it('Should load successfully', () => {
            expect(Login.init).toBeDefined();
            expect(Login.sessionInfo).toBeDefined();
            expect(Login.getAuthToken).toBeDefined();
            expect(Login.restartSession).toBeDefined();
        });

        it('Should instantiate on a DOM node with a valid token', (done) => {
            mockValidToken('valid_token');
            let $node = $("<div>"),
                loggedIn = false,
                loggedInKBase = false;

            $(document).on('loggedIn', () => {
                loggedIn = true;
            });
            $(document).on('loggedIn.kbase', () => {
                loggedInKBase = true;
            });

            Login.init($node)
                .then(() => {
                    /* check the following from init:
                    * 1. token check timer gets created
                    * 2. authClient.getTokenInfo and
                    * 3. authClient.getUserProfile get called
                    * 4. "loggedIn.kbase" and "loggedIn" get triggered on document
                    */
                    expect(loggedIn).toBeTruthy();
                    expect(loggedInKBase).toBeTruthy();
                    done();
                });
        });

        it('Should run a token validation timer when inited with a valid token', (done) => {
            mockValidToken('valid_token');
            let $node = $('<div>');
            Login.init($node)
                .then(() => {
                    setTimeout(() => {
                        done();
                    }, 2000)
                });
        });

        it('Should fail to instantiate without a valid auth token', (done) => {
            mockInvalidToken('fake-token');
            Login.init($('<div>'))
                .then(done);
        });

        it('Should fail to instantiate without any login token', (done) => {
            mockNoToken();
            Login.init($('<div>'))
                .then(done);
        });

        it('Should re-log in to Jupyter server on request', (done) => {
            mockValidToken('valid_token');
            Login.restartSession().then(done);
        });

        it('Should provide a null auth token if one is not present', () => {
            const token = Login.getAuthToken();
            expect(token).toBeNull();
        });

        it('Should provide an auth token straight from the cookie', () => {
            const token = 'valid_token';
            mockValidToken(token)
            expect(Login.getAuthToken()).toBe(token);
        });

        it('Should provide session info on request after initing', (done) => {
            mockValidToken('valid_token');
            Login.init($('<div>'))
                .then(() => {
                    expect(Login.sessionInfo).not.toBeNull();
                    done();
                });
        });

        it('Should give a null session info before initing', () => {
            expect(Login.sessionInfo).toBeNull();
        });
    });
});
