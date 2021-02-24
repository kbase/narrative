define([
    'bluebird'
], (
    Promise
) => {
    function copyValue(obj) {
        if (obj !== undefined) {
            return JSON.parse(JSON.stringify(obj));
        }
    }

    function pRequire(require, module) {
        return new Promise((resolve, reject) => {
            require(module, function () {
                resolve(arguments);
            }, (err) => {
                reject(err);
            });
        });
    }

    return Object.freeze({
        copy: copyValue,
        pRequire: pRequire
    });
});