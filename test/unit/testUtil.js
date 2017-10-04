define('testUtil', [
    'bluebird',
    'narrativeConfig',
    'json!/test/unit/testConfig.json'
], function(Promise, Config, TestConfig) {
    'use strict';

    var token = null;
    var currentNarrative = null;
    var currentWorkspace = null;

    function factory() {
        return initialize();
    }

    function getToken() {
        return token;
    }

    function getCurrentNarrative() {
        if (currentNarrative) {
            return currentNarrative;
        }
        var token = getToken();
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

    function initialize() {
        if (TestConfig.token === undefined) {
            throw new Error('Missing an auth token. Please enter one (or null to skip those tests) in test/unit/testConfig.json');
        }
        var tokenFile = TestConfig.token;
        return new Promise(function(resolve, reject) {
            require(['text!' + tokenFile],
            function(loadedToken) {
                token = loadedToken;
                resolve(token);
            },
            function() {
                console.warn('Unable to load token file ' + tokenFile + '. Continuing without a token');
                resolve(null);
            });
        });
    }

    return {
        make: factory,
        getToken: getToken,
        getCurrentNarrative: getCurrentNarrative
    };
});
