module.exports = function (config) {
    'use strict';
    const karmaConfig = require('./karma.conf');
    karmaConfig(config);
    config.files.forEach((line) => {
        if (typeof line === 'object' && line.pattern.indexOf('.js') >= 0) {
            line.nocache = true;
        }
    });
    config.preprocessors = {};
    config.reporters = ['kjhtml', 'brief'];
    config.exclude = config.exclude.concat([
        // To isolate groups of tests, uncomment ALL of the
        // exclude filters below, and comment the group you
        // want to test.
        //
        // 'test/unit/spec/*.js',
        // 'test/unit/spec/api/**/*.js',
        // 'test/unit/spec/appWidgets/**/*.js',
        // 'test/unit/spec/common/**/*.js',
        // 'test/unit/spec/function_output/*.js',
        // 'test/unit/spec/function_output/kbaseExpressionPairwiseCorrelation/**/*.js',
        // 'test/unit/spec/function_output/kbaseSampleSet/**/*.js',
        // 'test/unit/spec/function_output/modeling/**/*.js',
        // 'test/unit/spec/function_output/rna-seq/**/*.js',
        // 'test/unit/spec/jsonrpc/**/*.js',
        // 'test/unit/spec/narrative_core/**/*.js',
        // 'test/unit/spec/nbextensions/**/*.js',
        // 'test/unit/spec/preactComponents/**/*.js',
        // 'test/unit/spec/util/*.js',
        // 'test/unit/spec/vis/**/*.js',
        // 'test/unit/spec/widgets/**/*.js',
    ]);
};
