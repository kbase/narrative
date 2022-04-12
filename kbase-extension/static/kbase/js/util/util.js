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
        const valueType = typeof value;
        switch (valueType) {
            case 'number':
                if (value !== Math.floor(value)) {
                    throw new Error('Integer is a non-integer number');
                }
                return value;
            case 'string':
                if (value.match(/^[-+]?[\d]+$/)) {
                    return parseInt(value, 10);
                }
                throw new Error('Invalid integer format: ' + value);
            default:
                throw new Error('Type ' + valueType + ' cannot be converted to integer');
        }
    }

    function objectToString(obj) {
        const type = Object.prototype.toString.call(obj);
        return type.substring(8, type.length - 1);
    }

    /**
     * Converts a string to a float.
     * If it's not a string (or already a number), this throws an Error.
     * Integers also count here and will be returned unchanged.
     * @param {string|number} value
     * @returns
     */
    function toFloat(value) {
        const valueType = typeof value;
        if (valueType === 'number') {
            return value;
        } else if (valueType === 'string') {
            const number = Number(value);
            if (isNaN(number)) {
                throw new Error('Invalid float format: ' + value);
            }
            return number;
        }
        throw new Error('Type ' + valueType + ' cannot be converted to float');
    }

    return Object.freeze({
        copy: copyValue,
        pRequire,
        toInteger,
        objectToString,
        toFloat,
    });
});
