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
    'common/spec',
], (Promise, $, html, UI, Events, Props, FieldWidget, ParamResolver, Runtime, Spec) => {
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

    function factory(config) {
        const runtime = Runtime.make(),
            // paramsBus is used to communicate from this parameter container to the parent that
            // created and owns it
            paramsBus = config.bus,
            workspaceId = config.workspaceId,
            initialParams = config.initialParams,
            model = Props.make(),
            paramResolver = ParamResolver.make(),
            widgets = [],
            events = Events.make(),
            // this bus comes from
            bus = runtime.bus().makeChannelBus({
                description: 'A file path widget',
            });
        let container, ui;

        function makeFieldWidget(inputWidget, appSpec, parameterSpec, value, closeParameters) {
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
                closeParameters: closeParameters,
            });

            // Forward all changed parameters to the controller. That is our main job!
            fieldWidget.bus.on('changed', (message) => {
                paramsBus.send(
                    {
                        parameter: parameterSpec.id,
                        newValue: message.newValue,
                        isError: message.isError,
                    },
                    {
                        key: {
                            type: 'parameter-changed',
                            parameter: parameterSpec.id,
                        },
                    }
                );

                paramsBus.emit('parameter-changed', {
                    parameter: parameterSpec.id,
                    newValue: message.newValue,
                    isError: message.isError,
                });
            });

            fieldWidget.bus.on('touched', () => {
                paramsBus.emit('parameter-touched', {
                    parameter: parameterSpec.id,
                });
            });

            // An input widget may ask for the current model value at any time.
            fieldWidget.bus.on('sync', () => {
                paramsBus.emit('parameter-sync', {
                    parameter: parameterSpec.id,
                });
            });

            fieldWidget.bus.on('sync-params', (message) => {
                paramsBus.emit('sync-params', {
                    parameters: message.parameters,
                    replyToChannel: fieldWidget.bus.channelName,
                });
            });

            fieldWidget.bus.on('set-param-state', (message) => {
                paramsBus.emit('set-param-state', {
                    id: parameterSpec.id,
                    state: message.state,
                });
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

            /*
             * Or in fact any parameter value at any time...
             */
            fieldWidget.bus.on('get-parameter-value', (message) => {
                paramsBus
                    .request(
                        {
                            parameter: message.parameter,
                        },
                        {
                            key: 'get-parameter-value',
                        }
                    )
                    .then((response) => {
                        bus.emit('parameter-value', {
                            parameter: response.parameter,
                        });
                    });
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
            paramsBus.listen({
                key: {
                    type: 'update',
                    parameter: parameterSpec.id,
                },
                handle: function (message) {
                    fieldWidget.bus.emit('update', {
                        value: message.value,
                    });
                },
            });

            return fieldWidget;
        }

        function updateRowNumbers(filePathRows) {
            filePathRows.forEach((filePathRow, index) => {
                $(filePathRow)
                    .find(`.${cssBaseClass}__file_number`)
                    .text(index + 1);
            });
        }

        function addRow(e) {
            $(e.target)
                .prev('table')
                .append(
                    tr({
                        class: `${cssBaseClass}__table_row`,
                        dataElement: `${cssClassType}-fields-row`,
                    })
                );

            const filePathRows = ui.getElements(`${cssClassType}-fields-row`);

            filePathRows.forEach((filePathRow) => {
                // Only render row if it does not have the file path widgets as children (aka an empty row)
                if (filePathRow.childElementCount === 0) {
                    renderFilePathRow(filePathRow);
                }
            });

            updateRowNumbers(filePathRows);
        }

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
                            [
                                tr({
                                    class: `${cssBaseClass}__table_row`,
                                    dataElement: `${cssClassType}-fields-row`,
                                }),
                            ]
                        ),
                        button(
                            {
                                class: `${cssBaseClass}__button--add_row btn btn__text`,
                                type: 'button',
                                id: events.addEvent({
                                    type: 'click',
                                    handler: function (e) {
                                        addRow(e);
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
                params: params,
                view: view,
                paramMap: paramMap,
            };
        }

        function findPathParams(params) {
            return params.layout
                .filter((id) => {
                    const original = params.specs[id].original;

                    let isFilePathParam = false;

                    if (original) {
                        //looking for file inputs via the dynamic_dropdown data source
                        if (original.dynamic_dropdown_options) {
                            isFilePathParam =
                                original.dynamic_dropdown_options.data_source === 'ftp_staging';
                        }

                        //looking for output fields - these should go in file paths
                        else if (original.text_options && original.text_options.is_output_name) {
                            isFilePathParam = true;
                        }
                    }

                    return isFilePathParam;
                })
                .map((id) => {
                    return params.specs[id];
                });
        }

        function createFilePathWidget(appSpec, filePathParams, parameterId) {
            const spec = filePathParams.paramMap[parameterId];
            return paramResolver
                .loadInputControl(spec)
                .then((inputWidget) => {
                    const widget = makeFieldWidget(
                        inputWidget,
                        appSpec,
                        spec,
                        initialParams[spec.id]
                    );

                    widgets.push(widget);
                    return widget.start({
                        node: container.querySelector('#' + filePathParams.view[spec.id].id),
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

        function deleteRow(e) {
            $(e.target).closest('tr').remove();
            const filePathRows = ui.getElements(`${cssClassType}-fields-row`);
            updateRowNumbers(filePathRows);
        }

        function renderFilePathRow(filePathRow) {
            const appSpec = model.getItem('appSpec');
            const params = model.getItem('parameters');
            const filePathParams = makeFilePathsLayout(config.spec.getFilePathParams().map((id) => params.specs[id])); //findPathParams(params));

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
                                    deleteRow(e);
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
                    await createFilePathWidget(appSpec, filePathParams, parameterId);
                })
            ).then(() => {
                events.attachEvents(container);
            });
        }

        function start(arg) {
            container = arg.node;
            ui = UI.make({
                node: container,
                bus: bus,
            });
            doAttach();

            model.setItem('appSpec', arg.appSpec);
            model.setItem('parameters', arg.parameters);

            paramsBus.on('parameter-changed', (message) => {
                widgets.forEach((widget) => {
                    widget.bus.send(message, {
                        key: {
                            type: 'parameter-changed',
                            parameter: message.parameter,
                        },
                    });
                });
            });

            const filePathRows = ui.getElements(`${cssClassType}-fields-row`);

            return Promise.all(
                filePathRows.map((filePathRow) => {
                    renderFilePathRow(filePathRow);
                })
            )
                .then(() => {
                    updateRowNumbers(filePathRows);
                })
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
