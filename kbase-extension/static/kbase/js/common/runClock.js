define(['bluebird', 'common/runtime', 'common/html', 'common/format'], (
    Promise,
    Runtime,
    html,
    format
) => {
    'use strict';
    const t = html.tag,
        span = t('span');

    function factory(config = {}) {
        const runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel('default'),
            clockId = html.genId();
        let container,
            startTime;

        function buildLayout() {
            return span({
                id: clockId,
            });
        }

        function renderClock() {
            if (!startTime) {
                return;
            }
            const now = new Date(),
                elapsed = now.getTime() - startTime,
                clockNode = document.getElementById(clockId);

            if (config.on && config.on.tick) {
                try {
                    const result = config.on.tick(elapsed);
                    clockNode.innerHTML = result.content;
                    if (result.stop) {
                        busConnection.stop();
                    }
                } catch (err) {
                    console.error('Error handling clock tick, closing clock', err);
                    stop();
                }
                return;
            }

            if (!clockNode) {
                console.warn(`Could not find clock node at ${clockId}: stopping the clock.`);
                stop();
                return;
            }
            clockNode.innerHTML = [
                config.prefix || '',
                format.niceDuration(elapsed),
                config.suffix || '',
            ].join('');
        }

        function start(arg) {
            return Promise.try(() => {
                container = arg.node;
                const layout = buildLayout();
                container.innerHTML = layout;

                startTime = arg.startTime;

                channel.on('clock-tick', () => {
                    renderClock();
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                busConnection.stop();
            });
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
