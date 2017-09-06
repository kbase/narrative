define('testUtil', [
    'narrativeConfig',
    'json!/test/unit/testConfig.json'
], function(Config, TestConfig) {
    'use strict';

    var token = null;
    var currentNarrative = null;
    var currentWorkspace = null;

    initialize();

    function initialize() {
        console.log('INITIALIZING TEST UTILITIES');
        console.log(TestConfig);
        if (TestConfig.token === undefined) {
            throw new Error('Missing an auth token. Please enter one (or null to skip those tests) in test/unit/testConfig.json');
        }
        token = TestConfig.token;
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

    function loadNarrativeData() {

    }

    function getCurrentWorkspace() {

    }

    return {
        getToken: getToken,
        getCurrentNarrative: getCurrentNarrative
    };
});
