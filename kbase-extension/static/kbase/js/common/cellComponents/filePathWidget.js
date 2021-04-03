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
        table = tag('table'),
        tr = tag('tr'),
        td = tag('td'),
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
        /**
         * data model -
         * just a dict object with row ids (all unique) to their data and row index
         * also maintain a separate array for row order, with row ids in order
         * add row =
         *  - new row of widgets
         *  - new id = new dict with id -> data, id -> row number
         *  - O(1)
         * delete row =
         *  - remove row of widgets
         *  - remove id -> data
         *  - remove dataValues element (splice)
         *  - renumber rows
         *  - O(n) (because of renumbering)
         * get data =
         *  - O(1)
         */

        console.log('MAKING FPW WITH CONFIG');
        console.log(JSON.stringify(config, 4));
        const runtime = Runtime.make(),
            // paramsBus is used to communicate from this parameter container to the parent that
            // created and owns it
            paramsBus = config.bus,
            workspaceId = config.workspaceId,
            initialParams = config.initialParams,
            paramIds = config.paramIds,     // these aren't in the right order, get the right order in start()
            model = Props.make(),
            /**
             * dataModel structure:
             * rowOrder: array of unique ids
             * data: {
             *   rowId: {
             *      index: int, index in rowOrder,
             *      widgets: array of widgets in layout order
             *   }
             * }
             * dataValues: Array of data values
             */
            dataModel = {
                rowIdToIndex: {},
                rowOrder: [],
                dataValues: [],
                widgets: {}
            },

            paramResolver = ParamResolver.make(),
            // widgets = [],
            events = Events.make(),
            // this bus comes from
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

            // Forward all changed parameters to the controller. That is our main job!
            fieldWidget.bus.on('changed', (message) => {
                const rowIndex = dataModel.rowIdToIndex[rowId];
                // console.log('got CHANGED message');
                // console.log(message);
                // console.log(`updating model for ${rowIndex} ${parameterSpec.id} to ${message.newValue}`)
                dataModel.dataValues[rowIndex][parameterSpec.id] = message.newValue;
                // paramsBus.send(
                //     {
                //         parameter: parameterSpec.id,
                //         newValue: message.newValue,
                //         isError: message.isError,
                //     },
                //     {
                //         key: {
                //             type: 'parameter-changed',
                //             parameter: parameterSpec.id,
                //         },
                //     }
                // );

                paramsBus.emit('parameter-changed', {
                    parameter: parameterSpec.id,
                    newValue: message.newValue,
                    isError: message.isError,
                    rowId: rowId,
                    rowIndex: dataModel.rowOrder.indexOf(rowId)
                });
                console.log(dataModel);
            });

            // The 'sync' message is a request for the current model value from the
            // input widget.
            fieldWidget.bus.on('sync', () => {
                // paramsBus.emit('parameter-sync', {
                //     parameter: parameterSpec.id,
                // });
                const rowIndex = dataModel.rowIdToIndex[rowId];
                const value = dataModel.dataValues[rowIndex][parameterSpec.id];
                fieldWidget.bus.send(
                    {
                        value: value,
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

            // Just pass the update along to the input widget.
            // paramsBus.listen({
            //     key: {
            //         type: 'update',
            //         parameter: parameterSpec.id,
            //     },
            //     handle: function (message) {
            //         fieldWidget.bus.emit('update', {
            //             value: message.value,
            //         });
            //     },
            // });

            return fieldWidget;
        }

        function updateRowNumbers(filePathRows) {
            filePathRows.forEach((filePathRow, index) => {
                console.log(`RE INDEXING FILE PATH ROW ${index}`);
                console.log(filePathRow);
                filePathRow.querySelector(`.${cssBaseClass}__file_number`)
                    .textContent = index + 1;
            });
        }

        /**
         * Responsibilities
         *  - make row id
         *  - make initial table row layout
         *  - set up row parameters
         *  - make the row
         * @param {*} params
         */
        function addRow(params) {
            if (!params) {
                // initialize params
                params = Object.assign({}, model.getItem('defaultParams'));
            }
            console.log('ADDING ROW FOR PARAMS ' + JSON.stringify(params));
            const tableElem = ui.getElement(`${cssClassType}-fields`);
            const rowId = html.genId();
            dataModel.rowOrder.push(rowId);
            dataModel.rowIdToIndex[rowId] = dataModel.rowOrder.length - 1;
            dataModel.dataValues.push(params);
            $(tableElem)
                .append(
                    tr({
                        class: `${cssBaseClass}__table_row`,
                        dataElement: `${cssClassType}-fields-row`,
                        dataRowId: rowId
                    })
                );

            const filePathRows = ui.getElements(`${cssClassType}-fields-row`);
            return makeFilePathRow(filePathRows[filePathRows.length-1], rowId, params)
                .then(() => {
                    updateRowNumbers(filePathRows);
                    syncDataModel();
                });
        }

        function syncDataModel() {
            paramsBus.emit('sync-data-model', {
                values: dataModel.dataValues
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
                        table(
                            {
                                class: `${cssBaseClass}__table`,
                                dataElement: `${cssClassType}-fields`,
                            },
                        ),
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
        // function attachEvents() {
        //     bus.on('reset-to-defaults', function () {
        //         widgets.forEach(function (widget) {
        //             widget.bus.emit('reset-to-defaults');
        //         });
        //     });

        //     runtime.bus().on('workspace-changed', function () {
        //         // tell each input widget about this amazing event!
        //         widgets.forEach(function (widget) {
        //             widget.bus.emit('workspace-changed');
        //         });
        //     });
        // }

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
                        class: `${cssBaseClass}__table_cell--file-path_id`,
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
         *
         * @param {object} appSpec
         * @param {object} filePathParams
         * @param {string} parameterId
         * @param {any} parameterValue
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

                    // widgets.push(widget);
                    return widget.start({
                        node: container.querySelector('#' + filePathParams.view[spec.id].id),
                    }).then(() => {
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

        function deleteRow(e, rowId) {
            return Promise.all(dataModel.widgets[rowId].map((widget) => {
                return widget.stop();
            }))
                .then(() => {
                    delete dataModel.widgets[rowId];
                    const rowIdx = dataModel.rowIdToIndex[rowId];
                    dataModel.dataValues.splice(rowIdx, 1);
                    dataModel.rowOrder.splice(rowIdx, 1);
                    delete dataModel.rowIdToIndex[rowId];
                    // redo the ordering, this is the only O(N) part
                    dataModel.rowOrder.forEach((rowId, idx) => {
                        dataModel.rowIdToIndex[rowId] = idx;
                    });
                    const filePathRows = ui.getElements(`${cssClassType}-fields-row`);
                    $(e.target).closest('tr').remove();
                    updateRowNumbers(filePathRows);
                    syncDataModel();
                });
        }

        /**
         *
         * @param {DOM Element} filePathRow - the container element for a file path row
         * @param {object} params - key value pair for paramId -> paramValue
         * @returns
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
                td({
                    class: `${cssBaseClass}__file_number`,
                }),
                td(
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
                td({}, [
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
                ]),
            ].join('');

            return Promise.all(
                filePathParams.layout.map(async (parameterId) => {
                    return await createFilePathWidget(rowId, appSpec, filePathParams, parameterId, params[parameterId]);
                })
            ).then((widgets) => {
                dataModel.widgets[rowId] = widgets;
                console.log(dataModel);
                events.attachEvents(container);
            });
        }

        /**
         * Build the layout structure.
         * Populate with initial parameter rows
         * Keep parameter rows as data model
         * Update as changed, and propagate entire parameter list up to parent bus
         * @param {*} arg - has keys
         *  node - the containing DOM node
         *  appSpec - the appSpec for the app having its parameters portrayed here
         *  parameters - the parameter set with the layout order
         * @returns
         */
        function start(arg) {
            container = arg.node;
            ui = UI.make({
                node: container,
                bus: bus,
            });
            doAttach();
            console.log('starting FPW with arg ');
            console.log(JSON.stringify(arg));

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
                    defaultParams[id] = paramSpec.data.defaultValue
                }
            });
            model.setItem('parameterSpecs', parameterSpecs);
            model.setItem('defaultParams', defaultParams);

            return Promise.all(
                initialParams.map((paramRow) => {
                    addRow(paramRow);
                })
            )
                .catch((error) => {
                    throw new Error(`Unable to start filePathWidget: ${error}`);
                });
        }

        function stop() {
            return Promise.try(() => {
                // really unhook things here.
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
