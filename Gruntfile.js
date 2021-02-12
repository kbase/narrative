module.exports = function(grunt) {

    'use strict';
    require('load-grunt-tasks')(grunt);

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

                        replace: function() {
                            return 'kbase-narrative-min.js';
                        },
                        flags: ''
                    }
                ]
            }
        },
        // Run CSS / SCSS-related tasks
        // these files are modified in place
        postcss: {
            // autoprefix and minify the concatenated css files
            concat: {
                options: {
                    processors: [
                        // add vendor prefixes
                        require('autoprefixer')(),
                        // minify
                        require('cssnano')([
                            "default",
                            {
                                "normalizeWhitespace": {
                                    "exclude": true
                                },
                            }
                        ]),
                    ],
                },
                src: [
                    'kbase-extension/static/kbase/css/*_concat.css',
                    'kbase-extension/static/kbase/css/appCell.css',
                    'kbase-extension/static/kbase/css/editorCell.css'
                ],
            }
        },

        // runs the npm command to compile scss -> css and run autoprefixer on it
        shell: {
            compile_css: {
                command: 'npm run compile_css',
            },
        },

        // watch scss files for any changes
        // when they change, regenerate the compiled css files
        watch: {
            files: 'kbase-extension/scss/**/*.scss',
            tasks: [
                'shell:compile_css',
            ],
        },
    });

    grunt.registerTask('minify', [
        'requirejs',
        'uglify',
        'regex-replace'
    ]);
};
