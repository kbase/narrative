define([
    'bluebird',
    'common/events',
    'common/runtime',
    'common/cellComponents/paramsWidget',
    'common/cellComponents/filePathWidget',
], (Promise, Events, Runtime, ParamsWidget, FilePathWidget) => {
    'use strict';

    /*
        Options:
            bus: message bus
            model: cell metadata
            spec: app spec
    */
    function ConfigureWidget(options) {
        const model = options.model,
            spec = options.spec,
            fileType = options.fileType,
            runtime = Runtime.make(),
            cellBus = options.bus;

        let container = null;

        /**
         * args includes:
         *  - node - the DOM node to act as this widget's container
         * @param {object} args
         */
        function start(args) {
            return Promise.try(() => {
                container = args.node;

                const events = Events.make();

                const filePathNode = document.createElement('div');
                container.appendChild(filePathNode);

                const paramNode = document.createElement('div');
                container.appendChild(paramNode);

                buildFilePathWidget(filePathNode).then(() => {
                    events.attachEvents(container);
                });

                buildParamsWidget(paramNode).then(() => {
                    events.attachEvents(container);
                });
            });
        }

        /*
            node: container node to build the widget into

            This is more or less copied over from the way that the appCell handles building the widget.
            This model assumes one instance of the params widget per cell, so may need some adjustment as
            we make the bulk import work with multiple data types
        */
        function buildParamsWidget(node) {
            // This is the key in the model that maps to the list of params for the current app.
            const paramKey = `${fileType}`;
            const paramBus = buildMessageBus(paramKey, 'Parent comm bus for parameters widget');

            const widget = ParamsWidget.make({
                bus: paramBus,
                workspaceId: runtime.workspaceId(),
                initialParams: model.getItem(['params', paramKey]),
            });

            return widget
                .start({
                    node: node,
                    appSpec: model.getItem('app.spec'),
                    parameters: spec.getSpec().parameters,
                })
                .then(() => {
                    return {
                        bus: paramBus,
                        instance: widget,
                    };
                });
        }

        function buildFilePathWidget(node) {
            // This is the key in the model that maps to the list of params for the current app.
            const paramKey = `${fileType}`;
            const paramBus = buildMessageBus(paramKey, 'Parent comm bus for filePath widget');

            const widget = FilePathWidget.make({
                bus: paramBus,
                workspaceId: runtime.workspaceId(),
                initialParams: model.getItem(['params', paramKey]),
            });

            return widget
                .start({
                    node: node,
                    appSpec: model.getItem('app.spec'),
                    parameters: spec.getSpec().parameters,
                })
                .then(() => {
                    return {
                        bus: paramBus,
                        instance: widget,
                    };
                });
        }

        function buildMessageBus(paramKey, description) {
            const bus = runtime
                .bus()
                .makeChannelBus({ description: description });

                bus.on('sync-params', (message) => {
                    message.parameters.forEach((paramId) => {
                        bus.send(
                            {
                                parameter: paramId,
                                value: model.getItem([paramKey, message.parameter]),
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
                    const value = model.getItem([paramKey, message.parameter]);
                    bus.send(
                        {
                            value: value,
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

                bus.on('set-param-state', (message) => {
                    model.setItem('paramState', message.id, message.state);
                });

                bus.respond({
                    key: {
                        type: 'get-param-state',
                    },
                    handle: function (message) {
                        return {
                            state: model.getItem('paramState', message.id),
                        };
                    },
                });

                bus.respond({
                    key: {
                        type: 'get-parameter',
                    },
                    handle: function (message) {
                        return {
                            value: model.getItem([paramKey, message.parameterName]),
                        };
                    },
                });

                //TODO: disabling for now until we figure out what to do about state
                bus.on('parameter-changed', (message) => {
                    // TODO: should never get these in the following states....
                    console.log('GOT PARAMETER CHANGED MESSAGE - ' + JSON.stringify(message));
                    updateModelParameterValue(paramKey, message.parameter, message.newValue);

                    // const state = fsm.getCurrentState().state,
                    //     isError = Boolean(message.isError);
                    // if (state.mode === 'editing') {
                    //     model.setItem(['params', message.parameter], message.newValue);
                    //     evaluateAppState(isError);
                    // } else {
                    //     console.warn('parameter-changed event detected when not in editing mode - ignored');
                    // }
                });
            return bus;
        }

        function updateModelParameterValue(paramKey, param, newValue) {
            model.setItem(['params', paramKey, param], newValue);
        };

        function stop() {
            return Promise.try(() => {
                container.innerHTML = '';
            });
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: ConfigureWidget,
    };
});
