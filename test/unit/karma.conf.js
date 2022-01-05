module.exports = function (config) {
    'use strict';

    const alwaysExclude = [
        'kbase-extension/static/buildTools/*.js',
        'kbase-extension/static/ext_components/**/test/**/*.js',
        'kbase-extension/static/ext_modules/**/test/**/*.js',
        'kbase-extension/static/kbase/js/patched-components/**/*',
    ];
    // the following tests should be run separately due to test runner issues
    const isolatedTests = [
        'test/unit/spec/nbextensions/bulkImportCell/main-spec.js',
        'test/unit/spec/util/appCellUtil-spec.js',
    ];

    config.set({
        basePath: '../../',
        frameworks: ['jasmine', 'requirejs', 'es6-shim', 'jasmine-matchers'],
        client: {
            jasmine: {
                failFast: false,
                timeoutInterval: 20000,
                failSpecWithNoExpectations: true,
            },
            requireJsShowNoTimestampsError: '^(?!.*(^/narrative|test/))',
            clearContext: false,
        },
        plugins: [
            'karma-jasmine',
            'karma-jasmine-matchers',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-requirejs',
            'karma-coverage',
            'karma-mocha-reporter',
            'karma-es6-shim',
            'karma-json-result-reporter',
            'karma-brief-reporter',
            'karma-jasmine-html-reporter',
        ],
        preprocessors: {
            'kbase-extension/static/kbase/js/**/!(api)/*.js': ['coverage'],
            'kbase-extension/static/kbase/js/api/!(*[Cc]lient*|Catalog|KBaseFeatureValues|NarrativeJobServiceWrapper|NewWorkspace)*.js':
                ['coverage'],
            'kbase-extension/static/kbase/js/api/RestAPIClient.js': ['coverage'],
            'kbase-extension/static/kbase/js/api/StagingServiceClient.js': ['coverage'],
            'nbextensions/appCell2/**/*.js': ['coverage'],
            'nbextensions/bulkImportCell/**/*.js': ['coverage'],
            'nbextensions/codeCell/**/*.js': ['coverage'],
            'kbase-extension/static/kbase/js/*.js': ['coverage'],
        },
        // karma defaults:
        // included: true; nocache: false; served: true; watched: true;
        files: [
            'node_modules/jasmine-ajax/lib/mock-ajax.js',
            // tests and test resources
            { pattern: 'test/unit/testUtil.js', nocache: true },
            { pattern: 'test/unit/mocks.js', nocache: true },
            { pattern: 'test/unit/test-main.js', nocache: true },
            { pattern: 'test/unit/spec/**/*.js', included: false, nocache: true },
            { pattern: 'test/unit/spec/**/*.json', included: false, nocache: true },
            { pattern: 'test/testConfig.json', included: false, nocache: true },
            { pattern: 'test/*.tok', included: false, nocache: true },
            { pattern: 'test/data/**/*', included: false, nocache: true },
            // JS files
            { pattern: 'kbase-extension/static/narrative_paths.js', nocache: true },
            { pattern: 'kbase-extension/static/**/*.js', included: false },
            { pattern: 'nbextensions/**/*.js', included: false },
            // static resources
            { pattern: 'kbase-extension/kbase_templates/*.html', included: false, nocache: true },
            { pattern: 'kbase-extension/static/**/*.css', nocache: true },
            { pattern: 'kbase-extension/static/**/*.gif', included: false },
            {
                pattern: 'kbase-extension/static/kbase/templates/**/*.html',
                included: false,
            },
            { pattern: 'kbase-extension/static/**/*.woff2', included: false },
            { pattern: 'kbase-extension/static/**/*.ttf', included: false },
            { pattern: 'kbase-extension/static/**/*.woff', included: false },
            {
                pattern: 'kbase-extension/static/kbase/config/**/*.json',
                included: false,
            },
            {
                pattern: 'kbase-extension/static/kbase/config/**/*.yaml',
                included: false,
            },
            {
                pattern:
                    'kbase-extension/static/ext_components/kbase-ui-plugin-catalog/src/plugin/iframe_root/modules/data/categories.yml',
                included: false,
            },
        ],
        isolatedTests,
        alwaysExclude,
        exclude: [...alwaysExclude, ...isolatedTests],
        // test results reporter to use
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['mocha', 'coverage', 'json-result'],
        coverageReporter: {
            type: 'html',
            dir: 'js-coverage/',
            reporters: [
                {
                    type: 'html',
                    subdir: 'html',
                },
                {
                    type: 'lcovonly',
                    subdir: 'lcov',
                },
            ],
            includeAllSources: true,
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
            '/kbase_templates/': '/base/kbase-extension/kbase_templates/',
            '/narrative/nbextensions': '/base/nbextensions',
            '/narrative/static/': '/base/kbase-extension/static/',
            '/narrative/static/base': 'http://localhost:32323/narrative/static/base',
            '/narrative/static/notebook': 'http://localhost:32323/narrative/static/notebook',
            '/narrative/static/components': 'http://localhost:32323/narrative/static/components',
            '/narrative/static/services': 'http://localhost:32323/narrative/static/services',
            '/narrative/static/bidi': 'http://localhost:32323/narrative/static/bidi',
            '/static/kbase/config': '/base/kbase-extension/static/kbase/config',
            '/test/': '/base/test/',
            // This ensures that the msw api (msw.js) can find mockServerWorker.js service
            // worker library at the canonical location.
            '/mockServiceWorker.js': '/narrative/static/ext_modules/msw/mockServiceWorker.js',
        },
        concurrency: Infinity,
    });
};
