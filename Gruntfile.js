module.exports = function(grunt) {

    'use strict';

    require('load-grunt-tasks')(grunt);

    // files required for the 'page.html' template
    const kbaseStaticDir = 'kbase-extension/static/kbase/',

    staticFilesNoConcat = [
        kbaseStaticDir + 'custom/*.css',
        kbaseStaticDir + 'css/*.css',
        '!' + kbaseStaticDir + 'css/*_concat.css',
    ],

    pageCssFiles = [
        "custom/custom.css",
        "css/kbaseStylesheet.css",
        "css/kbaseNarrative.css",
        "css/kbaseIcons.css",
        "css/landingPages.css",
        "css/kbaseEditor.css",
        "css/kbaseNotify.css",
        "css/methodCell.css",
        "css/bootstrapHelper.css",
        "css/buttons.css",
        "css/contigBrowserStyles.css", // may need to move this out
        "css/kbaseJobLog.css",
        "css/kbaseTour.css",
        "css/batchMode.css",
    ].map( s => kbaseStaticDir + s ),

    dynamicallyLoadedCssFiles =         [
        "css/appCell.css",
        "css/advancedViewCell.css",
        "css/editorCell.css",
    ].map( s => kbaseStaticDir + s ),

    allCssFiles = pageCssFiles.concat(dynamicallyLoadedCssFiles),

    cssFileHeader = '/** This file is generated automatically; edits will not be saved.\n'
    + 'Please edit the original source files in kbase-extension/static/kbase/* '
    + 'and run "grunt concat" to regenerate this file. */\n\n',

    // stylelint options
    stylelintOptions = {
        configFile: '.stylelintrc.json',
        formatter: 'string',
        ignoreDisables: false,
        failOnError: false,
        reportNeedlessDisables: true,
        fix: true,
    },

    // clean up existing css - edits files in place
    cleanExistingCssOptions = {
        processors: [
            // remove vendor prefixes
            require('postcss-unprefix')(),
            require('postcss-remove-prefixes')(),
            // clean up and minification
            require('cssnano')({
                preset: [
                    "default",
                    {
                        "normalizeWhitespace": {
                            "exclude": true
                        },
                        "discardComments": false,
                        "colormin": false,
                        "minifyFontValues": false,
                    }
                ]
            }),
            require('stylelint')({
                options: stylelintOptions
            })
        ],
    }

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

        // Testing with Karma!
        karma: {
            unit: {
                configFile: 'test/unit/karma.conf.js',
            },
            dev: {
                // to do - add watch here
                configFile: 'test/unit/karma.conf.js',
                reporters: ['progress', 'coverage'],
                coverageReporter: {
                    dir: 'build/test-coverage/',
                    reporters: [
                        { type: 'html', subdir: 'html' },
                    ],
                },

                autoWatch: true,
                singleRun: false,
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
        },
        // file concatenation
        concat: {
            options: {
                banner: cssFileHeader,
            },
            // css for the "page" template
            pageCss: {
                src: pageCssFiles,
                dest: kbaseStaticDir + 'css/page_concat.css',
                nonull: true,
            },
            // a single file containing all the KBase css!
            allCss: {
                src: allCssFiles,
                dest: kbaseStaticDir + 'css/all_concat.css',
                nonull: true,
            }
        },

        // check the source css files are not completely horrendous
        stylelint: {
            options: stylelintOptions,
            kbaseCss: {
                src: staticFilesNoConcat,
            },
        },

        // Run CSS / SCSS-related tasks
        // these all modify files in place
        postcss: {
            // clean up the files in kbase-extension/static/kbase/(css|custom)/*.css
            kbaseCss: {
                options: cleanExistingCssOptions,
                src: staticFilesNoConcat,
            },
            // autoprefix and minify the concatenated css files
            concat: {
                options: {
                    processors: [
                        // add vendor prefixes
                        require('autoprefixer')(),
                        // add minification later
                        // require('cssnano')([
                        //     "default",
                        //     {
                        //         "normalizeWhitespace": {
                        //             "exclude": true
                        //         },
                        //     }
                        // ]),
                    ],
                },
                src: [
                    'kbase-extension/static/kbase/css/*_concat.css',
                ],
            }
        },

        // watch css files for any changes
        // when they change, regenerate the concat'd css files
        watch: {
            files: staticFilesNoConcat,
            tasks: [
                'concat',
                'postcss:concat'
            ],
        },
    });

    grunt.registerTask('build_css', [
        'postcss:kbaseCss',
        // run the stylelint task to fix formatting, etc.
        'stylelint:kbaseCss',
        'concat',
        'postcss:concat'
    ]);

    grunt.registerTask('minify', [
        'requirejs',
        'uglify',
        'regex-replace'
    ]);

    grunt.registerTask('test', [
        'karma:unit'
    ]);

    // Does a single unit test run, then sends
    // the lcov results to coveralls. Intended for running
    // from travis-ci.
    grunt.registerTask('test-travis', [
        'karma:unit',
        'coveralls'
    ]);

    // node (instead of karma) based jasmine tasks
    grunt.registerTask('test-browser', [
        'jasmine_nodejs'
    ]);
    // Does an ongoing test run in a watching development
    // mode.
    grunt.registerTask('develop', [
        'karma:dev'
    ]);
};
