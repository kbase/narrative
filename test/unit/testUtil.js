/*global pending */
define('testUtil', [
    'bluebird',
    'narrativeConfig',
    'json!/test/testConfig.json'
], function(Promise, Config, TestConfig) {
    'use strict';

    var token = null,
        userId = null,
        currentNarrative = null,
        currentWorkspace = null;

    function factory() {
        return initialize();
    }

    function getAuthToken() {
        return token;
    }

    function getUserId() {
        return userId;
    }

    function getCurrentNarrative() {
        if (currentNarrative) {
            return currentNarrative;
        }
        var token = getAuthToken();
        // make a new workspace
        // make a new narrative object and add it to the workspace
        // add some data to the workspace
    }

    function createNarrative() {

    }

    function loadNarrativeData() {
        /* Steps:
         * 1. Make a new narrative if there isn't a current one.
         * 2. Load all data given by TestConfig.data
         * 3. ...
         * 4. Profit.
         */
    }

    function cleanupTestRun() {
        /* If we have open Workspaces, delete them.
         */
    }

    function getCurrentWorkspace() {

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
            throw new Error('Missing an auth token. Please enter one (or null to skip those tests) in test/unit/testConfig.json');
        }
        userId = TestConfig.token.user;
        var tokenFile = TestConfig.token.file;
        return new Promise(function(resolve) {
            require(['text!/' + tokenFile],
                function(loadedToken) {
                    token = loadedToken.trim();
                    console.warn('Loaded token file ' + tokenFile);
                    resolve(token);
                },
                function() {
                    console.warn('Unable to load token file ' + tokenFile + '. Continuing without a token');
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
        getCurrentNarrative: getCurrentNarrative,
        pendingIfNoToken: pendingIfNoToken,
        getUserId: getUserId,
        wait: wait
    };
});
