'use strict';
var path = require('path');

// the actual "static" directory path, relative to this Gruntfile.
// should be updated as necessary, if this moves
var staticDir = 'static';

module.exports = function(grunt) {
    // Project configuration
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-filerev');
    grunt.loadNpmTasks('grunt-regex-replace');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-coveralls');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // Compile the requirejs stuff into a single, uglified file.
        // the options below are taken verbatim from a standard build.js file
        // used for r.js (if we were doing this outside of a grunt build)
        requirejs: {
            compile: {
                options: {
                    baseUrl: "./static",
                    mainConfigFile: "static/narrative_paths.js",
                    findNestedDependencies: true,
                    optimize: "uglify2",
                    generateSourceMaps: true,
                    preserveLicenseComments: false,
                    name: "narrative_paths",
                    out: "static/dist/kbase-narrative-min.js"
                }
            }
        },

        // Put a 'revision' stamp on the output file. This attaches an 8-character 
        // md5 hash to the end of the requirejs built file.
        filerev: {
            options: {
                algorithm: 'md5',
                length: 8
            },
            source: {
                files: [{
                    src: [
                        'static/dist/kbase-narrative-min.js', //kbase/js/kbase-narrative.min.js',
                    ],
                    dest: 'static/dist/' // 'static/kbase/js'
                }]
            }
        },

        // Once we have a revved file, this inserts that reference into page.html at
        // the right spot (near the top, the narrative_paths reference)
        'regex-replace': {
            dist: {
                src: ['page.html'],
                actions: [
                    {
                        name: 'requirejs-onefile',
                        search: 'narrative_paths',
                        replace: function(match) {
                            // do a little sneakiness here. we just did the filerev thing, so get that mapping
                            // and return that (minus the .js on the end)
                            var revvedFile = grunt.filerev.summary['static/dist/kbase-narrative-min.js'];
                            // starts with 'static/' and ends with '.js' so return all but the first 7 and last 3 characters
                            return revvedFile.substr(7, revvedFile.length - 10);
                        },
                        flags: ''
                    }
                ]
            }
        },

        // Testing with Karma!
        'karma': {
            unit: {
                configFile: 'test/karma.conf.js'
            },
            dev: {
                // to do - add watch here
                configFile: 'test/karma.conf.js',
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

        // Run coveralls and send the info.
        'coveralls': {
            options: {
                force: true,
            },
            'ui-common': {
                src: 'build/test-coverage/lcov/**/*.info',
            },
        },
        
    });


    grunt.registerTask('build', [
        'requirejs',
        'filerev',
        'regex-replace'
    ]);

    grunt.registerTask('test', [
        'karma:unit',
    ]);

    // Does a single unit test run, then sends 
    // the lcov results to coveralls. Intended for running
    // from travis-ci.
    grunt.registerTask('test-travis', [
        'karma:unit',
        'coveralls'
    ]);

    // Does an ongoing test run in a watching development
    // mode.
    grunt.registerTask('develop', [
        'karma:dev',
    ]);
};