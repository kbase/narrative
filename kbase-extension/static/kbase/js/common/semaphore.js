define([
    'bluebird'
], function(
    Promise
) {
    'use strict';

    // Ensure semaphore structure is in place when the module is loaded.
    // This is stored in the global environment because it is possible for modules
    // to be reloaded. We don't do this now, but may rely upon this behavior in the
    // future.
    if (!window.__kbase_semaphores__) {
        window.__kbase_semaphores__ = {};
    }


    /*
    The sempahores mechanism has a functional interface.
    */

    function factory(config) {
        function add(name, initialValue) {
            window.__kbase_semaphores__[name] = initialValue || null;
        }

        function set(name, value) {
            window.__kbase_semaphores__[name] = value;
        }

        function get(name, defaultValue) {
            var value = window.__kbase_semaphores__[name];
            if (value === undefined) {
                return defaultValue;
            }
            return value;
        }

        function remove(name) {
            delete window.__kbase_semaphores__[name];
        }

        function when(name, value, timeout) {
            var startTime = new Date().getTime();
            return new Promise(function (resolve, reject) {
                function waiter() {
                    var elapsed = new Date().getTime() - startTime;
                    if (elapsed > timeout) {
                        reject(new Error('Timed out waiting for semaphore "' + name + '" with value "' + value + '"'));
                        return;
                    }
                    if (get(name) === value) {
                        resolve();
                        return;
                    }
                    window.setTimeout(function () {
                        waiter();
                    }, 100);
                }
                waiter();
            });
        }

        return Object.freeze({
            add: add,
            set: set,
            remove: remove,
            when: when
        });
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});
