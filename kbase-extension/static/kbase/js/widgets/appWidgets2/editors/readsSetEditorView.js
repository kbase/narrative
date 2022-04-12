define(['jquery', 'bluebird'], ($, Promise) => {
    'use strict';

    function factory(config) {
        let container,
            parentBus = config.bus;

        function start(args) {
            container = args.node;
            return Promise.try(() => {
                container.innerHTML = 'I am a reads set editor viewer. Hi.';
                container.innerHTML +=
                    '<iframe width="854" height="480" src="https://www.youtube.com/embed/6ql7HAUzU7U" frameborder="0" allowfullscreen></iframe>';
            });
        }

        function stop() {
            return Promise.try(() => {});
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: factory,
    };
});
