/*global define*/
/*jslint white:true,browser:true */

define([
], function () {
    'use strict';

    // Static methods
    function isArray(testValue) {
        return (testValue instanceof Array);
    }

    function isNumber(testValue) {
        return (typeof testValue === 'number');
    }


    function setDataItem(data, path, value) {
        if (typeof path === 'string') {
            path = path.split('.');
        } else if (!isArray(path)) {
            throw new TypeError('Invalid type for key: ' + (typeof path));
        }
        if (path.length === 0) {
            return;
        }
        // pop off the last property for setting at the end.
        var propKey = path.pop(),
            key, temp = data;
        // Walk the path, creating empty objects if need be.
        while (path.length > 0) {
            key = path.shift();
            if (temp[key] === undefined) {
                temp[key] = {};
            }
            temp = temp[key];
        }
        // Finally set the property.
        temp[propKey] = value;
        return value;
    }

    function pushDataItem(data, path, value) {
        if (typeof path === 'string') {
            path = path.split('.');
        } else if (!isArray(path)) {
            throw new TypeError('Invalid type for key: ' + (typeof path));
        }
        if (path.length === 0) {
            return;
        }
        // pop off the last property for setting at the end.
        var propKey = path.pop(),
            key, temp = data;
        // Walk the path, creating empty objects if need be.
        while (path.length > 0) {
            key = path.shift();
            if (temp[key] === undefined) {
                temp[key] = {};
            }
            temp = temp[key];
        }
        if (temp[propKey] === undefined) {
            temp[propKey] = [];
        }
        temp = temp[propKey];
        // Finally set the property.        
        
        if (typeof temp === 'object' && temp.push) {
            temp.push(value);            
        }
    }

    function getDataItem(data, path, defaultValue) {
        if (typeof path === 'string') {
            path = path.split('.');
        } else if (!isArray(path)) {
            throw new TypeError('Invalid type for key: ' + (typeof path));
        }
        var i, temp = data;
        for (i = 0; i < path.length; i += 1) {
            if ((temp === undefined) ||
                (typeof temp !== 'object') ||
                (temp === null)) {
                return defaultValue;
            }
            temp = temp[path[i]];
        }
        if (temp === undefined) {
            return defaultValue;
        }
        return temp;
    }

    function popDataItem(data, path, defaultValue) {
        if (typeof path === 'string') {
            path = path.split('.');
        } else if (!isArray(path)) {
            throw new TypeError('Invalid type for key: ' + (typeof path));
        }
        var i, temp = data;
        for (i = 0; i < path.length; i += 1) {
            if ((temp === undefined) ||
                (typeof temp !== 'object') ||
                (temp === null)) {
                return defaultValue;
            }
            temp = temp[path[i]];
        }
        if (temp === undefined) {
            return defaultValue;
        }
        if (typeof temp === 'object' && temp.pop) {
            return temp.pop();
        } else {
            throw new Error('Attempting to pop a non-array item');
        }
    }

    function factory(config) {
        if (!config) {
            config = {};
        }
        var obj = config.data || {},
            lastObj,
            historyCount = 0,
            updateHandler = config.onUpdate,
            historyEnabled = updateHandler ? true : false,
            lastValueSaved = false, timer, api;

        /*
         * In enabled by setting an update handler via the onUpdate factory 
         * configuration property, this function should be run whenever the
         * property is updated. It will then run the update handler callback.
         * This is a way to enable essentially synchronization of the props
         * object with some external data source.
         */
        function run() {
            if (!updateHandler) {
                return;
            }
            if (timer) {
                return;
            }

            timer = window.setTimeout(function () {
                try {
                    timer = null;
                    if (historyEnabled) {
                        resetHistory();
                    }
                    updateHandler(api);
                } catch (ex) {
                    console.error('ERROR in props updateHandler', ex);
                }
            }, 0);
        }

        function getHistoryCount() {
            if (!historyEnabled) {
                return;
            }
            return historyCount;
        }
        function ensureHistory() {
            if (!historyEnabled) {
                return;
            }
            if (lastValueSaved) {
                return;
            }
            historyCount += 1;
            lastObj = JSON.parse(JSON.stringify(obj));
            lastValueSaved = true;
        }
        function resetHistory() {
            if (!historyEnabled) {
                return;
            }
            lastValueSaved = false;
        }


        function getItem(props, defaultValue) {
            return getDataItem(obj, props, defaultValue);
        }

        function copyItem(props, defaultValue) {
            var item = getItem(props, defaultValue);
            if (item !== undefined) {
                return JSON.parse(JSON.stringify(item));
            }
        }

        function hasItem(propPath) {
            if (typeof propPath === 'string') {
                propPath = propPath.split('.');
            }
            var i, temp = obj;
            for (i = 0; i < propPath.length; i += 1) {
                if ((temp === undefined) ||
                    (typeof temp !== 'object') ||
                    (temp === null)) {
                    return false;
                }
                temp = temp[propPath[i]];
            }
            if (temp === undefined) {
                return false;
            }
            return true;
        }


        function setItem(path, value) {
            ensureHistory();
            setDataItem(obj, path, value);
            run();
        }
        
        function pushItem(path, value) {
            ensureHistory();
            pushDataItem(obj, path, value);
            run();
        }
        
        function popItem(path, defaultValue) {
            ensureHistory();
            return popDataItem(obj, path, defaultValue);
            run();
        }
        
        function reset() {
            resetHistory();
            obj = {};
            run();
        }

        function incrItem(path, increment) {
            if (typeof path === 'string') {
                path = path.split('.');
            }
            if (path.length === 0) {
                return;
            }
            increment = (increment === undefined) ? 1 : increment;
            var propKey = path.pop(),
                key, temp = obj;
            while (path.length > 0) {
                key = path.shift();
                if (temp[key] === undefined) {
                    temp[key] = {};
                }
                temp = temp[key];
            }
            ensureHistory();
            if (temp[propKey] === undefined) {
                temp[propKey] = increment;
            } else {
                if (isNumber(temp[propKey])) {
                    temp[propKey] += increment;
                } else {
                    throw new Error('Can only increment a number');
                }
            }
            run();
            return temp[propKey];
        }

//        function pushItem(path, value) {
//            if (typeof path === 'string') {
//                path = path.split('.');
//            }
//            if (path.length === 0) {
//                return;
//            }
//            var propKey = path.pop(),
//                key, temp = obj;
//            while (path.length > 0) {
//                key = path.shift();
//                if (temp[key] === undefined) {
//                    temp[key] = {};
//                }
//                temp = temp[key];
//            }
//            ensureHistory();
//            if (temp[propKey] === undefined) {
//                temp[propKey] = [value];
//            } else {
//                if (temp[propKey])
//                    if (isArray(temp[propKey])) {
//                        temp[propKey].push(value);
//                    } else {
//                        throw new Error('Can only push onto an Array');
//                    }
//            }
//            run();
//            return temp[propKey];
//        }

        function deleteItem(path) {
            if (typeof path === 'string') {
                path = path.split('.');
            }
            if (path.length === 0) {
                return;
            }
            var propKey = path.pop(),
                key, temp = obj;
            while (path.length > 0) {
                key = path.shift();
                if (temp[key] === undefined) {
                    return false;
                }
                temp = temp[key];
            }
            ensureHistory();
            delete temp[propKey];
            run();
            return true;
        }

        api = {
            setItem: setItem,
            hasItem: hasItem,
            getItem: getItem,
            copyItem: copyItem,
            incrItem: incrItem,
            deleteItem: deleteItem,
            pushItem: pushItem,
            popItem: popItem,
            reset: reset,
            getRawObject: function () {
                return obj;
            },
            getLastRawObject: function () {
                return lastObj;
            },
            getHistoryCount: getHistoryCount
        };
        return api;
    }

    return {
        make: function (config) {
            return factory(config);
        },
        getDataItem: getDataItem,
        setDataItem: setDataItem,
        pushDataItem: pushDataItem,
        popDataItem: popDataItem
    };
});