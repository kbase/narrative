define([
    'bluebird',
    'narrativeConfig',
    'common/runtime',
    'common/html',
    'common/ui',
    './fileTypePanel',
    'common/cellComponents/paramsWidget',
    'common/cellComponents/filePathWidget',
    '../util',
], (Promise, Config, Runtime, html, UI, FileTypePanel, ParamsWidget, FilePathWidget, Util) => {
    'use strict';

    /**
     * This widget is responsible for providing an interactive interface for setting the
     * inputs and parameters for each of the bulk import apps.
     *
     * It maintains the state of:
     *   - parameters
     *   - currently shown app info (by file type)
     * It sends messages to the bulk import cell when the global configuration ready state
     * has changed. So if we transfer from globally not ready -> ready to run (and vice-versa),
     * it sends a message.
     * It also updates the cell model with changes to the set of app parameters.
     * @param {object} options has keys:
     *     bus: message bus
     *     model: cell metadata, contains such fun items as the app parameters and state
     *     specs: app specs, keyed by their app id
     *     typesToFiles: map from object type to appId and list of input files,
     *     viewOnly: boolean - if true, then will start child widgets in view only mode
     * @returns
     */
    function ConfigureWidget(options) {
        const viewOnly = options.viewOnly || false;
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
            selectedFileType = model.getItem('state.selectedFileType'),
            ui;

        /**
         * args includes:
         *  - node - the DOM node to act as this widget's container
         * @param {object} args
         */
        function start(args) {
            return Promise.try(() => {
                container = args.node;
                ui = UI.make({ node: container });

                const layout = renderLayout();
                container.innerHTML = layout;

                const fileTypeNode = ui.getElement('filetype-panel');
                const initPromises = [buildFileTypePanel(fileTypeNode), startInputWidgets()];

                return Promise.all(initPromises);
            });
        }

        function startInputWidgets() {
            const appSpec = specs[typesToFiles[selectedFileType].appId];
            const filePathNode = ui.getElement('input-container.file-paths');
            const paramNode = ui.getElement('input-container.params');
            return Promise.all([
                buildFilePathWidget(filePathNode, appSpec).then((instance) => {
                    filePathWidget = instance.widget;
                }),
                buildParamsWidget(paramNode, appSpec).then((instance) => {
                    paramsWidget = instance.widget;
                }),
            ]);
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
            const state = getFileTypeState();

            return fileTypePanel.start({
                node,
                state,
            });
        }

        /**
         *
         * @returns {Object} with keys:
         *   - selected {String} the selected file type
         *   - completed
         */
        function getFileTypeState() {
            const fileTypeCompleted = {};
            const fileTypeState = model.getItem('state.params', {});
            for (const [fileType, status] of Object.entries(fileTypeState)) {
                fileTypeCompleted[fileType] = status === 'complete';
            }
            return {
                selected: selectedFileType,
                completed: fileTypeCompleted,
            };
        }

        /**
         * This toggles the active file type to the new type. It stores this in
         * the cell state, then resets the input widgets to display parameters for
         * the newly set app.
         * @param {string} fileType - the file type that should be shown
         */
        function toggleFileType(fileType) {
            if (model.getItem('state.selectedFileType') === fileType) {
                return; // do nothing if we're toggling to the same fileType
            }
            selectedFileType = fileType;
            fileTypePanel.updateState(getFileTypeState());
            model.setItem('state.selectedFileType', fileType);
            // stop and start the widgets.
            return stopInputWidgets().then(startInputWidgets());
        }

        /**
         * This shows the parameters widget - the inputs for the singleton set of parameters
         * that get applied to every job in the bulk run.
         * @param {DOMElement} node the container node for the widget
         * @param {object} spec the app spec with parameters we want to show
         * @returns {object} keys:
         *   bus - the message bus created for this widget
         *   instance - the created widget
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
                viewOnly,
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
         * This shows the file path widget - the inputs for the file paths that get populated - one
         * row for each job that gets run.
         * @param {DOMElement} node the container node for the widget
         * @param {object} spec the app spec with parameters we want to show
         * @returns {object} keys:
         *   bus - the message bus created for this widget
         *   instance - the created widget
         */
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
                viewOnly,
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
         * changed from what's in the current model, this updates it and sends a message
         * up the cellBus.
         *
         * @param {boolean} isError
         * @returns Promise that resolves when finished sending a message (if relevant).
         */
        function updateAppConfigState(isError) {
            // evaluate the parameter state for the current file type
            return Promise.try(() => {
                if (isError) {
                    return 'error';
                }
                const paramIds = model.getItem(['app', 'otherParamIds', selectedFileType]),
                    paramValues = model.getItem(['params', selectedFileType, PARAM_TYPE]),
                    filePathIds = model.getItem(['app', 'fileParamIds', selectedFileType]),
                    filePathValues = model.getItem(['params', selectedFileType, FILE_PATH_TYPE]),
                    spec = specs[typesToFiles[selectedFileType].appId];
                return Util.evaluateAppConfig(
                    paramIds,
                    paramValues,
                    filePathIds,
                    filePathValues,
                    spec
                );
            }).then((state) => {
                const currentState = model.getItem(['state', 'params', selectedFileType]);
                if (currentState !== state) {
                    model.setItem(['state', 'params', selectedFileType], state);
                    const fileTypeState = getFileTypeState();
                    fileTypePanel.updateState(fileTypeState);
                    const paramsReady = Object.values(fileTypeState.completed).reduce(
                        (prev, cur) => {
                            return cur && prev;
                        },
                        true
                    );
                    cellBus.emit('update-param-state', {
                        paramsReady,
                    });
                }
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

        function stopInputWidgets() {
            const widgetStopPromises = [];
            if (filePathWidget) {
                widgetStopPromises.push(filePathWidget.stop());
            }
            if (paramsWidget) {
                widgetStopPromises.push(paramsWidget.stop());
            }
            return Promise.all(widgetStopPromises);
        }

        function stop() {
            return stopInputWidgets().then(() => {
                container.innerHTML = '';
            });
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        // wrapper to make a widget in edit mode
        editMode: {
            make: (options) => {
                return ConfigureWidget(Object.assign({}, options, { viewOnly: false }));
            },
        },
        // wrapper to make a widget in view mode
        viewMode: {
            make: (options) => {
                return ConfigureWidget(Object.assign({}, options, { viewOnly: true }));
            },
        },
        // the standard constructor, let the caller manually decide which mode to use
        make: ConfigureWidget,
    };
});
