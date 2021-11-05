// karma config for running the bulk import cell tests

module.exports = function (config) {
    'use strict';
    const karmaConfig = require('./karma.conf');
    karmaConfig(config);
    const bulkImportTestPath = 'test/unit/spec/nbextensions/bulkImportCell/bulkImportCell-spec.js';
    config.files.forEach((line) => {
        if (typeof line === 'object' && line.pattern.indexOf('.js') >= 0) {
            line.nocache = true;
            if (line.pattern === 'test/unit/spec/**/*.js') {
                line.pattern = bulkImportTestPath;
            }
        }
    });

    config.exclude = config.exclude.filter((line) => {
        return line !== bulkImportTestPath;
    });

    config.reporters = ['mocha', 'json-result'];
};
