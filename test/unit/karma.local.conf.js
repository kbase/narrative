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
    config.exclude = config.exclude.filter((file) => {
        return file.indexOf('test/unit/spec/') === -1;
    });
};
