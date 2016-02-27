/*jslint white: true*/
module.exports = function (config) {
    'use strict';
    config.set({
        basePath: '../../',
        frameworks: ['jasmine', 'requirejs'],
        plugins: [
            'karma-jasmine',
            'karma-chrome-launcher',
            'karma-phantomjs-launcher',
            'karma-coverage',
            'karma-requirejs'
        ],
        files: [
            // {pattern: 'kbase-extension/static/components/**/*.js', included: false},
            // {pattern: 'kbase-extension/static/kbase/js/*.js', included: false},
            // {pattern: 'kbase-extension/static/kbase/js/widgets/**/*.js', included: false},
            // {pattern: 'kbase-extension/static/**/*.json', included: false},

            {pattern: 'test/unit/spec/**/*.js', included: false},
            'kbase-extension/static/narrative_paths.js',
            'test/unit/test-main.js'
        ],
        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress', 'coverage'],
        // web server port
        port: 9876,
        // enable / disable colors in the output (reporters and logs)
        colors: true,
        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,
        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,
        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['PhantomJS'],
        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,
        proxies: {
            '/narrative/static/': 'http://localhost:8888/narrative/static',
            '/static/': 'http://localhost:8888/narrative/static'
        }

    });
};