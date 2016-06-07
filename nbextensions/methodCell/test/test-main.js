/*global require*/
/*jslint white:true,browser:true*/

var allTestFiles = [];
var TEST_REGEXP = /(spec|test)\.js$/i;

// Get a list of all the test files to include
Object.keys(window.__karma__.files).forEach(function (file) {
    if (TEST_REGEXP.test(file)) {
        // Normalize paths to RequireJS module names.
        // If you require sub-dependencies of test files to be loaded as-is (requiring file extension)
        // then do not normalize the paths
        var normalizedTestModule = file.replace(/^\/base\/|\.js$/g, '');
        allTestFiles.push(normalizedTestModule);
    }
});

require.config({
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: '/base',
    paths: {
        kb_common: 'http://cdn.kbase.us/cdn/kbase-common-js/1.5.4/',
        kb_service: 'http://cdn.kbase.us/cdn/kbase-service-clients-js/1.4.0/',
        uuid: 'http://cdn.kbase.us/cdn/pure-uuid/1.3.0/uuid',
        text:  'http://cdn.kbase.us/cdn/requirejs-text/2.0.14/text',
        css: 'http://cdn.kbase.us/cdn/require-css/0.1.8/css',
        'font-awesome': 'http://cdn.kbase.us/cdn/font-awesome/4.3.0/css/font-awesome',
        bluebird: 'http://cdn.kbase.us/cdn/bluebird/3.3.4/bluebird',
        jquery: 'http://cdn.kbase.us/cdn/jquery/2.2.2/jquery'
    },
    // dynamically load all test files
    deps: allTestFiles,
    // we have to kickoff jasmine, as it is asynchronous
    callback: window.__karma__.start
});
