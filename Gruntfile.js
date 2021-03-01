const crypto = require('crypto');

module.exports = function (grunt) {
    'use strict';
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        // This inserts the reference to the compiled, minified JS file into page.html at
        // the right spot (in place of `narrativeMain`, which is used locally)
        'regex-replace': {
            dist: {
                src: ['kbase-extension/kbase_templates/notebook.html'],
                actions: [
                    {
                        name: 'requirejs-onefile',
                        search: 'narrativeMain.js',
                        replace: function () {
                            const cbString = crypto.randomBytes(4).toString('hex');
                            return `kbase-narrative-min.js?cb=${cbString}`;
                        },
                        flags: '',
                    },
                ],
            },
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
};
