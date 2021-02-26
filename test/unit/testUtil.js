define('testUtil', ['bluebird', 'json!/test/testConfig.json'], (Promise, TestConfig) => {
    'use strict';

    let token = null,
        userId = null;

    function factory() {
        return initialize();
    }

    function getAuthToken() {
        return token;
    }

    function getUserId() {
        return userId;
    }

    /**
     * Runs the Jasmine pending() function if there's no Auth token available. This skips the
     * current test.
     */
    function pendingIfNoToken() {
        if (!token) {
            pending();
        }
    }

    function initialize() {
        if (TestConfig.token === undefined) {
            throw new Error(
                'Missing an auth token. Please enter one (or null to skip those tests) in test/unit/testConfig.json'
            );
        }
        userId = TestConfig.token.user;
        const tokenFile = TestConfig.token.file;
        return new Promise((resolve) => {
            require(['text!/' + tokenFile], (loadedToken) => {
                token = loadedToken.trim();
                console.warn('Loaded token file ' + tokenFile);
                resolve(token);
            }, () => {
                console.warn(
                    'Unable to load token file ' + tokenFile + '. Continuing without a token'
                );
                resolve(null);
            });
        });
    }

    function wait(timeMs) {
        return Promise.delay(timeMs);
    }

    return {
        make: factory,
        getAuthToken: getAuthToken,
        pendingIfNoToken: pendingIfNoToken,
        getUserId: getUserId,
        wait: wait,
    };
});
