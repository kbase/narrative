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
    const cookieKeys = ['kbase_session', 'kbase_session_backup', 'narrative_session'];

    function setToken(token) {
        cookieKeys.forEach(key => document.cookie = `${key}=${token}`);
    }

    function clearToken() {
        cookieKeys.forEach(key => document.cookie = `${key}=`);
    }

    beforeEach(() => {
        token = TestUtil.getAuthToken();
        setToken(token);
        authClient = Auth.make({url: Config.url('auth')});
    });

    afterEach(() => {
        clearToken();
    });

    describe('Test the Auth API module', () => {
        it('Should make a new Auth client on request', () => {
            var auth = Auth.make({url: Config.url('auth')});
            expect(auth).not.toBeNull();
        });

        it('Should get auth token info', (done) => {
            TestUtil.pendingIfNoToken();

            authClient.getTokenInfo(token)
                .then((response) => {
                    expect(Object.keys(response)).toContain('expires');
                    done();
                })
                .catch((error) => {
                    expect(error).toBeNull();
                    done();
                });
        });

        it('Should fail to get auth token info from a fake token', (done) => {
            TestUtil.pendingIfNoToken();

            authClient.getTokenInfo('faketoken')
                .then((response) => {
                    expect(response).toBeNull();
                    done();
                })
                .catch((error) => {
                    expect(error).not.toBeNull();
                    expect(Object.keys(error)).toContain('error');
                    done();
                });
        });

        it('Should return my profile', (done) => {
            TestUtil.pendingIfNoToken();

            authClient.getUserProfile()
                .then((response) => {
                    expect(response).not.toBeNull();
                    expect(Object.keys(response)).toContain('display');
                    done();
                })
                .catch((error) => {
                    expect(error).toBeNull();
                    done();
                });
        });

        it('Should fail to get profile with a missing token', (done) => {
            clearToken();
            authClient.getCurrentProfile()
                .then((profile) => {
                    done.fail('Should have failed!');
                })
                .catch((error) => {
                    done();
                });
        });

        it('Should fail to get profile with a bad token', (done) => {
            clearToken();
            setToken('someBadToken');
            authClient.getCurrentProfile()
                .then(() => {
                    done.fail('Should have failed!');
                })
                .catch(() => {
                    done();
                });
        });

        it('Should return a list of users', (done) => {
            TestUtil.pendingIfNoToken();

            var badName = 'not_a_user_name';
            authClient.getUserNames(token, ['wjriehl', badName])
                .then((names) => {
                    expect(names.wjriehl).toEqual('William Riehl');
                    expect(Object.keys(names)).not.toContain(badName);
                    done();
                })
                .catch((error) => {
                    expect(error).toBeNull();
                    done();
                });
        });

        it('Should fail to get users with a bad token', (done) => {
            const token = 'someBadToken';
            clearToken();
            setToken(token);
            authClient.getUserNames(token, ['wjriehl'])
                .then(() => {
                    done.fail('Should have failed!');
                })
                .catch(() => {
                    done();
                });
        });

        it('Should fail to get users with a missing token', (done) => {
            clearToken();
            authClient.getUserNames(null, ['wjriehl'])
                .then(() => {
                    done.fail('Should have failed!');
                })
                .catch(() => {
                    done();
                });
        });

        it('Should search for users', (done) => {
            TestUtil.pendingIfNoToken();

            var query = 'ie';
            authClient.searchUserNames(token, query)
                .then((results) => {
                    expect(results).not.toBeNull();
                    done();
                })
                .catch((error) => {
                    expect(error).toBeNull();
                    done();
                });
        });

        it('Should search for users with extra options', (done) => {
            TestUtil.pendingIfNoToken();

            var query = 'ie';
            var options = [''];
            authClient.searchUserNames(token, query, options)
                .then((results) => {
                    expect(results).not.toBeNull();
                    done();
                })
                .catch((error) => {
                    expect(error).toBeNull();
                    done();
                });
        });

        it('Should fail to search for users with a bad token', (done) => {
            authClient.searchUserNames('someBadToken', 'ie', [''])
                .then(() => {
                    done.fail('Should have failed!');
                })
                .catch(() => {
                    done();
                });
        });

        it('Should fail to search for users with a missing token', (done) => {
            clearToken();
            authClient.searchUserNames(null, 'ie', [''])
                .then(() => {
                    done.fail('Should have failed!');
                })
                .catch(() => {
                    done();
                });
        });

        it('Should set an auth token cookie', () => {
            clearToken();
            const newToken = 'someRandomToken';
            authClient.setAuthToken(newToken);
            expect(authClient.getAuthToken()).toEqual(newToken);
        });

        it('Should validate an auth token on request', (done) => {
            let doneCount = 0;
            let trials = [{
                token: null,
                isValid: true  // should get it from cookie
            }, {
                token: 'someRandomToken',
                isValid: false
            }]
            trials.forEach(trial => {
                authClient.validateToken(trial.token)
                    .then(isValid => {
                        expect(isValid).toBe(trial.isValid);
                        doneCount++;
                        if (doneCount === trials.length) {
                            done();
                        }
                    })
                    .catch(error => {
                        done();
                    });
            });
        });

        it('Should clear all auth token cookies on request', () => {
            setToken('someToken');
            expect(authClient.getAuthToken()).toEqual('someToken');
            authClient.clearAuthToken();
            expect(authClient.getAuthToken()).toBeNull();
        });

        it('Should revoke an auth token on request', () => {
            // This deletes the token. Should be mocked?
        });
    });
});
