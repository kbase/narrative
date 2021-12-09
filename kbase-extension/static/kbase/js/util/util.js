/**
 * A collection of general utility functions that don't fit well anywhere else.
 */
define(['bluebird'], (Promise) => {
    'use strict';

    /**
     * Copies an object so that it occupies a separate memory space. That is,
     * modifying the copied object does not modify the original.
     * @param {*} obj
     * @returns the copied object
     */
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

    /**
     * Converts a string to an integer.
     * If it's not a string (or an integer already), this throws an Error.
     * Floats are not reduced into integers, unless the decimal part === 0.
     * @param {string|number} value
     * @returns {number} the integer version of the value.
     * @throws {Error} an error if:
     * - the value is a non-integer number,
     * - if the value is a non-int-parseable string,
     * - if value is anything else (like an Array or Object)
     */
    function toInteger(value) {
        switch (typeof value) {
            case 'number':
                if (value !== Math.floor(value)) {
                    throw new Error('Integer is a non-integer number');
                }
                return value;
            case 'string':
                if (value.match(/^[-+]?[\d]+$/)) {
                    return parseInt(value, 10);
                }
                throw new Error('Invalid integer format');
            default:
                throw new Error('Type ' + typeof value + ' cannot be converted to integer');
        }
    }

    return Object.freeze({
        copy: copyValue,
        pRequire,
        toInteger,
    });
});
