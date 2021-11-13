// karma config for running the bulk import cell tests

module.exports = function (config) {
    'use strict';
    const karmaConfig = require('./karma.conf');
    karmaConfig(config);
    const bulkImportTestPaths = [
        'test/unit/spec/nbextensions/bulkImportCell/main-spec.js',
        'test/unit/spec/nbextensions/bulkImportCell/bulkImportCell-spec.js',
    ];
    config.files.forEach((line) => {
        if (typeof line === 'object' && line.pattern.indexOf('.js') >= 0) {
            line.nocache = true;
            if (line.pattern === 'test/unit/spec/**/*.js') {
                line.pattern = bulkImportTestPaths.shift();
            }
        }
    });
    bulkImportTestPaths.forEach((path) => {
        config.files.push({
            pattern: path,
            included: false,
            nocache: true,
        });
    });

    config.exclude = config.exclude.filter((line) => {
        return !bulkImportTestPaths.includes(line);
    });

    config.reporters = ['mocha', 'json-result'];
};
