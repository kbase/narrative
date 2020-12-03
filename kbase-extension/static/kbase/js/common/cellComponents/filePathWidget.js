define([
    'bluebird',
    'jquery',
    'common/html',
    'common/ui',
    'common/events',
    'common/props',
    'common/cellComponents/fieldTableCellWidget',
    'widgets/appWidgets2/paramResolver',
    'common/runtime'
], function (
    Promise,
    $,
    html,
    UI,
    Events,
    Props,
    FieldWidget,
    ParamResolver,
    Runtime
) {
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
        let runtime = Runtime.make(),
            paramsBus = config.bus,
            workspaceId = config.workspaceId,
            initialParams = config.initialParams,
            container,
            ui,
            bus,
            model = Props.make(),
            paramResolver = ParamResolver.make(),
            widgets = [],
            events = Events.make();

        bus = runtime.bus().makeChannelBus({
            description: 'An app params widget'
        });

        function makeFieldWidget(appSpec, parameterSpec, value, closeParameters) {
            return paramResolver.loadInputControl(parameterSpec)
                .then(function (inputWidget) {
                    let fieldWidget = FieldWidget.make({
                        inputControlFactory: inputWidget,
                        showHint: true,
                        useRowHighight: true,
                        initialValue: value,
                        appSpec: appSpec,
                        parameterSpec: parameterSpec,
                        workspaceId: workspaceId,
                        referenceType: 'name',
                        paramsChannelName: paramsBus.channelName,
                        closeParameters: closeParameters
                    });

                    // Forward all changed parameters to the controller. That is our main job!
                    fieldWidget.bus.on('changed', function (message) {
                        paramsBus.send({
                            parameter: parameterSpec.id,
                            newValue: message.newValue,
                            isError: message.isError
                        }, {
                            key: {
                                type: 'parameter-changed',
                                parameter: parameterSpec.id
                            }
                        });

                        paramsBus.emit('parameter-changed', {
                            parameter: parameterSpec.id,
                            newValue: message.newValue,
                            isError: message.isError
                        });
                    });

                    fieldWidget.bus.on('touched', function () {
                        paramsBus.emit('parameter-touched', {
                            parameter: parameterSpec.id
                        });
                    });


                    // An input widget may ask for the current model value at any time.
                    fieldWidget.bus.on('sync', function () {
                        paramsBus.emit('parameter-sync', {
                            parameter: parameterSpec.id
                        });
                    });

                    fieldWidget.bus.on('sync-params', function (message) {
                        paramsBus.emit('sync-params', {
                            parameters: message.parameters,
                            replyToChannel: fieldWidget.bus.channelName
                        });
                    });

                    fieldWidget.bus.on('set-param-state', function (message) {
                        paramsBus.emit('set-param-state', {
                            id: parameterSpec.id,
                            state: message.state
                        });
                    });

                    fieldWidget.bus.respond({
                        key: {
                            type: 'get-param-state'
                        },
                        handle: function () {
                            return paramsBus.request({ id: parameterSpec.id }, {
                                key: {
                                    type: 'get-param-state'
                                }
                            });
                        }
                    });


                    /*
                   * Or in fact any parameter value at any time...
                   */
                    fieldWidget.bus.on('get-parameter-value', function (message) {
                        paramsBus.request({
                            parameter: message.parameter
                        }, {
                            key: 'get-parameter-value'
                        })
                            .then(function (response) {
                                bus.emit('parameter-value', {
                                    parameter: response.parameter
                                });
                            });
                    });

                    fieldWidget.bus.respond({
                        key: {
                            type: 'get-parameter'
                        },
                        handle: function (message) {
                            if (message.parameterName) {
                                return paramsBus.request(message, {
                                    key: {
                                        type: 'get-parameter'
                                    }
                                });
                            }
                            return null;
                        }
                    });

                    fieldWidget.bus.respond({
                        key: {
                            type: 'get-parameters'
                        },
                        handle: (message) => {
                            if (message.parameterNames) {
                                return Promise.all(
                                    message.parameterNames.map((paramName) => {
                                        return paramsBus.request({
                                            parameterName: paramName
                                        }, {
                                            key: {
                                                type: 'get-parameter'
                                            }
                                        })
                                            .then((result) => {
                                                let returnVal = {};
                                                returnVal[paramName] = result.value;
                                                return returnVal;
                                            });
                                    })
                                )
                                    .then((results) => {
                                        let combined = {};
                                        results.forEach((res) => {
                                            Object.keys(res).forEach((key) => {
                                                combined[key] = res[key];
                                            });
                                        });
                                        return combined;
                                    });
                            }
                        }
                    });

                    // Just pass the update along to the input widget.
                    paramsBus.listen({
                        key: {
                            type: 'update',
                            parameter: parameterSpec.id
                        },
                        handle: function (message) {
                            fieldWidget.bus.emit('update', {
                                value: message.value
                            });
                        }
                    });

                    return fieldWidget;
                });
        }

        function updateRowNumbers(filePathRows){
            filePathRows.forEach(function(filePathRow, index){
                $(filePathRow).find(`.${cssBaseClass}__file_number`).text(index + 1);
            });
        }

        function addRow(){
            $(`.${cssBaseClass}__table`).append(
                tr({
                    class: `${cssBaseClass}__table_row`,
                    dataElement: `${cssClassType}-fields-row`,
                })
            );

            let filePathRows = ui.getElements(`${cssClassType}-fields-row`);

            filePathRows.forEach((filePathRow) => {
                // Only render row if it does not have the file path widgets as children (aka an empty row)
                if (filePathRow.childElementCount === 0){
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
                        table({
                            class: `${cssBaseClass}__table`,
                            dataElement: `${cssClassType}-fields`
                        }, [
                            tr({
                                class: `${cssBaseClass}__table_row`,
                                dataElement: `${cssClassType}-fields-row`,
                            })
                        ]),
                        button({
                            class: `${cssBaseClass}__button--add_row btn btn__text`,
                            type: 'button',
                            id: events.addEvent({
                                type: 'click',
                                handler: addRow
                            })
                        }, [
                            span({
                                class: `${cssBaseClass}__button_icon--add_row fa fa-plus`,
                            }),
                            'Add Row'
                        ])
                    ],
                    classes: ['kb-panel-light']
                })
            ]);

            const content = form({
                dataElement: `${cssClassType}-widget-form`
            }, [
                formContent
            ]);

            return content;
        }

        // MESSAGE HANDLERS
        function doAttach(node) {
            container = node;
            ui = UI.make({
                node: container,
                bus: bus
            });
            let layout = renderLayout();
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
            let view = {},
                paramMap = {};

            const orderedParams = params.map((param) => {
                paramMap[param.id] = param;
                return param.id;
            });

            const layout = orderedParams.map((parameterId) => {
                let id = html.genId();
                view[parameterId] = {
                    id: id
                };

                return tag('div')({
                    class: `${cssBaseClass}__table_cell--file-path_id`,
                    id: id,
                    dataParameter: parameterId,
                });
            }).join('\n');

            return {
                content: layout,
                layout: orderedParams,
                params: params,
                view: view,
                paramMap: paramMap
            };
        }

        function findPathParams(params){
            return params.layout.filter(function (id) {
                const original = params.specs[id].original;

                let isFilePathParam = false;

                if (original) {

                    //looking for file inputs via the dynamic_dropdown data source
                    if (original.dynamic_dropdown_options) {
                        isFilePathParam = original.dynamic_dropdown_options.data_source === 'ftp_staging';
                    }

                    //looking for output fields - these should go in file paths
                    else if (original.text_options && original.text_options.is_output_name) {
                        isFilePathParam = true;
                    }
                }

                return isFilePathParam;

            }).map(function (id) {
                return params.specs[id];
            });
        }

        function createFilePathWidget(appSpec, filePathParams, parameterId) {
            const spec = filePathParams.paramMap[parameterId];
            return Promise.try(() => {
                makeFieldWidget(appSpec, spec, initialParams[spec.id], filePathParams.layout)
                    .then((widget) => {
                        widgets.push(widget);
                        return widget.start({
                            node: document.getElementById(filePathParams.view[spec.id].id)
                        });
                    });
            }).catch((ex) => {
                const errorDisplay = div({
                    class: 'kb-field-widget__error_message--file-paths'
                }, [
                    ex.message
                ]);
                document.getElementById(filePathParams.view[spec.id].id).innerHTML = errorDisplay;

                throw new Error('Error making input field widget', ex);
            });

        }

        function deleteRow(e){
            $(e.target).closest('tr').remove();
            let filePathRows = ui.getElements(`${cssClassType}-fields-row`);
            updateRowNumbers(filePathRows);
        }


        function renderFilePathRow(filePathRow) {
            const appSpec = model.getItem('appSpec');

            const params = model.getItem('parameters');
            let filePathParams = makeFilePathsLayout(findPathParams(params));

            if (!filePathParams.layout.length) {
                ui.getElement(`${cssClassType}s-area`).classList.add('hidden');
            } else {
                filePathRow.innerHTML = div({
                    class: `${cssBaseClass}__param_container row`,
                }, [
                    filePathParams.content
                ]);

                $(filePathRow).prepend(
                    td({
                        class: `${cssBaseClass}__file_number`,
                    })
                );

                $(filePathRow).append(
                    td({}, [
                        button({
                            class: 'btn btn__text',
                            type: 'button',
                            id: events.addEvent({
                                type: 'click',
                                handler: function(e){
                                    deleteRow(e);
                                }

                            })
                        },[
                            icon({
                                class: 'fa fa-trash-o fa-lg',
                            })
                        ])
                    ])
                );

                Promise.all(filePathParams.layout.map((parameterId) => {
                    createFilePathWidget(appSpec, filePathParams, parameterId);
                })).then(
                    events.attachEvents(container)
                );

            }
        }

        function start(arg) {
            return Promise.try(function () {
                let container = arg.node;
                doAttach(container);

                model.setItem('appSpec', arg.appSpec);
                model.setItem('parameters', arg.parameters);

                paramsBus.on('parameter-changed', function (message) {
                    widgets.forEach(function (widget) {
                        widget.bus.send(message, {
                            key: {
                                type: 'parameter-changed',
                                parameter: message.parameter
                            }
                        });
                    });
                });


                let filePathRows = ui.getElements(`${cssClassType}-fields-row`);

                filePathRows.forEach((filePathRow) => {
                    renderFilePathRow(filePathRow);
                });
                updateRowNumbers(filePathRows);
            }).catch((error) => {
                throw new Error('Unable to start file path widget: ', error);
            });
        }

        function stop() {
            return Promise.try(function () {
                // really unhook things here.
            });
        }

        return {
            start: start,
            stop: stop,
            bus: function () {
                return bus;
            }
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});
