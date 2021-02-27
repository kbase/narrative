module.exports = function (grunt) {
    'use strict';
    grunt.loadNpmTasks('grunt-regex-replace');

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
                            return 'kbase-narrative-min.js';
                        },
                        flags: '',
                    },
                ],
            },
        },
    });
};
