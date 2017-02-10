define([
    'bluebird',
    'common/runtime',
    'kb_common/html',
    'common/format'
], function (
    Promise,
    Runtime,
    html,
    format
) {
    var t = html.tag,
        span = t('span');

    function factory(config) {
        var config = config || {},
            container,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel('default'),
            clockId = html.genId(),
            startTime;

        function buildLayout() {
            return span({
                id: clockId,
                style: {}
            });
        }

        function renderClock() {
            if (!startTime) {
                return;
            }
            var now = new Date(),
                elapsed = now.getTime() - startTime;

            var clockNode = document.getElementById(clockId);

            if (config.on && config.on.tick) {
                try {
                    var result = config.on.tick(elapsed);
                    clockNode.innerHTML = result.content;
                    if (result.stop) {
                        busConnection.stop();
                    }
                } catch (err) {
                    console.error('Error handling clock tick, closing clock', err);
                    stop();
                }
            } else {
                if (!clockNode) {
                    console.warn('Could not find clock node at' + clockId, 'Stopping the clock');
                    stop();
                    return;
                }
                clockNode.innerHTML = [config.prefix || '', format.niceDuration(elapsed), config.suffix || ''].join('');
            }
        }

        function start(arg) {
            return Promise.try(function () {
                container = arg.node;
                var layout = buildLayout();
                container.innerHTML = layout;

                startTime = arg.startTime;

                channel.on('clock-tick', function () {
                    renderClock();
                });
            });
        }

        function stop() {
            return Promise.try(function () {
                busConnection.stop();
            });
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});