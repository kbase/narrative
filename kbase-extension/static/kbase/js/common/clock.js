define([], () => {
    'use strict';
    function factory(config) {
        let timer, ticks;
        const { resolution } = config,
            { bus } = config;

        function start() {
            ticks = 0;
            timer = window.setInterval(() => {
                ticks += 1;
                bus.emit('clock-tick', {
                    resolution: resolution,
                    count: ticks,
                });
            }, resolution);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
