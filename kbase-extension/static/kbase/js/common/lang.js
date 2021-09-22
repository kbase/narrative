define(['bluebird'], (Promise) => {
    'use strict';

    function copyValue(obj) {
        if (obj !== undefined) {
            return JSON.parse(JSON.stringify(obj));
        }
    }

    /**
     * This wraps a require call in a bluebird Promise. The Promise then resolves
     * into an array of Widgets, one for each.
     * @param {Array} modules an array of module paths for a require call.
     * @returns a Promise that resolves into an array of modules.
     */
    function pRequire(modules) {
        return new Promise((resolve, reject) => {
            require(modules, (...args) => {
                resolve(args);
            }, (err) => {
                reject(err);
            });
        });
    }

    return Object.freeze({
        copy: copyValue,
        pRequire,
    });
});
