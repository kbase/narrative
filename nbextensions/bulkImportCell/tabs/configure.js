define([
    'bluebird',
    'narrativeConfig',
    'common/events',
    'common/runtime',
    'common/html',
    'common/ui',
    '../fileTypePanel',
    'common/cellComponents/paramsWidget',
    'common/cellComponents/filePathWidget',
], (Promise, Config, Events, Runtime, html, UI, FileTypePanel, ParamsWidget, FilePathWidget) => {
    'use strict';

    /*
        Options:
            bus: message bus
            model: cell metadata
            spec: app spec
            fileType: the fileType we're looking at
    */
    function ConfigureWidget(options) {
        const { model, specs, typesToFiles } = options;
        const cellBus = options.bus,
            runtime = Runtime.make(),
            FILE_PATH_TYPE = 'filePaths',
            PARAM_TYPE = 'params',
            cssBaseClass = 'kb-bulk-import-configure';
        let container = null,
            filePathWidget,
            paramsWidget,
            fileTypePanel,
            selectedFileType = model.getItem('state.selectedFileType');

        /**
         * args includes:
         *  - node - the DOM node to act as this widget's container
         * @param {object} args
         */
        function start(args) {
            return Promise.try(() => {
                container = args.node;
                const ui = UI.make({ node: container });

                const events = Events.make();
                const layout = renderLayout();
                container.innerHTML = layout;

                const filePathNode = ui.getElement('input-container.file-paths');
                const paramNode = ui.getElement('input-container.params');
                const fileTypeNode = ui.getElement('filetype-panel');
                const appSpec = specs[typesToFiles[selectedFileType].appId];
                const initPromises = [
                    buildFilePathWidget(filePathNode, appSpec).then((instance) => {
                        events.attachEvents(container);
                        filePathWidget = instance.widget;
                    }),
                    buildParamsWidget(paramNode, appSpec).then((instance) => {
                        events.attachEvents(container);
                        paramsWidget = instance.widget;
                    }),
                    buildFileTypePanel(fileTypeNode),
                ];

                return Promise.all(initPromises);
            });
        }

        function renderLayout() {
            const div = html.tag('div');
            return div(
                {
                    class: `${cssBaseClass}__container`,
                },
                [
                    div({
                        class: `${cssBaseClass}__filetype_panel`,
                        dataElement: 'filetype-panel',
                    }),
                    div(
                        {
                            class: `${cssBaseClass}__inputs`,
                            dataElement: 'input-container',
                        },
                        [
                            div({
                                class: `${cssBaseClass}__file_paths`,
                                dataElement: 'file-paths',
                            }),
                            div({
                                class: `${cssBaseClass}__params`,
                                dataElement: 'params',
                            }),
                        ]
                    ),
                ]
            );
        }

        /**
         * This builds the file type panel (the left column) of the cell and starts
         * it up attached to the given DOM node.
         * @param {DOMElement} node - the node that should be used for the left column
         */
        function buildFileTypePanel(node) {
            const fileTypesDisplay = {},
                fileTypeMapping = {},
                uploaders = Config.get('uploaders');
            for (const uploader of uploaders.dropdown_order) {
                fileTypeMapping[uploader.id] = uploader.name;
            }
            for (const fileType of Object.keys(typesToFiles)) {
                fileTypesDisplay[fileType] = {
                    label: fileTypeMapping[fileType] || `Unknown type "${fileType}"`,
                };
            }
            fileTypePanel = FileTypePanel.make({
                bus: cellBus,
                header: {
                    label: 'Data type',
                    icon: 'icon icon-genome',
                },
                fileTypes: fileTypesDisplay,
                toggleAction: toggleFileType,
            });
            return fileTypePanel.start({
                node: node,
                state: selectedFileType,
            });
        }

        /**
         * This toggles which file type should be shown. This sets the
         * fileType state, then updates the rest of the cell state to modify
         * which set of tabs should be active.
         *
         * Toggling the filetype also toggles the active tab to ensure it
         * has the selected file type.
         * @param {string} fileType - the file type that should be shown
         */
        function toggleFileType(fileType) {
            // alert(`new filetype: ${fileType}`);
            if (model.getItem('state.selectedFileType') === fileType) {
                return; // do nothing if we're toggling to the same fileType
            }
            selectedFileType = fileType;
            // stop and start the widgets.

            // if (state.fileType.selected === fileType) {
            //     return; // do nothing if we're toggling to the same fileType
            // }
            // state.fileType.selected = fileType;
            // // stop existing tab widget
            // // restart it with the new filetype
            // toggleTab(state.tab.selected, fileType);
            // updateState();
        }

        /*
            node: container node to build the widget into

            This is more or less copied over from the way that the appCell handles building the widget.
            This model assumes one instance of the params widget per cell, so may need some adjustment as
            we make the bulk import work with multiple data types
        */
        function buildParamsWidget(node, spec) {
            const paramBus = buildMessageBus(
                selectedFileType,
                'Parent comm bus for parameters widget'
            );
            paramBus.on('parameter-changed', (message) => {
                updateModelParameterValue(selectedFileType, PARAM_TYPE, message);
            });

            const widget = ParamsWidget.make({
                bus: paramBus,
                workspaceId: runtime.workspaceId(),
                paramIds: model.getItem(['app', 'otherParamIds', selectedFileType]),
                initialParams: model.getItem(['params', selectedFileType, PARAM_TYPE]),
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

        function buildFilePathWidget(node, spec) {
            // This is the key in the model that maps to the list of params for the current app.
            const paramBus = buildMessageBus(
                selectedFileType,
                'Parent comm bus for filePath widget'
            );
            paramBus.on('parameter-changed', (message) => {
                updateModelParameterValue(selectedFileType, FILE_PATH_TYPE, message);
            });

            paramBus.on('sync-data-model', (message) => {
                if (message.values) {
                    model.setItem(['params', selectedFileType, FILE_PATH_TYPE], message.values);
                    updateAppConfigState();
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
                paramIds: model.getItem(['app', 'fileParamIds', selectedFileType]),
                initialParams: model.getItem(['params', selectedFileType, FILE_PATH_TYPE]),
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

            bus.on('invalid-param-value', () => {
                updateAppConfigState(true);
            });

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
         * Updates the configuration state for the currently loaded app. If the state has
         * changed from what's in the current model, this emits a message up the cellBus.
         * @param {boolean} isError
         * @returns Promise that resolves when finished sending a message (if relevant).
         */
        function updateAppConfigState(isError) {
            // evaluate the parameter state for the current file type
            return Promise.try(() => {
                if (isError) {
                    return 'error';
                }
                return evaluateAppConfig();
            }).then((state) => {
                const currentState = model.getItem(['state', 'params', selectedFileType]);
                if (currentState !== state) {
                    cellBus.emit('update-param-state', {
                        selectedFileType,
                        state,
                    });
                }
            });
        }

        /**
         * This evaluates the state of the app configuration. If it's ready to go, then we can
         * build the Python code and prep the app for launch. If not, then we shouldn't, and,
         * in fact, should clear the Python code if there's any there.
         * @returns a Promise that resolves into either 'complete' or 'incomplete' strings,
         * based on the config state.
         */
        function evaluateAppConfig() {
            /* 2 parts.
             * 1 - eval the set of parameters using something in the spec module.
             * 2 - eval the array of file inputs and outputs.
             * If both are up to snuff, we're good.
             */
            const otherParamIds = model.getItem(['app', 'otherParamIds', selectedFileType]),
                paramValues = model.getItem(['params', selectedFileType, PARAM_TYPE]),
                filePathIds = model.getItem(['app', 'fileParamIds', selectedFileType]),
                filePathValues = model.getItem(['params', selectedFileType, FILE_PATH_TYPE]),
                spec = specs[typesToFiles[selectedFileType].appId];

            // must have at least one file row of file paths to be complete
            if (filePathValues.length === 0) {
                return Promise.resolve('incomplete');
            }
            const filePathValidations = filePathValues.map((filePathRow) => {
                return spec.validateParams(filePathIds, filePathRow);
            });
            return Promise.all([
                spec.validateParams(otherParamIds, paramValues),
                ...filePathValidations,
            ]).then((results) => {
                const isValid = results.every((result) => {
                    return Object.values(result).every((param) => param.isValid);
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

            return updateAppConfigState(message.isError);
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
