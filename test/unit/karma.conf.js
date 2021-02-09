// process.env.CHROME_BIN = require('puppeteer').executablePath();
module.exports = function (config) {
    'use strict';
    config.set({
        basePath: '../../',
        frameworks: ['jasmine', 'requirejs', 'es6-shim'],
        client: {
            jasmine: {
                failFast: false,
                DEFAULT_TIMEOUT_INTERVAL: 20000
            },
            requireJsShowNoTimestampsError: '^(?!.*(^/narrative/))',
            clearContext: false
        },
        plugins: [
            'karma-jasmine',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-requirejs',
            'karma-coverage',
            'karma-mocha-reporter',
            'karma-es6-shim',
            'karma-json-result-reporter',
        ],
        preprocessors: {
            'kbase-extension/static/kbase/js/**/!(api)/*.js': ['coverage'],
            'kbase-extension/static/kbase/js/api/!(*[Cc]lient*|Catalog|KBaseFeatureValues|NarrativeJobServiceWrapper|NewWorkspace)*.js': ['coverage'],
            'kbase-extension/static/kbase/js/api/RestAPIClient.js': ['coverage'],
            'nbextensions/appcell2/widgets/tabs/*.js': ['coverage'],
            'kbase-extension/static/kbase/js/*.js': ['coverage']
        },
        files: [
            'kbase-extension/static/narrative_paths.js',
            {pattern: 'test/unit/spec/**/*.js', included: false},
            {pattern: 'node_modules/jasmine-ajax/lib/mock-ajax.js', included: true},
            {pattern: 'kbase-extension/static/ext_components/kbase-ui-plugin-catalog/src/plugin/modules/data/categories.yml', included: false, served: true},
            {pattern: 'kbase-extension/static/**/*.css', included: false, served: true},
            {pattern: 'kbase-extension/static/kbase/templates/**/*.html', included: false, served: true},
            {pattern: 'kbase-extension/static/kbase/config/**/*.json', included: false, served: true},
            {pattern: 'kbase-extension/static/kbase/config/**/*.yaml', included: false, served: true},
            {pattern: 'kbase-extension/static/**/*.js', included: false, served: true},
            {pattern: 'kbase-extension/static/**/*.gif', included: false, served: true},
            {pattern: 'nbextensions/appcell2/widgets/tabs/*.js', included: false},
            {pattern: 'test/testConfig.json', included: false, served: true, nocache: true},
            {pattern: 'test/*.tok', included: false, served: true, nocache: true},
            {pattern: 'test/data/**/*', included: false, served: true},
            'test/unit/testUtil.js',
            'test/unit/mocks.js',
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
        reporters: ['mocha', 'coverage', 'json-result'],
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
        mochaReporter: {
            ignoreSkipped: true,
        },
        jsonResultReporter: {
            outputFile: 'karma-result.json',
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
        browsers: ['ChromeHeadless'],
        browserNoActivityTimeout: 30000,
        singleRun: true,
        proxies: {
            '/narrative/nbextensions': 'http://localhost:32323/narrative/nbextensions',
            '/narrative/static/': '/base/kbase-extension/static/',
            '/narrative/static/base': 'http://localhost:32323/narrative/static/base',
            '/narrative/static/notebook': 'http://localhost:32323/narrative/static/notebook',
            '/narrative/static/components': 'http://localhost:32323/narrative/static/components',
            '/narrative/static/services': 'http://localhost:32323/narrative/static/services',
            '/narrative/static/bidi': 'http://localhost:32323/narrative/static/bidi',
            '/static/kbase/config': '/base/kbase-extension/static/kbase/config',
            '/test/': '/base/test/'
        },
        concurrency: Infinity

    });
};
