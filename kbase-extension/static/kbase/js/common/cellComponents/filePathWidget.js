define([
    'bluebird',
    'common/html',
    'common/ui',
    'common/events',
    'common/props',
    'common/cellComponents/fieldTableCellWidget',
    'widgets/appWidgets2/paramResolver',
    'common/runtime',
    'StagingServiceClient'
], (Promise, html, UI, Events, Props, FieldWidget, ParamResolver, Runtime, StagingServiceClient) => {
    'use strict';

    const tag = html.tag,
        form = tag('form'),
        span = tag('span'),
        button = tag('button'),
        div = tag('div'),
        ol = tag('ol'),
        li = tag('li'),
        icon = tag('icon'),
        cssBaseClass = 'kb-file-path',
        cssClassType = 'parameter';

    /**
     *
     * @param {object} config keys:
     *  - paramIds: Array of strings, parameter ids
     *  - bus - the main bus that's used for communicating up to the controlling widget
     *  - workspaceId - the id of the workspace we should use for searching for objects
     *  - initialParams - Array of objects. Each item represents a row of parameter values.
     *    So each item has an object with parameter id -> value
     *  - availableFiles - Array of strings, one for each file that should be available here.
     *  - viewOnly - boolean, if true start with the view version of input widgets
     * @returns
     */
    function factory(config) {
        const viewOnly = config.viewOnly || false;
        const { workspaceId, initialParams, paramIds, availableFiles } = config;
        const runtime = Runtime.make(),
            // paramsBus is used to communicate from this parameter container to the parent that
            // created and owns it
            paramsBus = config.bus,
            model = Props.make(),
            otherTabOutputValues = config.unselectedOutputValues,
            /**
             * Internal data model
             * The data model / view model is a structure that maintains the overall internal
             * state of this widget. It holds:
             *  - all input widgets in the cell
             *  - all values, kept in an order that's useful for the cell
             *  - all row information, in a way that's (generally) easily accessible and easy to
             *    update.
             *  - each row gets its own immutible unique id, which is used for widget communication and
             *    management
             *  - row order, since we can delete from anywhere, can shift and wobble, so that's not helpful.
             *    instead, we map from rowId -> row order, and update that on insertions and deletions.
             * In general, we need to support 4 actions.
             * 1. add row
             *  - rows get added to the end, new id, new object for data.
             * 2. update data
             *  - when a field widget updates its data, we get a message with row id, parameter id, and new
             *    value.
             * 3. push data to main widget (configure tab)
             *  - we use the mapped row order to fetch the values in the right order, which is a quick loop
             * 4. delete row
             *  - rows can get deleted from anywhere, which breaks all the ordering. We need to run a loop
             *    to figure out the new order after the one that was deleted.
             *
             * dataModel structure:
             * This is a simple object with a few keys:
             * rowOrder: array of unique ids, this is the row ids in the order they should appear on
             *   screen, thus the order the data should be stored in
             * rowIdToIndex: mapping from unique rowId to the index in rowOrder. Mainly used on row
             *   updates
             * rows: a map from the unique rowId to an object containing two keys:
             *   - values: a set of key-value-pairs, parameter id -> parameter value
             *   - widgets: a set of key-value-pairs, parameter id -> widget
             *
             * example:
             * {
             *   rowOrder: ['rowA', 'rowB'],
             *   rowIdToIndex: {
             *      rowA: 0,
             *      rowB: 1
             *   },
             *   rows: {
             *     rowA: {
             *       widgets: {
             *         param1: Object[],
             *         param2: Object[]
             *       },
             *       values: {
             *         param1: 'value1',
             *         param2: 'value2'
             *       }
             *     },
             *     rowB: {
             *       widgets: {
             *         param1: Object[],
             *         param2: Object[]
             *       },
             *       values: {
             *         param1: 'value3',
             *         param2: 'value4'
             *       }
             *     }
             *   }
             * }
             */
            dataModel = {
                rowOrder: [],
                rowIdToIndex: {},
                rows: {},
            },
            paramResolver = ParamResolver.make(),
            events = Events.make(),
            bus = runtime.bus().makeChannelBus({
                description: 'A file path widget',
            });
        let container, ui, missingFiles = [];

        function makeFieldWidget(rowId, inputWidget, appSpec, parameterSpec, value) {
            const fieldWidget = FieldWidget.make({
                inputControlFactory: inputWidget,
                showHint: true,
                useRowHighight: true,
                initialValue: value,
                appSpec,
                parameterSpec,
                workspaceId,
                referenceType: 'name',
                paramsChannelName: paramsBus.channelName,
                availableValues: availableFiles.map((filename) => {
                    return {
                        value: filename,
                        display: filename,
                    };
                }),
                invalidValues: missingFiles,
                invalidError: 'file not found',
                disabledValues: getAllSelectedFiles(),
            });

            /**
             * We only expect file input and object output parameters here. These are either the
             * selectInput widget (for file lookups) or the newObjectInput widget for the
             * object outputs. Bus messages that get listened to here reflect that - specialized
             * messages like "sync-params" are only used by a few inputs, none of which are
             * expected here.
             */
            fieldWidget.bus.on('changed', (message) => {
                const newValue = message.newValue;
                dataModel.rows[rowId].values[parameterSpec.id] = newValue;
                updateDisabledFileValues();
                // TODO: get up to date with all values across uploaders
                // But it still might be a duplicate! So do the following on each change.
                // 1. Get all output values
                // 2. If duplicates, mark those
                // 2a. emit 'invalid-param-value' messages for the duplicates
                // 3. Send results to all widgets
                // 4. All widgets update their state
                let duplicateValues = [];
                if (model.getItem('outputParamIds').includes(parameterSpec.id)) {
                    duplicateValues = updateDuplicateOutputValues();
                }
                if (duplicateValues.includes(newValue)) {
                    paramsBus.emit('invalid-param-value', {
                        parameter: parameterSpec.id,
                    });
                } else {
                    paramsBus.emit('parameter-changed', {
                        parameter: parameterSpec.id,
                        newValue: newValue,
                        isError: message.isError,
                        rowId: rowId,
                        rowIndex: dataModel.rowIdToIndex[rowId],
                    });
                }
            });

            fieldWidget.bus.on('validation', (message) => {
                // only propagate if invalid. value changes come through
                // the 'changed' message
                let duplicateValues = [];
                if (model.getItem('outputParamIds').includes(parameterSpec.id)) {
                    duplicateValues = updateDuplicateOutputValues();
                }
                if (!message.isValid || duplicateValues.length) {
                    paramsBus.emit('invalid-param-value', {
                        parameter: parameterSpec.id,
                    });
                }
            });

            fieldWidget.bus.on('sync', () => {
                const newValue = dataModel.rows[rowId].values[parameterSpec.id];
                fieldWidget.bus.send(
                    {
                        value: newValue,
                    },
                    {
                        // This points the update back to a listener on this key
                        key: {
                            type: 'update',
                        },
                    }
                );
            });

            fieldWidget.bus.respond({
                key: {
                    type: 'get-param-state',
                },
                handle: function () {
                    return paramsBus.request(
                        { id: parameterSpec.id },
                        {
                            key: {
                                type: 'get-param-state',
                            },
                        }
                    );
                },
            });

            fieldWidget.bus.respond({
                key: {
                    type: 'get-parameter',
                },
                handle: function (message) {
                    if (message.parameterName) {
                        return dataModel.rows[rowId].values[message.parameterName];
                    }
                    return null;
                },
            });

            /**
             * This is used by the newObjectInput widget to determine whether there's
             * any duplicated parameters. Since we, effectively, have a sequence of the same
             * input ids here, this gets tricky.
             * TODO: deal with trickiness and make this return any values that might be
             * duplicate. Note, might have to twiddle appWidgets2/input/newObjectInput.js
             * around line 125. It expects a key-value-pair set of parameters.
             */
            fieldWidget.bus.respond({
                key: {
                    type: 'get-parameters',
                },
                handle: (message) => {
                    if (message.parameterNames) {
                        return Promise.all(
                            message.parameterNames.map((paramName) => {
                                return paramsBus
                                    .request(
                                        {
                                            parameterName: paramName,
                                        },
                                        {
                                            key: {
                                                type: 'get-parameter',
                                            },
                                        }
                                    )
                                    .then((result) => {
                                        const returnVal = {};
                                        returnVal[paramName] = result.value;
                                        return returnVal;
                                    });
                            })
                        ).then((results) => {
                            const combined = {};
                            results.forEach((res) => {
                                Object.keys(res).forEach((key) => {
                                    combined[key] = res[key];
                                });
                            });
                            return combined;
                        });
                    }
                },
            });

            return fieldWidget;
        }

        /**
         * Adds a new file path parameter row. Has the following responsibilities:
         *  - make row id
         *  - make initial table row layout
         *  - set up row parameters
         *  - make the row
         * @param {object} params - key value pairs for the set of parameterIds -> values
         *   to start this row with. If falsy, this uses the default parameters.
         */
        function addRow(params) {
            if (!params) {
                // initialize params
                params = Object.assign({}, model.getItem('defaultParams'));
            }
            const filePathRows = ui.getElement(`${cssClassType}-fields`);
            const rowId = html.genId();
            dataModel.rowOrder.push(rowId);
            dataModel.rowIdToIndex[rowId] = dataModel.rowOrder.length - 1;
            dataModel.rows[rowId] = {
                values: params,
                widgets: [],
            };

            const newRowNode = ui.createNode(
                li({
                    class: `${cssBaseClass}__list_item`,
                    dataElement: `${cssClassType}-fields-row`,
                    dataRowId: rowId,
                })
            );
            filePathRows.appendChild(newRowNode);
            return makeFilePathRow(newRowNode, rowId, params).then(() => {
                syncDataModel();
            });
        }

        function syncDataModel() {
            // map structure of data into an array of parameter objects
            const dataValues = dataModel.rowOrder.map((rowId) => dataModel.rows[rowId].values);
            paramsBus.emit('sync-data-model', {
                values: dataValues,
            });
        }

        /**
         * Renders the layout structure without any parameter rows.
         * @returns {string} layout HTML content
         */
        function renderLayout() {
            let formContent = [];
            const panelBody = [
                ol({
                    class: `${cssBaseClass}__list`,
                    dataElement: `${cssClassType}-fields`,
                }),
            ];
            if (!viewOnly) {
                panelBody.push(
                    button(
                        {
                            class: `${cssBaseClass}__button--add_row`,
                            type: 'button',
                            id: events.addEvent({
                                type: 'click',
                                handler: function () {
                                    addRow();
                                },
                            }),
                        },
                        [
                            span({
                                class: `${cssBaseClass}__button_icon--add_row fa fa-plus`,
                            }),
                            'Add Row',
                        ]
                    )
                );
            }

            formContent = formContent.concat([
                ui.buildPanel({
                    title: span(['File Paths']),
                    name: `${cssClassType}s-area`,
                    body: panelBody,
                    classes: ['kb-panel-light'],
                }),
            ]);

            const content = form(
                {
                    dataElement: `${cssClassType}-widget-form`,
                },
                [formContent]
            );

            return content;
        }

        // MESSAGE HANDLERS
        function doAttach() {
            const layout = renderLayout();
            container.innerHTML = layout;
            events.attachEvents(container);
        }

        // EVENTS
        function attachEvents() {
            bus.on('reset-to-defaults', () => {
                Object.values(dataModel.rows).forEach((row) => {
                    Object.values(row.widgets).forEach((widget) => {
                        widget.bus.emit('reset-to-defaults');
                    });
                });
            });

            runtime.bus().on('workspace-changed', () => {
                // if the workspace magically changes, pass that along to
                // each registered widget.

                Object.values(dataModel.rows).forEach((row) => {
                    Object.values(row.widgets).forEach((widget) => {
                        widget.bus.emit('workspace-changed');
                    });
                });
            });
        }

        /**
         *
         * @param {object} params
         * @returns {object}
         *  - content: string, the html layout
         *  - layout: array, the parameter ids in the right order
         *  - view: object where keys = parameter ids, objects = {id: random generated div id where they should get rendered}
         *  - paramMap: same as params, but a mapping from paramId to the param spec
         */
        function makeFilePathsLayout(params) {
            const view = {},
                paramMap = {};

            const orderedParams = params.map((param) => {
                paramMap[param.id] = param;
                return param.id;
            });

            const layout = orderedParams
                .map((parameterId) => {
                    const id = html.genId();
                    view[parameterId] = { id };

                    return tag('div')({
                        class: `${cssBaseClass}__row_cell--file-path_id`,
                        id: id,
                        dataParameter: parameterId,
                    });
                })
                .join('\n');

            return {
                content: layout,
                layout: orderedParams,
                view,
                paramMap,
            };
        }

        /**
         * Creates a new single file path widget for the parameter id with some initial value.
         * This returns a Promise that resolves into the new widget.
         * @param {string} rowId - the unique row id where this widget will live
         * @param {object} appSpec - the entire app spec to pass along to the widget
         * @param {object} filePathParams - the object holding all file path param specs
         * @param {string} parameterId - the parameter id from the app spec
         * @param {any} parameterValue - the initial value of the parameter
         * @returns the created and started widget, linked to its parameterId in a tiny object
         */
        function createFilePathWidget(rowId, appSpec, filePathParams, parameterId, parameterValue) {
            const spec = filePathParams.paramMap[parameterId];
            let widget;
            let controlPromise;
            if (viewOnly) {
                controlPromise = paramResolver.loadViewControl(spec);
            } else {
                // patch to turn dynamic_dropdowns (the usual file widget) to regular dropdowns (which get set
                // to enabled / disabled)
                if (spec.ui.control === 'dynamic_dropdown') {
                    spec.ui.control = 'dropdown';
                }
                controlPromise = paramResolver.loadInputControl(spec);
            }
            return controlPromise
                .then((inputWidget) => {
                    widget = makeFieldWidget(rowId, inputWidget, appSpec, spec, parameterValue);

                    return widget.start({
                        node: container.querySelector('#' + filePathParams.view[spec.id].id),
                    });
                })
                .then(() => {
                    const retValue = {};
                    retValue[parameterId] = widget;
                    return retValue;
                })
                .catch((ex) => {
                    console.error(`Error making input field widget: ${ex}`);
                    const errorDisplay = div(
                        {
                            class: 'kb-field-widget__error_message--file-paths',
                        },
                        [ex.message]
                    );

                    container.querySelector(
                        '#' + filePathParams.view[spec.id].id
                    ).innerHTML = errorDisplay;

                    throw new Error(`Error making input field widget: ${ex}`);
                });
        }

        /**
         * Deletes a parameter row. This does the following steps:
         * 1. Stop all widgets (which should remove them and their events from the DOM).
         * 2. Delete that row of data and widgets from the data model.
         * 3. Renumber the existing rows in both the model and the DOM.
         * 4. Fire off a sync-data-model message up to the controller.
         * @param {Event} e - the click event on the delete button
         * @param {string} rowId - the id of the row to delete
         * @returns a promise that resolves when the steps are done.
         */
        function deleteRow(e, rowId) {
            const rowWidgets = Object.values(dataModel.rows[rowId].widgets);
            return Promise.all(rowWidgets.map((widget) => widget.stop())).then(() => {
                delete dataModel.rows[rowId];
                const rowIdx = dataModel.rowIdToIndex[rowId];

                dataModel.rowOrder.splice(rowIdx, 1);
                delete dataModel.rowIdToIndex[rowId];
                // redo the ordering
                dataModel.rowOrder.forEach((_rowId, idx) => {
                    dataModel.rowIdToIndex[_rowId] = idx;
                });
                e.target.closest('li').remove();
                updateDisabledFileValues();
                updateDuplicateOutputValues();
                syncDataModel();
            });
        }

        /**
         * Makes a file path row of widgets and stores them in the data model.
         * @param {DOM Element} filePathRow - the container element for a file path row
         * @param {string} rowId - the unique id to assign to the row.
         * @param {object} params - key value pair for paramId -> paramValue
         * @returns a Promise that resolves when all widgets are created and saved.
         */
        function makeFilePathRow(filePathRow, rowId, params) {
            const appSpec = model.getItem('appSpec');
            const filePathParams = makeFilePathsLayout(model.getItem('parameterSpecs'));
            const rowEvents = Events.make();

            if (!filePathParams.layout.length) {
                return Promise.resolve(
                    ui.getElement(`${cssClassType}s-area`).classList.add('hidden')
                );
            }

            const fpRowHtml = (filePathRow.innerHTML = [
                div(
                    {
                        class: `${cssBaseClass}__params`,
                    },
                    [
                        div(
                            {
                                class: `${cssBaseClass}__param_container row`,
                            },
                            [filePathParams.content]
                        ),
                    ]
                ),
            ]);
            if (!viewOnly) {
                fpRowHtml.push(
                    button(
                        {
                            class: `${cssBaseClass}__button--delete`,
                            type: 'button',
                            id: rowEvents.addEvent({
                                type: 'click',
                                handler: function (e) {
                                    deleteRow(e, rowId);
                                },
                            }),
                        },
                        [
                            icon({
                                class: 'fa fa-trash-o fa-lg',
                            }),
                        ]
                    )
                );
            }

            filePathRow.innerHTML = fpRowHtml.join('');

            return Promise.all(
                filePathParams.layout.map(async (parameterId) => {
                    return await createFilePathWidget(
                        rowId,
                        appSpec,
                        filePathParams,
                        parameterId,
                        params[parameterId]
                    );
                })
            ).then((widgets) => {
                // dataModel.rows[rowId] was already created by addRow
                dataModel.rows[rowId].widgets = Object.assign({}, ...widgets);
                rowEvents.attachEvents(filePathRow);
            });
        }

        function verifyFiles() {
            const runtime = Runtime.make();
            const stagingService = new StagingServiceClient({
                root: runtime.config('services.staging_api_url.url'),
                token: runtime.authToken(),
            });
            return Promise.resolve(stagingService.list())
                .then((data) => {
                    // turn data into a Set of files with the first path (the root, username)
                    // stripped, as those don't get used.
                    const serverFiles = new Set(JSON.parse(data).map((file) => {
                        return file.path.slice(file.path.indexOf('/') + 1);
                    }));

                    // we really just need the missing files - those in the given files array
                    // that don't exist in serverFiles. So filter out those that don't exist.

                    return availableFiles.filter((file) => !serverFiles.has(file));
                });
        }

        /**
         * Build the layout structure.
         * Populate with initial parameter rows
         * Keep parameter rows as data model
         * Update as changed, and propagate entire parameter list up to parent bus
         * @param {object} arg - has keys:
         *  node - the containing DOM node
         *  appSpec - the appSpec for the app having its parameters portrayed here
         *  parameters - the parameter set with the layout order
         * @returns a promise that resolves when all file path rows are created from
         * the initial set of parameters
         */
        function start(arg) {
            container = arg.node;
            ui = UI.make({
                node: container,
                bus: bus,
            });
            doAttach();
            attachEvents();
            model.setItem('parameterIds', paramIds);
            model.setItem('appSpec', arg.appSpec);
            model.setItem('parameterValues', initialParams);
            // get the parameter specs in the right order.
            const parameterSpecs = [];
            const defaultParams = {};
            const fileParamIds = [];
            const outputParamIds = [];
            arg.parameters.layout.forEach((id) => {
                if (paramIds.includes(id)) {
                    const paramSpec = arg.parameters.specs[id];
                    parameterSpecs.push(paramSpec);
                    defaultParams[id] = paramSpec.data.defaultValue;
                    const isOutput =
                        paramSpec.original.text_options &&
                        paramSpec.original.text_options.is_output_name === 1;
                    if (!isOutput) {
                        // if it's not an "output", it's a file
                        fileParamIds.push(id);
                    } else {
                        outputParamIds.push(id);
                    }
                }
            });
            model.setItem('fileParamIds', fileParamIds);
            model.setItem('parameterSpecs', parameterSpecs);
            model.setItem('defaultParams', defaultParams);
            model.setItem('outputParamIds', outputParamIds);
            return verifyFiles()
                .then((missing) => {
                    missingFiles = missing;
                    return Promise.all(
                        initialParams.map((paramRow) => {
                            return addRow(paramRow);
                        })
                    );
                })
                .then(() => {
                    // once all rows are set up and we have the data model
                    // disable all relevant files from each input widget.
                    // TODO: set this up to disable files from each column (i.e. parameter id) instead
                    // TODO: set this widget up to link filetypes to parameter ids. Work also needed in
                    // bulkImportWidget.js and configure.js.
                    updateDisabledFileValues();
                    const dups = updateDuplicateOutputValues();
                    // if there are any duplicates, we need to send a message that this is an
                    // invalid setup
                    if (dups.length) {
                        paramsBus.emit('invalid-param-value');
                    }
                })
                .catch((error) => {
                    throw new Error(`Unable to start filePathWidget: ${error}`);
                });
        }

        /**
         * Gets all the selected files and tells all file input widgets to make those disabled.
         * So the user can only select one file from the list.
         */
        function updateDisabledFileValues() {
            const values = getAllSelectedFiles();
            getAllFileParameterWidgets().forEach((widget) => {
                widget.bus.emit('set-disabled-values', { values });
            });
        }

        /**
         * Steps.
         * 1. Get all values from output parameters, ignore null values
         * 2. Filter down to those with duplicates
         * 3. Send those to just the inputs those came from.
         * 4. Up to widgets to act accordingly
         * 5. Return the row ids that are duplicates
         */
        function updateDuplicateOutputValues() {
            /* otherTabValues = all output values from other tabs, what tab they're in, and which row.
             *
             * looks like this:
             * {
             *   value: {
             *     tabId: [rowIds, rowIdx]
             *   }
             * }
             */

            /* First, set up the output value counts for this tab.
             * outputValueCounts will look like this:
             * {
             *   value: [{rowId, paramId}]
             * }
             * for each value.
             */
            const outputValueCounts = model.getItem('outputParamIds').reduce((counts, paramId) => {
                const outputValues = getParameterValuesByRow(paramId);
                for (const [rowId, value] of Object.entries(outputValues)) {
                    if (!value) {
                        return counts;
                    } else if (!(value in counts)) {
                        counts[value] = [];
                    }
                    counts[value].push({ rowId, paramId });
                }
                return counts;
            }, {});
            /* Second, set up values to only track duplicates, and fold in the
             * results from all other tabs.
             *
             * values should now look like:
             * {
             *   'field_value': {
             *     otherTabs: {
             *        tabId: [rows],
             *     },
             *     thisTab: {
             *        [{ rowId1, paramId }, { rowId2, paramId }]
             *     }
             *   }
             * }
             * with only entries where there are at least two row ids, or
             * a value found from another tab
             */
            const values = Object.keys(outputValueCounts).reduce((duplicateValues, value) => {
                const dup = {};
                if (outputValueCounts[value].length > 1 || value in otherTabOutputValues) {
                    dup.thisTab = outputValueCounts[value];
                }
                if (value in otherTabOutputValues) {
                    dup.otherTabs = otherTabOutputValues[value];
                }
                if (Object.keys(dup).length) {
                    duplicateValues[value] = dup;
                }
                return duplicateValues;
            }, {});
            /* Get the parameter widgets and translate to something easier to work with -
             * {
             *    rowId: {
             *      paramId1: {
             *        widget: Object
             *        duplicateRows: {
             *          thisTab: [rowIdx, rowIdx],
             *          otherTabs: {
             *              tabId1: [rowIdx, rowIdx]
             *          }
             *      },
             *    }
             * }
             *
             * otherTabs may not exist, though thisTab must (since we're looking at this tab's
             * duplicate values).
             */
            const duplicates = {};
            Object.values(values).forEach((dupEntry) => {
                const allRowsThisTab = new Set();
                dupEntry.thisTab.forEach((entry) => {
                    allRowsThisTab.add(dataModel.rowIdToIndex[entry.rowId] + 1);
                });
                dupEntry.thisTab.forEach((entry) => {
                    const rowId = entry.rowId,
                        rowIdx = dataModel.rowIdToIndex[rowId] + 1,
                        paramInfo = {
                            widget: dataModel.rows[rowId].widgets[entry.paramId],
                            duplicateRows: {
                                thisTab: [...allRowsThisTab].filter((x) => x !== rowIdx),
                                otherTabs: dupEntry.otherTabs || {},
                            },
                        };
                    if (!(rowId in duplicates)) {
                        duplicates[rowId] = {};
                    }
                    duplicates[rowId][entry.paramId] = paramInfo;
                });
            });

            const outputParams = new Set(getAllOutputParameterWidgets());

            Object.values(duplicates).forEach((duplicateEntry) => {
                Object.values(duplicateEntry).forEach((entry) => {
                    entry.widget.setDuplicateValue(entry.duplicateRows);
                    outputParams.delete(entry.widget);
                });
            });
            outputParams.forEach((widget) => widget.clearDuplicateValue());

            return Object.keys(values);
        }

        /**
         *
         * @param {Object} paramId maps from rowId -> value for this parameter, includes nulls
         */
        function getParameterValuesByRow(paramId) {
            const valueMap = {};
            for (const [rowId, entry] of Object.entries(dataModel.rows)) {
                valueMap[rowId] = entry.values[paramId];
            }
            return valueMap;
        }

        /**
         * Goes through all current rows and builds an array of all values for the given parameter.
         * @param {string} paramId
         */
        function getParameterValues(paramId) {
            return getAllRowElements(paramId, 'values');
        }

        /**
         * Returns the list of all selected files among all file input widgets.
         * This filters out any null values.
         * @returns an array of strings
         */
        function getAllSelectedFiles() {
            return model.getItem('fileParamIds').reduce((acc, paramId) => {
                return acc.concat(getParameterValues(paramId).filter((value) => value !== null));
            }, []);
        }

        /**
         * Returns all widgets used for file parameters.
         * @returns an array of widgets
         */
        function getAllFileParameterWidgets() {
            return getWidgetsByType('fileParamIds');
        }

        /**
         *
         * @returns an object where keys are row ids and values are a list of
         * output parameter widgets
         */
        function getAllOutputParameterWidgets() {
            return getWidgetsByType('outputParamIds');
        }

        /**
         *
         * @param {string} type one of 'fileParamIds', 'outputParamIds'
         * @returns an object with widgets keyed on their row.
         */
        function getWidgetsByType(type) {
            return model.getItem(type).reduce((widgets, paramId) => {
                return widgets.concat(getParameterWidgets(paramId));
            }, []);
        }

        /**
         * Returns an array of all widgets for a given parameter id, extracted from each row.
         * @param {string} paramId
         */
        function getParameterWidgets(paramId) {
            return getAllRowElements(paramId, 'widgets');
        }

        /**
         * Returns either widgets or values for one parameter id as an Array of elements extracted from all rows.
         * @param {string} paramId the parameter to get the element for
         * @param {string} element one of 'values', 'widgets'
         * @returns
         */
        function getAllRowElements(paramId, element) {
            return Object.values(dataModel.rows).map((row) => {
                return row[element][paramId];
            });
        }

        function stop() {
            // Stop all widgets. Note this is an array of arrays of promises.
            const widgetStopProms = Object.values(dataModel.rows).map((row) => {
                return Object.values(row.widgets).map((widget) => {
                    return widget.stop();
                });
            });

            // ...so we need to flatten it first to pass to Promise.all()
            return Promise.all([].concat(...widgetStopProms)).then(() => {
                if (container) {
                    container.innerHTML = '';
                }
            });
        }

        return {
            start,
            stop,
            bus,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
