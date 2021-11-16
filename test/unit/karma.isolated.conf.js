// karma config for running tests that need to be isolated due to test runner issues

module.exports = function (config) {
    'use strict';
    const karmaConfig = require('./karma.conf');
    karmaConfig(config);
    const isolatePaths = [
        'test/unit/spec/nbextensions/bulkImportCell/main-spec.js',
        'test/unit/spec/nbextensions/bulkImportCell/bulkImportCell-spec.js',
    ];
    config.files.forEach((line) => {
        if (typeof line === 'object' && line.pattern.indexOf('.js') >= 0) {
            line.nocache = true;
            if (line.pattern === 'test/unit/spec/**/*.js') {
                line.pattern = isolatePaths.shift();
            }
        }
    });
    isolatePaths.forEach((path) => {
        config.files.push({
            pattern: path,
            included: false,
            nocache: true,
        });
    });

    config.exclude = config.exclude.filter((line) => {
        return !isolatePaths.includes(line);
    });

    config.reporters = ['mocha', 'json-result'];
};
