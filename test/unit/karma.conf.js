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
            // had to add these all by hand, or Karma goes bugnuts.
            /* These are the external dependencies. The bower components
             * come with a LOT of stuff that isn't necessary, and causes
             * problems when loaded in the test browser. Things like tests,
             * or auto-generated minified AND maxified files that overlap.
             *
             * It's cleaner to just load the list of them by hand, then
             * have the Require apparatus take over.
             */
            {pattern: 'kbase-extension/static/components/**/*.js', included: false},
            {pattern: 'kbase-extension/static/kbase/js/*.js', included: false},
            {pattern: 'kbase-extension/static/kbase/js/widgets/**/*.js', included: false},
            {pattern: 'test/unit/spec/**/*.js', included: false},
            {pattern: 'kbase-extension/static/**/*.json', included: false},
            {pattern: 'test/unit/main-test.js'}
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
        singleRun: true

    });
};