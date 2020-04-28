/*global define*/
/*global describe, it, expect*/
/*global jasmine, pending*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'api/auth',
    'narrativeConfig',
    'testUtil'
], function(
    Auth,
    Config,
    TestUtil
) {
    'use strict';

    var authClient,
        token;

    beforeEach(function() {
        token = TestUtil.getAuthToken();
        document.cookie='kbase_session=' + token;
        authClient = Auth.make({url: Config.url('auth')});
    });

    describe('Test the Auth API module', function() {
        it('Should make a new Auth client on request', function() {
            TestUtil.pendingIfNoToken();

            var auth = Auth.make({url: Config.url('auth')});
            expect(auth).not.toBeNull();
        });

        it('Should get auth token info', function(done) {
            TestUtil.pendingIfNoToken();

            authClient.getTokenInfo(token)
                .then(function(response) {
                    expect(Object.keys(response)).toContain('expires');
                    done();
                })
                .catch(function(error) {
                    expect(error).toBeNull();
                    done();
                });
        });

        it('Should fail to get auth token info from a fake token', function(done) {
            TestUtil.pendingIfNoToken();

            authClient.getTokenInfo('faketoken')
                .then(function(response) {
                    expect(response).toBeNull();
                    done();
                })
                .catch(function(error) {
                    expect(error).not.toBeNull();
                    expect(Object.keys(error)).toContain('error');
                    done();
                });
        });

        it('Should return my profile', function(done) {
            TestUtil.pendingIfNoToken();

            authClient.getUserProfile()
                .then(function(response) {
                    expect(response).not.toBeNull();
                    expect(Object.keys(response)).toContain('display');
                    done();
                })
                .catch(function(error) {
                    expect(error).toBeNull();
                    done();
                });
        });

        it('Should fail to get profile with a bad token', function(done) {
            // TODO
            done();
        });

        it('Should fail to get profile with an expired token', function(done) {
            // TODO
            done();
        });

        it('Should return a list of users', function(done) {
            TestUtil.pendingIfNoToken();

            var badName = 'not_a_user_name';
            authClient.getUserNames(token, ['wjriehl', badName])
                .then(function(names) {
                    expect(names.wjriehl).toEqual('William Riehl');
                    expect(Object.keys(names)).not.toContain(badName);
                    done();
                })
                .catch(function(error) {
                    expect(error).toBeNull();
                    done();
                });
        });

        it('Should fail to get users with a bad token', function(done) {
            //TODO
            done();
        });

        it('Should fail to get users with an expired token', function(done) {
            //TODO
            done();
        });

        it('Should search for users', function(done) {
            TestUtil.pendingIfNoToken();

            var query = 'ie';
            authClient.searchUserNames(token, query)
                .then(function(results) {
                    expect(results).not.toBeNull();
                    done();
                })
                .catch(function(error) {
                    expect(error).toBeNull();
                    done();
                });
        });

        it('Should search for users with extra options', function(done) {
            TestUtil.pendingIfNoToken();

            var query = 'ie';
            var options = [''];
            authClient.searchUserNames(token, query, options)
                .then(function(results) {
                    expect(results).not.toBeNull();
                    done();
                })
                .catch(function(error) {
                    expect(error).toBeNull();
                    done();
                });
        });

        it('Should fail to search for users with a bad token', function(done) {
            //TODO
            done();
        });

        it('Should fail to search for users with an expired token', function(done) {
            //TODO
            done();
        });
    });
});
