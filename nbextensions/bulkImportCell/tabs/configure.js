define([
    'bluebird',
    'common/runtime',
    'common/html',
    'common/ui',
    './fileTypePanel',
    'common/cellComponents/paramsWidget',
    'common/cellComponents/filePathWidget',
    'util/appCellUtil',
], (Promise, Runtime, html, UI, FileTypePanel, ParamsWidget, FilePathWidget, Util) => {
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
     *     fileTypesDisplay: mapping of file type to display label
     *     typesToFiles: map from object type to appId, list of input files, and messages,
     *       if applicable
     *       appId: string
     *       files: array of strings
     *       messages: (optional) array of objects with keys: type and message (both strings)
     *     viewOnly: boolean - if true, then will start child widgets in view only mode
     * @returns
     */
    function ConfigureWidget(options) {
        const viewOnly = options.viewOnly || false;
        const { model, specs, fileTypesDisplay, typesToFiles } = options;
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
            unavailableFiles,
            ui,
            running = false;

        /**
         * args includes:
         *  - node - the DOM node to act as this widget's container
         * @param {object} args
         */
        function start(args) {
            const allFiles = new Set();
            Object.values(typesToFiles).forEach((entry) => {
                for (const file of entry.files) {
                    allFiles.add(file);
                }
            });
            return Util.getMissingFiles(Array.from(allFiles))
                .catch((error) => {
                    // if the missing files call fails, just continue and let the cell render.
                    console.error('Unable to get missing files from the Staging Service', error);
                })
                .then((missingFiles = []) => {
                    unavailableFiles = new Set(missingFiles);
                    // Do a validation for all input parameters on all file types
                    // This is then sent to the fileTypePanel to initialize properly with
                    // pass or fail for each side, to properly render pass or fail icons.
                    return Util.evaluateConfigReadyState(model, specs, unavailableFiles);
                })
                .then((readyState) => {
                    container = args.node;
                    ui = UI.make({ node: container });

                    const layout = renderLayout();
                    container.innerHTML = layout;

                    const fileTypeNode = ui.getElement('filetype-panel');
                    const initPromises = [
                        buildFileTypePanel(fileTypeNode, readyState),
                        startInputWidgets(),
                    ];
                    showConfigMessage();
                    running = true;
                    return Promise.all(initPromises);
                });
        }

        /**
         * Returns the output parameter values from the unselected file types,
         * which will make it easier to look for duplicate values against the active file
         * type.
         *
         * Since this is focused on being used for duplicate values, with a row to point
         * to, it gets structured like this:
         * {
         *   value1: {
         *     fileType: [rows],
         *     fileType2: [rows]
         *   },
         *   value2: {
         *     fileType: [rows]
         *   }
         * }
         *
         * The `fileType` fields above are the display name, just to make writing the alerts
         * easier. This does come with the assumption that those names are all unique,
         * but they really should be unless we want to be extra confusing to our users.
         *
         * Nulls, undefineds, and empty strings are ignored.
         */
        function getUnselectedOutputValues() {
            const unselectedTypes = new Set(Object.keys(typesToFiles));
            if (unselectedTypes.size === 1) {
                return {}; // skip everything if there's only one file type
            }

            const unselectedOutputValues = {};
            unselectedTypes.delete(selectedFileType);
            const allParams = model.getItem('params');
            const allOutputParamIds = model.getItem('app.outputParamIds');
            unselectedTypes.forEach((type) => {
                const outputParamIds = allOutputParamIds[type];
                for (let i = 0; i < allParams[type].filePaths.length; i++) {
                    outputParamIds.forEach((paramId) => {
                        const value = allParams[type].filePaths[i][paramId];
                        if (!value) {
                            return;
                        }
                        if (!(value in unselectedOutputValues)) {
                            unselectedOutputValues[value] = {};
                        }
                        const displayType = fileTypesDisplay[type].label;
                        if (!(displayType in unselectedOutputValues[value])) {
                            unselectedOutputValues[value][displayType] = [];
                        }
                        unselectedOutputValues[value][displayType].push(i + 1);
                    });
                }
            });
            return unselectedOutputValues;
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

        /**
         * Shows a message at the top of the configuration panel, based on current information.
         * Currently only supports a warning that there are multiple parameter sets given from
         * an xSV file, but only one is used.
         */
        function showConfigMessage() {
            const messages = typesToFiles[selectedFileType].messages;
            if (messages) {
                const messageNode = ui.getElement('input-container.config-message');
                messages.forEach((msg) => {
                    const elem = renderConfigMessage(msg);
                    messageNode.appendChild(ui.createNode(elem));
                });
            }
        }

        /**
         * Makes the DOM element for a config message.
         * @param {Object} msg - has keys type and message.
         *   type - string, expected to be one of 'error' or 'warning', will default to 'warning'
         *   message - string
         */
        function renderConfigMessage(msg) {
            const div = html.tag('div'),
                span = html.tag('span'),
                iTag = html.tag('i'),
                strong = html.tag('strong');
            const icon = 'fa fa-exclamation-circle';
            let msgType = msg.type;
            if (msgType !== 'warning' && msgType !== 'error') {
                msgType = 'warning';
            }
            return div(
                {
                    class: `${cssBaseClass}__message ${cssBaseClass}__message--${msg.type}`,
                },
                [
                    span(
                        {
                            class: `${cssBaseClass}__message--${msg.type}-title`,
                        },
                        [iTag({ class: icon }), strong(` ${msg.type}:`)]
                    ),
                    span(msg.message),
                ]
            );
        }

        function renderLayout() {
            const div = html.tag('div');
            return div(
                {
                    class: `${cssBaseClass}__container`,
                },
                [
                    div({
                        class: `${cssBaseClass}__panel--filetype`,
                        dataElement: 'filetype-panel',
                    }),
                    div(
                        {
                            class: `${cssBaseClass}__panel--configure`,
                            dataElement: 'input-container',
                        },
                        [
                            div({
                                class: `${cssBaseClass}__message_container`,
                                dataElement: 'config-message',
                            }),
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
         * @param {Object} readyState - keys = file type ids, values = string for whether
         *  that type is ready to run (one of "complete", "incomplete", "error")
         */
        function buildFileTypePanel(node, readyState) {
            fileTypePanel = FileTypePanel.make({
                bus: cellBus,
                header: {
                    label: 'Data type',
                    icon: 'icon icon-genome',
                },
                fileTypes: fileTypesDisplay,
                toggleAction: toggleFileType,
            });
            const state = getFileTypeState(readyState);

            return fileTypePanel.start({
                node,
                state,
            });
        }

        /**
         * This calculates a state object for the fileTypePanel. It uses either a given
         * readyState object, or the set of parameter states in the model if that isn't
         * present.
         * @param {Object} readyState (optional) keys = file type ids, values = string for whether
         *  that type is ready to run (one of "complete", "incomplete", "error")
         * @returns {Object} with keys:
         *   - selected {String} the selected file type
         *   - completed {Object} keys = file type ids, values = booleans (true if all parameters
         *      are valid and ready)
         */
        function getFileTypeState(readyState) {
            const fileTypeCompleted = {};
            readyState = readyState || model.getItem('state.params', {});
            for (const [fileType, status] of Object.entries(readyState)) {
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
            return stopInputWidgets()
                .then(() => startInputWidgets())
                .then(() => {
                    cellBus.emit('toggled-active-filetype', {
                        fileType: selectedFileType,
                    });
                });
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
                availableFiles: model.getItem(['inputs', selectedFileType, 'files']),
                unavailableFiles,
                viewOnly,
                unselectedOutputValues: getUnselectedOutputValues(),
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
         * Gets the collection of file path parameter validation options. This is returned as
         * an Array of objects, one for each file path row. Each object has a key for each
         * file path id, and value is the options for that input.
         *
         * Currently this only sets the invalidValues option for text validation. I.e., the
         * files that are not available.
         * @returns a list of file path options for each file input row.
         */
        function getFilePathOptionsForValidation() {
            let fpIds = model.getItem(['app', 'fileParamIds', selectedFileType]);
            const outIds = model.getItem(['app', 'outputParamIds', selectedFileType]);
            fpIds = fpIds.filter((id) => !outIds.includes(id));
            const fpVals = model.getItem(['params', selectedFileType, FILE_PATH_TYPE]);

            // fpIds = file input ids
            // outIds = file output ids
            // fpVals = Array of KVPs with id (either fpIds or outIds) -> value

            return fpVals.map((filePath) => {
                const fpOptions = {};
                for (const id of Object.keys(filePath)) {
                    fpOptions[id] = {};
                    if (fpIds.includes(id)) {
                        fpOptions[id].invalidValues = unavailableFiles;
                    }
                }
                return fpOptions;
            });
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
                    {},
                    filePathIds,
                    filePathValues,
                    getFilePathOptionsForValidation(),
                    spec
                );
            }).then((state) => {
                model.setItem(['state', 'params', selectedFileType], state);
                const fileTypeState = getFileTypeState();
                fileTypePanel.updateState(fileTypeState);
                const paramsReady = Object.values(fileTypeState.completed).reduce((prev, cur) => {
                    return cur && prev;
                }, true);
                cellBus.emit('update-param-state', {
                    paramsReady,
                });
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
            if (!running) {
                return Promise.resolve();
            }

            return stopInputWidgets().then(() => {
                container.innerHTML = '';
                running = false;
            });
        }

        return {
            start,
            stop,
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
