/*global define*/

define([
    'bluebird',
    'common/runtime'
], (Promise, runtime) => {

    function loadParamsWidget(arg) {
        return new Promise((resolve, reject) => {
            require(['./appParamsWidget'], (Widget) => {
                // TODO: widget should make own bus.
                const bus = runtime.bus().makeChannelBus({ description: 'Parent comm bus for input widget' }),
                    widget = Widget.make({
                        bus: bus,
                        workspaceInfo: arg.workspaceInfo
                    });
                bus.emit('run', {
                    node: arg.node,
                    appSpec: arg.appSpec,
                    parameters: arg.parameters
                });

                bus.on('sync-params', (message) => {
                    message.parameters.forEach((paramId) => {
                        bus.send({
                            parameter: paramId,
                            value: arg.model.getItem(['params', message.parameter])
                        }, {
                            key: {
                                type: 'update',
                                parameter: message.parameter
                            }
                        });
                    });
                });

                bus.on('parameter-sync', (message) => {
                    const value = arg.model.getItem(['params', message.parameter]);
                    bus.send({
                        //                            parameter: message.parameter,
                        value: value
                    }, {
                        // This points the update back to a listener on this key
                        key: {
                            type: 'update',
                            parameter: message.parameter
                        }
                    });
                });

                bus.respond({
                    key: {
                        type: 'get-parameter'
                    },
                    handle: function(message) {
                        return {
                            value: arg.model.getItem(['params', message.parameterName])
                        };
                    }
                });

                bus.on('parameter-changed', (message) => {
                    arg.model.setItem(['params', message.parameter], message.newValue);
                    evaluateAppState();
                });

                return widget.start()
                    .then(() => {
                        resolve({
                            bus: bus,
                            instance: widget
                        });
                    });
            }, (err) => {
                console.log('ERROR', err);
                reject(err);
            });
        });
    }


    function factory(config) {
        let container,
            widget,
            workspaceInfo;

        function start(arg) {
            container = arg.node;
            workspaceInfo = arg.workspaceInfo;

            return loadParamsWidget({
                    node: container,
                    workspaceInfo: arg.workspaceInfo,
                    appSpec: arg.appSpec,
                    parameters: arg.parameters

                })
                .then((result) => {
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
            stop: stop
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };

});
