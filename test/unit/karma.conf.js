/*jslint white: true*/
/*global module */
module.exports = function (config) {
    'use strict';
    config.set({
        basePath: '../../',
        frameworks: ['jasmine', 'requirejs'],
        plugins: [
            'karma-jasmine',
            // 'karma-chrome-launcher',
            'karma-phantomjs-launcher',
            'karma-requirejs',
            'karma-coverage',
            'karma-mocha-reporter'
        ],
        preprocessors: {
            'kbase-extension/static/kbase/js/**/*.js': ['coverage']
        },
        files: [
            {pattern: 'test/unit/spec/**/*.js', included: false},
            // {pattern: 'test/unit/spec/narrative_core/upload/stagingAreaViewer-spec.js', included: false},
            {pattern: 'node_modules/string.prototype.startswith/startswith.js', included: true},
            {pattern: 'node_modules/string.prototype.endswith/endswith.js', included: true},
            {pattern: 'kbase-extension/static/ext_components/kbase-ui-plugin-catalog/src/plugin/modules/data/categories.yml', included: false, served: true},
            {pattern: 'kbase-extension/static/**/*.css', included: false, served: true},
            {pattern: 'kbase-extension/static/kbase/templates/**/*.html', included: false, served: true},
            {pattern: 'kbase-extension/static/kbase/config/**/*.json', included: false, served: true},
            {pattern: 'kbase-extension/static/**/*.js', included: false, served: true},
            {pattern: 'kbase-extension/static/**/*.gif', included: false, served: true},
            'kbase-extension/static/narrative_paths.js',
            {pattern: 'test/unit/testConfig.json', included: false, served: true, nocache: true},
            {pattern: 'test/*.tok', included: false, served: true, nocache: true},
            {pattern: 'test/data/**/*', included: false, served: true},
            'test/unit/testUtil.js',
            'test/unit/test-main.js'
        ],
        exclude: [
            'kbase-extension/static/buildTools/*.js',
            'kbase-extension/static/ext_components/**/test/**/*.js',
            'kbase-extension/static/kbase/js/patched-components/**/*'
        ],
        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['mocha', 'coverage'],
        coverageReporter: {
            type: 'html',
            dir: 'js-coverage/',
            reporters: [{
                type: 'html',
                subdir: 'html'
            }, {
                type: 'lcov',
                subdir: 'lcov'
            }],
            includeAllSources: true
        },
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
        // phantomjsLauncher: {
        //     options: {
        //         settings: {
        //             webSecurityEnabled: false
        //         }
        //     }
        // },
        singleRun: true,
        proxies: {
            '/narrative/static/': '/base/kbase-extension/static/',
            '/narrative/static/base': 'http://localhost:32323/narrative/static/base',
            '/narrative/static/notebook': 'http://localhost:32323/narrative/static/notebook',
            '/narrative/static/components': 'http://localhost:32323/narrative/static/components',
            '/narrative/static/services': 'http://localhost:32323/narrative/static/services',
            '/static/kbase/config': '/base/kbase-extension/static/kbase/config',
            '/test/': '/base/test/'
        }

    });
};
