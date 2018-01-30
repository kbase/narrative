define([
    'bluebird'
], function (
    Promise
) {
    function copyValue(obj) {
        if (obj !== undefined) {
            return JSON.parse(JSON.stringify(obj));
        }
    }

    function pRequire(require, module) {
        return new Promise(function (resolve, reject) {
            require(module, function () {
                resolve(arguments);
            }, function (err) {
                reject(err);
            });
        });
    }

    return Object.freeze({
        copy: copyValue,
        pRequire: pRequire
    });
});