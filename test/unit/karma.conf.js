// process.env.CHROME_BIN = require('puppeteer').executablePath();
module.exports = function (config) {
    'use strict';

    const excludedFiles = [
        // lots of missing tests
        // 'test/unit/spec/dynamicTableSpec.js',
        // // missing tests
        // 'test/unit/spec/loadingWidgetSpec.js',
        // // Should have an init function that responds when the kernel is connected
        // // init should fail as expected when the job connection fails
        // 'test/unit/spec/kbaseNarrativeSpec.js',
        // // missing 'on' event tests
        // 'test/unit/spec/appWidgets/input/intInputSpec.js',
        // 'test/unit/spec/appWidgets/input/checkboxInputSpec.js',
        'test/unit/spec/appWidgets/input/taxonomyRefInputSpec.js',
        // 'test/unit/spec/appWidgets/input/floatInputSpec.js',

        // jobCommChannel -- async function times out
        'test/unit/spec/narrative_core/jobCommChannel-spec.js',
        // kbaseNarrativeOutputCell -- two missing specs
        // 'test/unit/spec/narrative_core/kbaseNarrativeOutputCell-spec.js',
        // kbaseNarrativeWorkspace -- missing specs
        // 'test/unit/spec/narrative_core/kbaseNarrativeWorkspace-spec.js',
        // kbaseNarrativeJobStatus --  Jupyter.notebook.get_cell_elements is not a function
        // 'test/unit/spec/narrative_core/kbaseNarrativeJobStatus-spec.js',
        // test passes when it should not
        // 'test/unit/spec/util/TimeFormatSpec.js',
        // dodgy tests for 'on' events
        // 'test/unit/spec/util/BootstrapSearchSpec.js',
        // dodgy test for 'on' event
        // 'test/unit/spec/util/BootstrapDialogSpec.js',
        // the usual suspects
        'test/unit/spec/common/cellComponents/fieldTableCellWidget-Spec.js',
        'test/unit/spec/common/cellComponents/filePathWidget-Spec.js',
        'test/unit/spec/common/cellComponents/paramsWidget-Spec.js',

        'test/unit/spec/nbextensions/bulkImportCell/tabs/configure-spec.js',
        'test/unit/spec/nbextensions/bulkImportCell/bulkImportCell-spec.js',

        // 'test/unit/spec/function_output/modeling/msPathway-spec.js',
        // one missing test
        // 'test/unit/spec/narrative_core/upload/stagingAreaViewer-spec.js',
    ].map((file) => {
        return {
            pattern: file,
            included: false,
            served: false,
        };
    });
    config.set({
        basePath: '../../',
        frameworks: ['jasmine', 'requirejs', 'es6-shim'],
        client: {
            jasmine: {
                failFast: false,
                DEFAULT_TIMEOUT_INTERVAL: 20000,
                failSpecWithNoExpectations: true,
            },
            requireJsShowNoTimestampsError: '^(?!.*(^/narrative/))',
            clearContext: false,
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
            'karma-brief-reporter',
        ],
        preprocessors: {
            // 'kbase-extension/static/kbase/js/**/!(api)/*.js': ['coverage'],
            // 'kbase-extension/static/kbase/js/api/!(*[Cc]lient*|Catalog|KBaseFeatureValues|NarrativeJobServiceWrapper|NewWorkspace)*.js': ['coverage'],
            // 'kbase-extension/static/kbase/js/api/RestAPIClient.js': ['coverage'],
            // 'nbextensions/appCell2/widgets/tabs/*.js': ['coverage'],
            // 'nbextensions/bulkImportCell/**/*.js': ['coverage'],
            // 'nbextensions/codeCell/**/*.js': ['coverage'],
            // 'kbase-extension/static/kbase/js/*.js': ['coverage']
        },
        // by default, 'included', 'watched', and 'served' are true
        // 'nocache' is false
        files: [
            'kbase-extension/static/narrative_paths.js',
            ...excludedFiles,
            { pattern: 'test/unit/spec/**/*.js', included: false },
            // // all tests have specs
            // { pattern: 'test/unit/spec/api/*.js', included: false },
            // { pattern: 'test/unit/spec/api/**/*.js', included: false },

            // // missing specs
            // {pattern: 'test/unit/spec/appWidgets/*.js', included: false},
            // {pattern: 'test/unit/spec/appWidgets/**/*.js', included: false},

            // {pattern: 'test/unit/spec/common/*.js', included: false},
            // {pattern: 'test/unit/spec/common/**/*.js', included: false},

            // // all tests have specs
            // { pattern: 'test/unit/spec/function_output/*.js', included: false },
            // { pattern: 'test/unit/spec/function_output/**/*.js', included: false },

            // { pattern: 'test/unit/spec/narrative_core/*.js', included: false },
            // { pattern: 'test/unit/spec/narrative_core/**/*.js', included: false },

            // {pattern: 'test/unit/spec/nbextensions/*.js', included: false},
            // {pattern: 'test/unit/spec/nbextensions/**/*.js', included: false},

            // //
            // { pattern: 'test/unit/spec/util/*.js', included: false },
            // { pattern: 'test/unit/spec/util/**/*.js', included: false },

            // // all tests have specs
            // { pattern: 'test/unit/spec/vis/*.js', included: false },
            // { pattern: 'test/unit/spec/vis/**/*.js', included: false },

            'node_modules/jasmine-ajax/lib/mock-ajax.js',
            {
                pattern:
                    'kbase-extension/static/ext_components/kbase-ui-plugin-catalog/src/plugin/modules/data/categories.yml',
                included: false,
            },
            { pattern: 'kbase-extension/static/**/*.css', included: false },
            {
                pattern: 'kbase-extension/static/kbase/templates/**/*.html',
                included: false,
            },
            {
                pattern: 'kbase-extension/static/kbase/config/**/*.json',
                included: false,
            },
            {
                pattern: 'kbase-extension/static/kbase/config/**/*.yaml',
                included: false,
            },
            { pattern: 'kbase-extension/static/**/*.js', included: false },
            { pattern: 'kbase-extension/static/**/*.gif', included: false },
            { pattern: 'nbextensions/appCell2/**/*.js', included: false },
            { pattern: 'nbextensions/bulkImportCell/**/*.js', included: false },
            { pattern: 'nbextensions/bulkImportCell/**/*.json', included: false },
            { pattern: 'nbextensions/codeCell/**/*.js', included: false },
            { pattern: 'test/testConfig.json', included: false, nocache: true },
            { pattern: 'test/*.tok', included: false, nocache: true },
            { pattern: 'test/data/**/*', included: false },
            'test/unit/testUtil.js',
            'test/unit/mocks.js',
            'test/unit/test-main.js',
        ],
        exclude: [
            'kbase-extension/static/buildTools/*.js',
            'kbase-extension/static/ext_components/**/test/**/*.js',
            'kbase-extension/static/kbase/js/patched-components/**/*',
        ],
        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: [
            // 'mocha',
            // 'coverage',
            'json-result',
            'brief',
        ],
        coverageReporter: {
            type: 'html',
            dir: 'js-coverage/',
            reporters: [
                {
                    type: 'html',
                    subdir: 'html',
                },
                {
                    type: 'lcov',
                    subdir: 'lcov',
                },
            ],
            includeAllSources: true,
        },
        mochaReporter: {
            ignoreSkipped: true,
            output: 'minimal',
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
            '/narrative/nbextensions': '/base/nbextensions',
            '/narrative/static/': '/base/kbase-extension/static/',
            '/narrative/static/base': 'http://localhost:32323/narrative/static/base',
            '/narrative/static/notebook': 'http://localhost:32323/narrative/static/notebook',
            '/narrative/static/components': 'http://localhost:32323/narrative/static/components',
            '/narrative/static/services': 'http://localhost:32323/narrative/static/services',
            '/narrative/static/bidi': 'http://localhost:32323/narrative/static/bidi',
            '/static/kbase/config': '/base/kbase-extension/static/kbase/config',
            '/test/': '/base/test/',
        },
        concurrency: Infinity,
    });
};
