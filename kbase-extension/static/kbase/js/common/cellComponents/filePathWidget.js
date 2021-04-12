define([
    'bluebird',
    'jquery',
    'common/html',
    'common/ui',
    'common/events',
    'common/props',
    'common/cellComponents/fieldTableCellWidget',
    'widgets/appWidgets2/paramResolver',
    'common/runtime',
], (Promise, $, html, UI, Events, Props, FieldWidget, ParamResolver, Runtime) => {
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
     * @returns
     */
    function factory(config) {
        const runtime = Runtime.make(),
            // paramsBus is used to communicate from this parameter container to the parent that
            // created and owns it
            paramsBus = config.bus,
            workspaceId = config.workspaceId,
            initialParams = config.initialParams,
            paramIds = config.paramIds, // these aren't in the right order, get the right order in start()
            model = Props.make(),
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
             *  - rows get added to the end, new id, new object for data. O(1)
             * 2. update data
             *  - when a field widget updates its data, we get a message with row id, parameter id, and new
             *    value. Mapping from row id -> row order makes this O(1)
             * 3. push data to main widget (configure tab)
             *  - we maintain data in the right order with the right set of values, so this is O(1)
             * 4. delete row
             *  - rows can get deleted from anywhere, which breaks all the ordering. We need to run a loop
             *    to figure out the new order after the one that was deleted, which makes this O(n)
             *
             * dataModel structure:
             * This is a simple object with a few keys:
             * rowOrder: array of unique ids, this is the row ids in the order they should appear on
             *   screen, thus the order the data should be stored in
             * rowIdToIndex: mapping from unique rowId to the index in rowOrder. Mainly used on row
             *   updates
             * dataValues: an array of key-value-pairs, parameter id -> parameter value
             * widgets: mapping from rowId to the array of widget objects in that row, so we can stop
             *   and remove them all.
             *
             * example:
             * {
             *   rowOrder: ['rowA', 'rowB'],
             *   rowIdToIndex: {
             *      rowA: 0,
             *      rowB: 1
             *   },
             *   dataValues: [{
             *      param1: 'value1',
             *      param2: 'value2
             *   }, {
             *      param1: 'value3',
             *      param2: 'value4'
             *   }],
             *   widgets: {
             *      rowA: [Object[], Object[]],
             *      rowB: [Object[], Object[]]
             *   }
             * }
             *
             * Why do something this complex? We might have 100+ rows, and sifting through to update
             * all of them each time some random widget updates can take a while. And this is a
             * cleaner way of keeping a logical mapping between rows and widgets and data. We could
             * skip the rowIdToIndex Map, but that would mean searching out the row from the id
             * each time - widgets don't know what row they're in, they only know the data they hold,
             * and rewriting the fieldTableCellWidget wrapper to be row-aware seems like more work
             * than is worth it.
             */
            dataModel = {
                rowIdToIndex: {},
                rowOrder: [],
                dataValues: [],
                widgets: {},
            },
            paramResolver = ParamResolver.make(),
            events = Events.make(),
            bus = runtime.bus().makeChannelBus({
                description: 'A file path widget',
            });
        let container, ui;

        function makeFieldWidget(rowId, inputWidget, appSpec, parameterSpec, value) {
            const fieldWidget = FieldWidget.make({
                inputControlFactory: inputWidget,
                showHint: true,
                useRowHighight: true,
                initialValue: value,
                appSpec: appSpec,
                parameterSpec: parameterSpec,
                workspaceId: workspaceId,
                referenceType: 'name',
                paramsChannelName: paramsBus.channelName,
            });

            /**
             * We only expect file input and object output parameters here. These are either the
             * dynamic dropdown widget (for file lookups) or the newObjectInput widget for the
             * object outputs. Bus messages that get listened to here reflect that - specialized
             * messages like "sync-params" are only used by a few inputs, none of which are
             * expected here.
             */

            // When the field widget gets its value changed (or communicates that it's changed),
            // put that in the filePathWidget's data model, then push all the values up the main
            // params bus.
            fieldWidget.bus.on('changed', (message) => {
                const rowIndex = dataModel.rowIdToIndex[rowId];
                dataModel.dataValues[rowIndex][parameterSpec.id] = message.newValue;
                paramsBus.emit('parameter-changed', {
                    parameter: parameterSpec.id,
                    newValue: message.newValue,
                    isError: message.isError,
                    rowId: rowId,
                    rowIndex: dataModel.rowOrder.indexOf(rowId),
                });
            });

            // The 'sync' message is a request for the current model value from the
            // input widget.
            fieldWidget.bus.on('sync', () => {
                const rowIndex = dataModel.rowIdToIndex[rowId];
                const newValue = dataModel.dataValues[rowIndex][parameterSpec.id];
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
                        return paramsBus.request(message, {
                            key: {
                                type: 'get-parameter',
                            },
                        });
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
            const tableElem = ui.getElement(`${cssClassType}-fields`);
            const rowId = html.genId();
            dataModel.rowOrder.push(rowId);
            dataModel.rowIdToIndex[rowId] = dataModel.rowOrder.length - 1;
            dataModel.dataValues.push(params);
            $(tableElem).append(
                li({
                    class: `${cssBaseClass}__list_item`,
                    dataElement: `${cssClassType}-fields-row`,
                    dataRowId: rowId,
                })
            );

            const filePathRows = ui.getElements(`${cssClassType}-fields-row`);
            return makeFilePathRow(filePathRows[filePathRows.length - 1], rowId, params).then(
                () => {
                    syncDataModel();
                }
            );
        }

        function syncDataModel() {
            paramsBus.emit('sync-data-model', {
                values: dataModel.dataValues,
            });
        }

        /**
         * Renders the layout structure without any parameter rows.
         * @returns {string} layout HTML content
         */
        function renderLayout() {
            let formContent = [];

            formContent = formContent.concat([
                ui.buildPanel({
                    title: span(['File Paths']),
                    name: `${cssClassType}s-area`,
                    body: [
                        ol({
                            class: `${cssBaseClass}__list`,
                            dataElement: `${cssClassType}-fields`,
                        }),
                        button(
                            {
                                class: `${cssBaseClass}__button--add_row btn btn__text`,
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
                        ),
                    ],
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
                Object.values(dataModel.widgets).forEach((widgetRow) => {
                    widgetRow.forEach((widget) => {
                        widget.bus.emit('reset-to-defaults');
                    });
                });
            });

            runtime.bus().on('workspace-changed', () => {
                // if the workspace magically changes, pass that along to
                // each registered widget.

                Object.values(dataModel.widgets).forEach((widgetRow) => {
                    widgetRow.forEach((widget) => {
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
                    view[parameterId] = {
                        id: id,
                    };

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
                view: view,
                paramMap: paramMap,
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
         * @returns the created and started widget
         */
        function createFilePathWidget(rowId, appSpec, filePathParams, parameterId, parameterValue) {
            const spec = filePathParams.paramMap[parameterId];
            return paramResolver
                .loadInputControl(spec)
                .then((inputWidget) => {
                    const widget = makeFieldWidget(
                        rowId,
                        inputWidget,
                        appSpec,
                        spec,
                        parameterValue
                    );

                    return widget
                        .start({
                            node: container.querySelector('#' + filePathParams.view[spec.id].id),
                        })
                        .then(() => {
                            return widget;
                        });
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
            return Promise.all(
                dataModel.widgets[rowId].map((widget) => {
                    return widget.stop();
                })
            ).then(() => {
                delete dataModel.widgets[rowId];
                const rowIdx = dataModel.rowIdToIndex[rowId];
                dataModel.dataValues.splice(rowIdx, 1);
                dataModel.rowOrder.splice(rowIdx, 1);
                delete dataModel.rowIdToIndex[rowId];
                // redo the ordering, this is the only O(N) part
                dataModel.rowOrder.forEach((rowId, idx) => {
                    dataModel.rowIdToIndex[rowId] = idx;
                });
                $(e.target).closest('li').remove();
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

            if (!filePathParams.layout.length) {
                return Promise.resolve(
                    ui.getElement(`${cssClassType}s-area`).classList.add('hidden')
                );
            }

            filePathRow.innerHTML = [
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
                button(
                    {
                        class: `${cssBaseClass}__button--delete btn btn__text`,
                        type: 'button',
                        id: events.addEvent({
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
                ),
            ].join('');

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
                dataModel.widgets[rowId] = widgets;
                events.attachEvents(container);
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
            arg.parameters.layout.forEach((id) => {
                if (paramIds.includes(id)) {
                    const paramSpec = arg.parameters.specs[id];
                    parameterSpecs.push(paramSpec);
                    defaultParams[id] = paramSpec.data.defaultValue;
                }
            });
            model.setItem('parameterSpecs', parameterSpecs);
            model.setItem('defaultParams', defaultParams);
            return Promise.all(
                initialParams.map((paramRow) => {
                    addRow(paramRow);
                })
            ).catch((error) => {
                throw new Error(`Unable to start filePathWidget: ${error}`);
            });
        }

        function stop() {
            // Stop all widgets. Note this is an array of arrays of promises.
            const widgetStopProms = Object.values(dataModel.widgets).map((widgetRow) => {
                return widgetRow.map((widget) => {
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
            start: start,
            stop: stop,
            bus: bus,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
