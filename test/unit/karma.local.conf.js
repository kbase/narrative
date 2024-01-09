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
        // 'test/unit/spec/api/**/*',
        // 'test/unit/spec/appWidgets/**/*',
        // 'test/unit/spec/common/**/*',
        // 'test/unit/spec/function_output/*.js',
        // 'test/unit/spec/function_output/kbaseExpressionPairwiseCorrelation/**/*',
        // 'test/unit/spec/function_output/kbaseSampleSet/**/*',
        // 'test/unit/spec/function_output/modeling/**/*',
        // 'test/unit/spec/function_output/rna-seq/**/*',
        // 'test/unit/spec/jsonrpc/**/*',
        // 'test/unit/spec/narrative_core/**/*',
        // 'test/unit/spec/nbextensions/**/*',
        // 'test/unit/spec/util/*',
        // 'test/unit/spec/vis/**/*',
        // 'test/unit/spec/widgets/**/*',
    ]);
};
