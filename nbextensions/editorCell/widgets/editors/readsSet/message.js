define(['bluebird'], (Promise) => {
    'use strict';

    function factory() {
        let hostNode, container;

        function start(arg) {
            return Promise.try(() => {
                hostNode = arg.node;
                container = hostNode.appendChild(document.createElement('div'));
                container.innerHTML = arg.content;
            });
        }

        function stop() {
            return Promise.try(() => {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                }
            });
        }

        return Object.freeze({
            start: start,
            stop: stop,
        });
    }

    return {
        make: function () {
            return factory();
        },
    };
});
