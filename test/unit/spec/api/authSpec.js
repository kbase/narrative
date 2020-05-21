/*global define*/
/*global describe, it, expect*/
/*global jasmine, pending*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define([
    'api/auth',
    'narrativeConfig',
    'testUtil',
    'uuid'
], function (
    Auth,
    Config,
    TestUtil,
    Uuid
) {
    'use strict';

    let authClient,
        token;

    // The following functions ensure that the token for the "user" configured
    // in test/unit/testConfig.json is set in the standard session cookie field
    // before each test, and removed afterwards.
    //
    // This is for the convenience of testing "auth" functions which assume
    // existing authentication, yet because it doesn't use the auth cookie functions,
    // which is arguably beneficial here as it does keeps the scope of test setup
    // more limited in scope.
    //
    // Note that for tests which test the auth cookie functions, clearToken()
    // must be called first to clear out the session cookie.
    //
    // Also note that this does not deal with the backup or narrative session cookies,
    // since those are
    const cookieKeys = ['kbase_session'];

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

    beforeEach(() => {
        token = TestUtil.getAuthToken();
        setToken(token);
        authClient = Auth.make({
            url: Config.url('auth'),
            // Can't use secure cookies for testing.
            secureCookies: false
        });
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
                .then(() => {
                    done.fail('Should have failed!');
                })
                .catch(() => {
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
            const trials = [{
                token: null,
                isValid: true  // should get it from cookie
            }, {
                token: 'someRandomToken',
                isValid: false
            }];
            trials.forEach((trial) => {
                authClient.validateToken(trial.token)
                    .then((isValid) => {
                        expect(isValid).toBe(trial.isValid);
                        doneCount++;
                        if (doneCount === trials.length) {
                            done();
                        }
                    })
                    .catch(() => {
                        done();
                    });
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
                domain: 'localhost'
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
                expires: 14
            });

            // Okay, it should be set.
            expect(authClient.getCookie('narrative_session')).toEqual(cookieValue);

            // Clearing the auth token should zap the narrative_session cookie too.
            authClient.clearAuthToken();
            expect(authClient.getAuthToken()).toBeNull();
            expect(authClient.getCookie('narrative_session')).toBeNull();
        });

        it('Should revoke an auth token on request', () => {
            // This deletes the token. Should be mocked?
        });
    });
});
