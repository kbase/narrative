module.exports = function(grunt) {
    // Project configuration
    'use strict';
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-regex-replace');
    grunt.loadNpmTasks('grunt-coveralls');
    grunt.loadNpmTasks('grunt-jasmine-nodejs');
    grunt.loadNpmTasks('grunt-contrib-uglify-es');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // Compile the requirejs stuff into a single, uglified file.
        // the options below are taken verbatim from a standard build.js file
        // used for r.js (if we were doing this outside of a grunt build)
        requirejs: {
            compile: {
                options: {
                    name: 'narrative_paths',
                    baseUrl: 'kbase-extension/static',
                    include: [
                        'narrativeMain',
                        'buildTools/loadAppWidgets'
                    ],
                    mainConfigFile: 'kbase-extension/static/narrative_paths.js',
                    findNestedDependencies: true,
                    optimize: 'none',
                    generateSourceMaps: true,
                    preserveLicenseComments: false,
                    out: 'kbase-extension/static/kbase-narrative.js',
                    paths: {
                        jqueryui: 'empty:',
                        bootstrap: 'empty:',
                        'jquery-ui': 'empty:',
                        narrativeConfig: 'empty:',
                        'base/js/utils': 'empty:',
                        'base/js/namespace': 'empty:',
                        bootstraptour: 'empty:',
                        'services/kernels/comm': 'empty:',
                        'common/ui': 'empty:',
                        'notebook/js/celltoolbar': 'empty:',
                        'base/js/events': 'empty:',
                        'base/js/keyboard': 'empty:',
                        'base/js/dialog': 'empty:',
                        'notebook/js/notebook': 'empty:',
                        'notebook/js/main': 'empty:',
                        'custom/custom': 'empty:'
                    },
                    inlineText: false,
                    buildCSS: false,
                    optimizeAllPluginResources: false,
                    done: function(done, output) {
                        console.log(output);
                        done();
                    }
                }
            }
        },

        uglify: {
            dist: {
                options: {
                    sourceMap: true
                },
                files: {
                    'kbase-extension/static/kbase-narrative-min.js': ['kbase-extension/static/kbase-narrative.js']
                }
            }
        },

        // Once we have a revved file, this inserts that reference into page.html at
        // the right spot (near the top, the narrative_paths reference)
        'regex-replace': {
            dist: {
                src: ['kbase-extension/kbase_templates/notebook.html'],
                actions: [
                    {
                        name: 'requirejs-onefile',
                        // search: 'narrativeMain',
                        search: 'narrativeMain.js',

                        replace: function(match) {
                            return 'kbase-narrative-min.js';
                        },
                        flags: ''
                    }
                ]
            }
        },

        jasmine_nodejs: {
            // task specific (default) options
            options: {
                useHelpers: true,
                // global helpers, available to all task targets. accepts globs..
                helpers: [],
                random: false,
                seed: null,
                defaultTimeout: null, // defaults to 5000
                stopOnFailure: false,
                traceFatal: true,
                // configure one or more built-in reporters
                reporters: {
                    console: {
                        colors: true,        // (0|false)|(1|true)|2
                        cleanStack: 1,       // (0|false)|(1|true)|2|3
                        verbosity: 4,        // (0|false)|1|2|3|(4|true)
                        listStyle: 'indent', // "flat"|"indent"
                        activity: false
                    },
                },
                // add custom Jasmine reporter(s)
                customReporters: []
            },
            functional: {
                options: {
                    useHelpers: true
                },
                // spec files
                specs: [
                    'test/functional/spec/**/*Spec.js'
                ],
                // target-specific helpers
                helpers: [
                    'test/functional/helpers/**/*.helper.js'
                ]
            }
        },
        // Run coveralls and send the info.
        coveralls: {
            options: {
                force: true,
            },
            'ui-common': {
                src: 'build/test-coverage/lcov/**/*.info',
            }
        }

    });

    grunt.registerTask('minify', [
        'requirejs',
        'uglify',
        'regex-replace'
    ]);

    grunt.registerTask('build', [
        'requirejs',
        'regex-replace'
    ]);

    // node (instead of karma) based jasmine tasks
    grunt.registerTask('test-browser', [
        'jasmine_nodejs'
    ]);
};
