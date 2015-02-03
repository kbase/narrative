'use strict';
var path = require('path');

// the actual "static" directory path, relative to this Gruntfile.
// should be updated as necessary, if this moves
var staticDir = 'static';

/** 
 * We need a config for the first step - concat - that plays nice with the Jinja directive-wrapped
 * script src tag.
 * All src strings are wrapped with the static_url function like this:
 *     <script src="{{ static_url("path/to/script.js") }}"></script>"
 * 
 * This needs to be stripped so we actually have
 *     static/path/to/script.js
 * instead, and returned as the config object. This is ripped out of the block
 * variable where all the raw stuff lives and parsed via regex, then we use
 * a vaguely simple version of the rest of the createConfig code from 
 * grunt-usemin's default config function, here:
 * https://github.com/yeoman/grunt-usemin/blob/master/lib/config/concat.js
 *
 * This only needs to be done for the first step, since the minifier just uses the concatted 
 * version.
 */
var createIPythonCompatibleConfig = function(context, block) {
    var parsedFiles = [];
    // regex for ripping out the static_url bit
    // strings that match this regex will have the actual path and script in
    // the second element of the match array
    var pattern = /^\s*\<script\s*src=\"\{\{\s*static_url\(\"(\S+\.js)\"\)\s*\}\}\"/;
    for (var i=0; i<block.raw.length; i++) {
        var m = block.raw[i].match(pattern);
        if (m && m.length === 2) {
            parsedFiles.push(m[1]);
        }
    }
    block.src = parsedFiles;
    context.inFiles = parsedFiles;

    // file paths are now parsed and fixed, set up the config
    var cfg = {
        files: []
    };

    var outfile = path.join(context.outDir, block.dest);
    var files = {
        dest: outfile,
        src: []
    };

    context.inFiles.forEach(function (f) {
        files.src.push(path.join(staticDir, f));
    });
    cfg.files.push(files);
    context.outFiles = [block.dest];
    return cfg;
};

module.exports = function(grunt) {
    // Project configuration
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-filerev');
    grunt.loadNpmTasks('grunt-usemin');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        useminPrepare: {
            html: 'notebook.html',
            options: {
                staging: 'static/kbase/js/staging',
                dest: 'static',
                flow: {
                    steps: {
                        js: [{
                            name: 'concat',
                            createConfig: createIPythonCompatibleConfig
                        }, 'uglifyjs' ]
                    },
                    post: {}
                }
            }
        },
        uglify: {
            options: {
                dest: 'static/kbase-narrative.min.js',
                sourceMap: false,
            }
        },
        filerev: {
            options: {
                algorithm: 'md5',
                length: 8
            },
            source: {
                files: [{
                    src: [
                        'static/kbase/js/kbase-narrative.min.js',
                    ],
                    dest: 'static/kbase/js'
                }]
            }
        },
        usemin: {
            html: 'notebook.html',
            options: {
                assetsDirs: ['static'],
                blockReplacements: {
                    js: function (block) {
                        return '<script src="{{ static_url("' + block.dest + '") }}" type="text/javascript" charset="utf-8"></script>';
                    }
                }
            }
        }
    });


    grunt.registerTask('build', [
        'useminPrepare',
        'concat:generated',
        'uglify:generated',
        'filerev',
        'usemin'
    ]);
};