// karma config for running tests that need to be isolated due to test runner issues
module.exports = function (config) {
    'use strict';
    const karmaConfig = require('./karma.conf');
    karmaConfig(config);

    const isolatePaths = config.isolatedTests;
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

    config.exclude = config.alwaysExclude;
    config.reporters = ['mocha', 'json-result'];
};
