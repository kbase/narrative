define(['bluebird', 'common/runtime'], (Promise, runtime) => {
    'use strict';

    function loadParamsWidget(arg) {
        return new Promise((resolve, reject) => {
            require(['./appParamsWidget'], (Widget) => {
                // TODO: widget should make own bus.
                const bus = runtime
                        .bus()
                        .makeChannelBus({ description: 'Parent comm bus for input widget' }),
                    widget = Widget.make({
                        bus: bus,
                    });
                bus.emit('run', {
                    node: arg.node,
                    appSpec: arg.appSpec,
                    parameters: arg.parameters,
                });

                bus.on('sync-params', (message) => {
                    message.parameters.forEach((paramId) => {
                        bus.send(
                            {
                                parameter: paramId,
                                value: arg.model.getItem(['params', message.parameter]),
                            },
                            {
                                key: {
                                    type: 'update',
                                    parameter: message.parameter,
                                },
                            }
                        );
                    });
                });

                bus.on('parameter-sync', (message) => {
                    const value = arg.model.getItem(['params', message.parameter]);
                    bus.send(
                        {
                            value,
                        },
                        {
                            // This points the update back to a listener on this key
                            key: {
                                type: 'update',
                                parameter: message.parameter,
                            },
                        }
                    );
                });

                bus.respond({
                    key: {
                        type: 'get-parameter',
                    },
                    handle: function (message) {
                        return {
                            value: arg.model.getItem(['params', message.parameterName]),
                        };
                    },
                });

                bus.on('parameter-changed', (message) => {
                    arg.model.setItem(['params', message.parameter], message.newValue);
                });

                return widget.start().then(() => {
                    resolve({
                        bus: bus,
                        instance: widget,
                    });
                });
            }, (err) => {
                console.warn('ERROR', err);
                reject(err);
            });
        });
    }

    function factory() {
        let container, widget;

        function start(arg) {
            container = arg.node;

            return loadParamsWidget({
                node: container,
                appSpec: arg.appSpec,
                parameters: arg.parameters,
            }).then((result) => {
                widget = result;
            });
        }

        function stop() {
            return Promise.try(() => {
                if (widget) {
                    return widget.instance.stop();
                }
            });
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: function () {
            return factory();
        },
    };
});
