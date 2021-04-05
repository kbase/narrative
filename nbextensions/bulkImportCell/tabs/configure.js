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
        const model = options.model, // the data model, inputs, params, etc.
            spec = options.spec, // the Spec object
            fileType = options.fileType, // which which filetype we're configuring here
            runtime = Runtime.make(),
            cellBus = options.bus, // the bus to communicate with the main widget
            FILE_PATH_TYPE = 'filePaths',
            PARAM_TYPE = 'params';
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
            paramBus.on('parameter-changed', (message) => {
                updateModelParameterValue(paramKey, PARAM_TYPE, message);
            });

            const widget = ParamsWidget.make({
                bus: paramBus,
                workspaceId: runtime.workspaceId(),
                initialParams: model.getItem(['params', paramKey, PARAM_TYPE]),
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
            const paramBus = buildMessageBus(fileType, 'Parent comm bus for filePath widget');
            paramBus.on('parameter-changed', (message) => {
                updateModelParameterValue(fileType, FILE_PATH_TYPE, message);
            });
            paramBus.on('sync-data-model', (message) => {
                if (message.values) {
                    model.setItem(['params', fileType, FILE_PATH_TYPE], message.values);
                }
            });

            /* Here, we need to
             * 1. Get the list of file path params.
             * 2. Get the initial parameters (this will be an array that's serialized in the model right now)
             * 3. Pass those along to the filepathwidget
             */
            // this is an array of parameter ids from the current spec.
            const widget = FilePathWidget.make({
                bus: paramBus,
                workspaceId: runtime.workspaceId(),
                paramIds: model.getItem(['app', 'fileParamIds', fileType]),
                initialParams: model.getItem(['params', fileType, FILE_PATH_TYPE]),
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

        /**
         * This builds a new message bus with commands used for both the filePathWidget and the paramsWidget.
         * Avoids some code duplication. It's up to the individual widget constructors to handle messages for
         * changing data values and any other needed messages.
         * @param {string} paramKey - the key used to look up parameters from the model. Should be the file type.
         * @param {string} description - description used for the message bus
         * @returns a message bus object
         */
        function buildMessageBus(paramKey, description) {
            const bus = runtime.bus().makeChannelBus({ description });

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

            return bus;
        }

        /**
         * TODO
         * This evaluates the state of the app configuration. If it's ready to go, then we can build the Python
         * code and prep the app for launch. If not, then we shouldn't, and, in fact, should clear the Python code
         * if there's any there.
         * @param {boolean} isError - should be truthy if there's currently a known error in the app param formulation
         */
        function evaluateAppConfig(isError) {
            /* 2 parts.
             * 1 - eval the set of parameters using something in the spec module.
             * 2 - eval the array of file inputs and outputs.
             * If both are up to snuff, we're good.
             */
        }

        /**
         *
         * @param {string} paramKey - a string with the parameter key
         * @param {string} paramType - should be either 'param' or 'filePath'
         * @param {object} message -
         */
        function updateModelParameterValue(paramKey, paramType, message) {
            model.setItem(['params', paramKey, paramType, message.parameter], message.newValue);
            // TODO - update the app config state based on changes, and send a message up the cellBus
            // with that state.
            const appState = evaluateAppConfig(message.isError);
        }

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
