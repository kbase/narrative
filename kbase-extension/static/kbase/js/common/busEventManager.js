/*global define*/
/*jslint white:true,browser:true*/

define([
], function () {
    function factory(config) {
        var listeners = [],
            bus = config.bus;
        function add(listenerId) {
            listeners.push(listenerId);
        }
        function remove(listenerId) {
            bus.removeListener(listenerId);
            delete listeners[listenerId];
        }
        function removeAll() {
            listeners.forEach(function (id) {
                try {
                    bus.removeListener(id);
                } catch (ex) {
                    console.log('Error removing bus listener', ex, id, listeners);
                }
            });
            listeners = [];
        }
        return {
            add: add,
            remove: remove,
            removeAll: removeAll
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});