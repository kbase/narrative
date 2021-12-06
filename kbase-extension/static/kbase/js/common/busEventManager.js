define([], () => {
    'use strict';

    function factory(config) {
        let listeners = [];
        const bus = config.bus;

        function add(listenerId) {
            listeners.push(listenerId);
        }

        function remove(listenerId) {
            bus.removeListener(listenerId);
            delete listeners[listenerId];
        }

        function removeAll() {
            listeners.forEach((id) => {
                try {
                    bus.removeListener(id);
                } catch (ex) {
                    // eslint-disable-next-line no-console
                    console.log('Error removing bus listener', ex, id, listeners);
                }
            });
            listeners = [];
        }

        return {
            add,
            remove,
            removeAll,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
