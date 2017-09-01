define([
    'jquery',
    'narrativeConfig',
    'json!testConfig.json'
], function($, Config, TestConfig) {
    var token = null;
    var currentNarrative = null;
    var currentWorkspace = null;

    function getToken() {
        if (token) {
            return token;
        }
        // pull out of testConfig

        // if not there, throw an Error
        throw new Error('Auth token not found. Please enter one in testConfig.json');
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
        token: getToken(),
        currentNarrative: getCurrentNarrative()
    }
});
