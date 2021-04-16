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
            fileType: the fileType we're looking at
    */
    function ConfigureWidget(options) {
        const model = options.model, // the data model, inputs, params, etc.
            spec = options.spec, // the Spec object
            fileType = options.fileType, // which which filetype we're configuring here
            runtime = Runtime.make(),
            cellBus = options.bus, // the bus to communicate with the main widget
            FILE_PATH_TYPE = 'filePaths',
            PARAM_TYPE = 'params';
        let container = null,
            filePathWidget,
            paramsWidget;

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

                buildFilePathWidget(filePathNode).then((instance) => {
                    events.attachEvents(container);
                    filePathWidget = instance.widget;
                });

                buildParamsWidget(paramNode).then((instance) => {
                    events.attachEvents(container);
                    paramsWidget = instance.widget;
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
            const paramBus = buildMessageBus(fileType, 'Parent comm bus for parameters widget');
            paramBus.on('parameter-changed', (message) => {
                updateModelParameterValue(fileType, PARAM_TYPE, message);
            });

            const widget = ParamsWidget.make({
                bus: paramBus,
                workspaceId: runtime.workspaceId(),
                paramIds: model.getItem(['app', 'otherParamIds', fileType]),
                initialParams: model.getItem(['params', fileType, PARAM_TYPE]),
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
         * @param {string} fileType - which file type app should we be setting parameters for.
         * @param {string} description - description used for the message bus
         * @returns a message bus object
         */
        function buildMessageBus(fileType, description) {
            const bus = runtime.bus().makeChannelBus({ description });

            bus.on('sync-params', (message) => {
                message.parameters.forEach((paramId) => {
                    bus.send(
                        {
                            parameter: paramId,
                            value: model.getItem([fileType, message.parameter]),
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
                const value = model.getItem([fileType, message.parameter]);
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
                        value: model.getItem([fileType, message.parameterName]),
                    };
                },
            });

            return bus;
        }

        /**
         * This evaluates the state of the app configuration. If it's ready to go, then we can
         * build the Python code and prep the app for launch. If not, then we shouldn't, and,
         * in fact, should clear the Python code if there's any there.
         * @param {boolean} fileType - the file type to evaluate app params for
         */
        function evaluateAppConfig(fileType) {
            /* 2 parts.
             * 1 - eval the set of parameters using something in the spec module.
             * 2 - eval the array of file inputs and outputs.
             * If both are up to snuff, we're good.
             */
            const otherParamIds = model.getItem(['app', 'otherParamIds', fileType]),
                paramValues = model.getItem(['params', fileType, PARAM_TYPE]),
                filePathIds = model.getItem(['app', 'fileParamIds', fileType]),
                filePathValues = model.getItem(['params', fileType, FILE_PATH_TYPE]);

            const filePathValidations = filePathValues.map((filePathRow) => {
                return spec.validateParams(filePathIds, filePathRow);
            });
            return Promise.all([
                spec.validateParams(otherParamIds, paramValues),
                ...filePathValidations,
            ]).then((results) => {
                let isValid = true;
                results.forEach((result) => {
                    Object.values(result).forEach((param) => {
                        if (!param.isValid) {
                            isValid = false;
                        }
                    });
                });
                return isValid ? 'complete' : 'incomplete';
            });
        }

        /**
         * Updates the stored parameter value, for the given fileType and parameter type based on
         * the bus message passed by the input widget.
         *
         * This is followed by evaluating the state of the set of inputs for this file type and
         * passing a message to the controller if there's a change.
         * @param {string} fileType - the current filetype this tab is investigating
         * @param {string} paramType - should be either 'param' or 'filePath'
         * @param {object} message - the bus message returned from the widget with a changed
         *  parameter value
         */
        function updateModelParameterValue(fileType, paramType, message) {
            if (paramType === FILE_PATH_TYPE) {
                model.getItem(['params', fileType, FILE_PATH_TYPE])[message.rowIndex][
                    message.parameter
                ] = message.newValue;
            } else {
                model.setItem(['params', fileType, paramType, message.parameter], message.newValue);
            }

            // evaluate the parameter state for the current file type
            return Promise.try(() => {
                if (message.isError) {
                    return 'error';
                }
                return evaluateAppConfig(fileType);
            }).then((state) => {
                const currentState = model.getItem(['state', 'params', fileType]);
                if (currentState !== state) {
                    cellBus.emit('update-param-state', {
                        fileType,
                        state,
                    });
                }
            });
        }

        function stop() {
            const widgetStopPromises = [];
            if (filePathWidget) {
                widgetStopPromises.push(filePathWidget.stop());
            }
            if (paramsWidget) {
                widgetStopPromises.push(paramsWidget.stop());
            }
            return Promise.all(widgetStopPromises).then(() => {
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
