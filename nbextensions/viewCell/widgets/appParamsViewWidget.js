define([
    'bluebird',
    'jquery',
    // CDN
    'kb_common/html',
    // LOCAL
    'common/ui',
    'common/events',
    'common/props',
    // Wrapper for inputs
    './inputWrapperWidget',
    'widgets/appWidgets2/fieldWidgetCompact',
    'widgets/appWidgets2/paramResolver',

    'common/runtime',
    // All the input widgets
], (
    Promise,
    $,
    html,
    UI,
    Events,
    Props,
    //Wrappers
    RowWidget,
    FieldWidget,
    ParamResolver,
    Runtime
) => {
    'use strict';

    const t = html.tag,
        form = t('form'),
        span = t('span'),
        div = t('div');

    function factory(config) {
        let runtime = Runtime.make(),
            paramsBus = config.bus,
            workspaceInfo = config.workspaceInfo,
            container,
            ui,
            bus,
            places,
            model = Props.make(),
            paramResolver = ParamResolver.make(),
            settings = {
                showAdvanced: null,
            },
            widgets = [];

        // DATA
        /*
         *
         * Evaluates the parameter spec to determine which input widget needs to be
         * invoked, but doesn't know what the widget does.
         * Provides the communication bus for each input to route info to the widget
         * and out of it.
         *
         *  In terms of widgets it looks like this:
         *
         *  InputCellWidget
         *    inputWidgets
         *      FieldWidget
         *        textInputWidget
         *      FieldWidget
         *        objectInputWidget
         *      FieldWidget
         *        newObjectInputWidget
         *      FieldWidget
         *        integerInputWidget
         *      FieldWidget
         *        floatInputWidget
         */

        /*
         * The input control widget is selected based on these parameters:
         * - data type - (text, int, float, workspaceObject (ref, name)
         * - input app - input, select
         */

        // RENDERING

        /*
        The field widget is a generic wrapper around the input. It serves the following purposes:
        - intercepts messages in order to display status.
        */

        function makeFieldWidget(appSpec, parameterSpec, value) {
            return paramResolver.loadViewControl(parameterSpec).then((inputWidget) => {
                const fieldWidget = FieldWidget.make({
                    inputControlFactory: inputWidget,
                    showHint: true,
                    useRowHighight: true,
                    initialValue: value,
                    appSpec: appSpec,
                    parameterSpec: parameterSpec,
                    workspaceId: workspaceInfo.id,
                    referenceType: 'name',
                    paramsChannelName: paramsBus.channelName,
                });

                // Forward all changed parameters to the controller. That is our main job!
                fieldWidget.bus.on('changed', (message) => {
                    paramsBus.send(
                        {
                            parameter: parameterSpec.id,
                            newValue: message.newValue,
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
                        .then((message) => {
                            bus.emit('parameter-value', {
                                parameter: message.parameter,
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
                        } else {
                            return null;
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
            });
        }

        function renderAdvanced(area) {
            // area is either "input" or "parameter"

            const areaElement = area + '-area',
                areaSelector = '[data-element="' + areaElement + '"]',
                advancedInputs = container.querySelectorAll(
                    areaSelector + ' [data-advanced-parameter]'
                );

            if (advancedInputs.length === 0) {
                ui.setContent([areaElement, 'advanced-hidden-message'], '');
                // ui.disableButton('toggle-advanced');
                return;
            }

            const removeClass = settings.showAdvanced
                    ? 'advanced-parameter-hidden'
                    : 'advanced-parameter-showing',
                addClass = settings.showAdvanced
                    ? 'advanced-parameter-showing'
                    : 'advanced-parameter-hidden';
            for (let i = 0; i < advancedInputs.length; i += 1) {
                const input = advancedInputs[i];
                input.classList.remove(removeClass);
                input.classList.add(addClass);

                const actualInput = input.querySelector('[data-element="input"]');
                if (actualInput) {
                    $(actualInput).trigger('advanced-shown.kbase');
                }
            }

            // Also update the count in the paramters.
            const events = Events.make({ node: container });

            let message;
            let showAdvancedButton;
            if (settings.showAdvanced) {
                if (advancedInputs.length > 1) {
                    message = String(advancedInputs.length) + ' advanced parameters showing';
                } else {
                    message = String(advancedInputs.length) + ' advanced parameter showing';
                }
                showAdvancedButton = ui.buildButton({
                    label: 'hide advanced',
                    type: 'link',
                    name: 'advanced-parameters-toggler',
                    event: {
                        type: 'toggle-advanced',
                    },
                    events: events,
                });

                ui.setContent(
                    [areaElement, 'advanced-hidden-message'],
                    '(' + message + ') ' + showAdvancedButton
                );
            } else {
                if (advancedInputs.length > 1) {
                    message = String(advancedInputs.length) + ' advanced parameters hidden';
                } else {
                    message = String(advancedInputs.length) + ' advanced parameter hidden';
                }
                showAdvancedButton = ui.buildButton({
                    label: 'show advanced',
                    type: 'link',
                    name: 'advanced-parameters-toggler',
                    event: {
                        type: 'toggle-advanced',
                    },
                    events: events,
                });

                ui.setContent(
                    [areaElement, 'advanced-hidden-message'],
                    '(' + message + ') ' + showAdvancedButton
                );
            }

            events.attachEvents();
        }

        function renderLayout() {
            const events = Events.make(),
                content = form({ dataElement: 'input-widget-form' }, [
                    ui.buildPanel({
                        type: 'default',
                        body: [
                            div(
                                {
                                    class: 'btn-toolbar pull-right',
                                },
                                [
                                    ui.buildButton({
                                        events: events,
                                        name: 'reset-to-defaults',
                                        icon: {
                                            name: 'recycle',
                                        },
                                        label: 'Reset',
                                    }),
                                ]
                            ),
                        ],
                        classes: ['kb-panel-light'],
                    }),
                    ui.buildPanel({
                        title: span([
                            'Input Objects',
                            span({
                                dataElement: 'advanced-hidden-message',
                                style: { marginLeft: '6px', fontStyle: 'italic' },
                            }),
                        ]),
                        name: 'input-objects-area',
                        body: div({ dataElement: 'input-fields' }),
                        classes: ['kb-panel-light'],
                    }),
                    ui.buildPanel({
                        title: span([
                            'Parameters',
                            span({
                                dataElement: 'advanced-hidden-message',
                                style: { marginLeft: '6px', fontStyle: 'italic' },
                            }),
                        ]),
                        name: 'parameters-area',
                        body: div({ dataElement: 'parameter-fields' }),
                        classes: ['kb-panel-light'],
                    }),
                    ui.buildPanel({
                        title: 'Output Objects',
                        name: 'output-objects-area',
                        body: div({ dataElement: 'output-fields' }),
                        classes: ['kb-panel-light'],
                    }),
                ]);

            return {
                content: content,
                events: events,
            };
        }

        // MESSAGE HANDLERS

        function doAttach(node) {
            container = node;
            ui = UI.make({
                node: container,
                bus: bus,
            });
            const layout = renderLayout();
            container.innerHTML = layout.content;
            layout.events.attachEvents(container);
            places = {
                inputFields: ui.getElement('input-fields'),
                outputFields: ui.getElement('output-fields'),
                parameterFields: ui.getElement('parameter-fields'),
                advancedParameterFields: ui.getElement('advanced-parameter-fields'),
            };
        }

        // EVENTS

        function attachEvents() {
            bus.on('reset-to-defaults', () => {
                widgets.forEach((widget) => {
                    widget.bus.emit('reset-to-defaults');
                });
            });
            bus.on('toggle-advanced', () => {
                settings.showAdvanced = !settings.showAdvanced;
                renderAdvanced('input-objects');
                renderAdvanced('parameters');
            });
            runtime.bus().on('workspace-changed', () => {
                // tell each input widget about this amazing event!
                widgets.forEach((widget) => {
                    widget.bus.emit('workspace-changed');
                });
            });
        }

        function makeParamsLayout(params) {
            const view = {};
            const paramMap = {};
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

                    return div({
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

        // LIFECYCLE API

        function renderParameters() {
            // First get the app specs, which is stashed in the model,
            // with the parameters returned.
            // Separate out the params into the primary groups.
            const appSpec = model.getItem('appSpec');

            return Promise.try(() => {
                const params = model.getItem('parameters'),
                    inputParams = makeParamsLayout(
                        params.layout
                            .filter((id) => {
                                return params.specs[id].ui.class === 'input';
                            })
                            .map((id) => {
                                return params.specs[id];
                            })
                    ),
                    outputParams = makeParamsLayout(
                        params.layout
                            .filter((id) => {
                                return params.specs[id].ui.class === 'output';
                            })
                            .map((id) => {
                                return params.specs[id];
                            })
                    ),
                    parameterParams = makeParamsLayout(
                        params.layout
                            .filter((id) => {
                                return params.specs[id].ui.class === 'parameter';
                            })
                            .map((id) => {
                                return params.specs[id];
                            })
                    );

                // new params format is a map with an accompanying ordering layout

                // here is what we do:

                // based on the param ordering (layout), render the html layout,
                // with an id mapped per parameter in this set

                return Promise.resolve()
                    .then(() => {
                        if (inputParams.layout.length === 0) {
                            places.inputFields.innerHTML = span(
                                { style: { fontStyle: 'italic' } },
                                'This app does not have input objects'
                            );
                        } else {
                            places.inputFields.innerHTML = inputParams.content;
                            return Promise.all(
                                inputParams.layout.map((parameterId) => {
                                    const spec = inputParams.paramMap[parameterId];
                                    try {
                                        return makeFieldWidget(
                                            appSpec,
                                            spec,
                                            model.getItem(['params', spec.id])
                                        ).then((widget) => {
                                            widgets.push(widget);

                                            return widget.start({
                                                node: document.getElementById(
                                                    inputParams.view[parameterId].id
                                                ),
                                            });
                                        });
                                    } catch (ex) {
                                        console.error('Error making input field widget', ex);
                                        const errorDisplay = div(
                                            { style: { border: '1px red solid' } },
                                            [ex.message]
                                        );
                                        document.getElementById(
                                            inputParams.view[parameterId].id
                                        ).innerHTML = errorDisplay;
                                    }
                                })
                            );
                        }
                    })
                    .then(() => {
                        if (outputParams.layout.length === 0) {
                            places.outputFields.innerHTML = span(
                                { style: { fontStyle: 'italic' } },
                                'This app does not create any named output objects'
                            );
                        } else {
                            places.outputFields.innerHTML = outputParams.content;
                            return Promise.all(
                                outputParams.layout.map((parameterId) => {
                                    const spec = outputParams.paramMap[parameterId];
                                    try {
                                        return makeFieldWidget(
                                            appSpec,
                                            spec,
                                            model.getItem(['params', spec.id])
                                        ).then((widget) => {
                                            widgets.push(widget);

                                            return widget.start({
                                                node: document.getElementById(
                                                    outputParams.view[parameterId].id
                                                ),
                                            });
                                        });
                                    } catch (ex) {
                                        console.error('Error making input field widget', ex);
                                        const errorDisplay = div(
                                            { style: { border: '1px red solid' } },
                                            [ex.message]
                                        );
                                        document.getElementById(
                                            outputParams.view[parameterId].id
                                        ).innerHTML = errorDisplay;
                                    }
                                })
                            );
                        }
                    })
                    .then(() => {
                        if (parameterParams.layout.length === 0) {
                            // TODO: should be own node
                            places.parameterFields.innerHTML = span(
                                { style: { fontStyle: 'italic' } },
                                'No parameters for this app'
                            );
                        } else {
                            places.parameterFields.innerHTML = parameterParams.content;
                            return Promise.all(
                                parameterParams.layout.map((parameterId) => {
                                    const spec = parameterParams.paramMap[parameterId];
                                    try {
                                        return makeFieldWidget(
                                            appSpec,
                                            spec,
                                            model.getItem(['params', spec.id])
                                        ).then((widget) => {
                                            widgets.push(widget);

                                            return widget.start({
                                                node: document.getElementById(
                                                    parameterParams.view[spec.id].id
                                                ),
                                            });
                                        });
                                    } catch (ex) {
                                        console.error('Error making input field widget', ex);
                                        const errorDisplay = div(
                                            { style: { border: '1px red solid' } },
                                            [ex.message]
                                        );
                                        document.getElementById(
                                            parameterParams.view[spec.id].id
                                        ).innerHTML = errorDisplay;
                                    }
                                })
                            );
                        }
                    })
                    .then(() => {
                        renderAdvanced('input-objects');
                        renderAdvanced('parameters');
                    });
            });
        }

        function start(arg) {
            return Promise.try(() => {
                // parent will send us our initial parameters
                doAttach(arg.node);

                model.setItem('appSpec', arg.appSpec);
                model.setItem('parameters', arg.parameters);
                model.setItem('converted', arg.converted);
                model.setItem('params', arg.params);

                // we then create our widgets
                renderParameters()
                    .then(() => {
                        // do something after success
                        attachEvents();
                    })
                    .catch((err) => {
                        // do somethig with the error.
                        console.error('ERROR in start', err);
                    });

                paramsBus.on('parameter-changed', (message) => {
                    // Also, tell each of our inputs that a param has changed.
                    // TODO: use the new key address and subscription
                    // mechanism to make this more efficient.
                    widgets.forEach((widget) => {
                        widget.bus.send(message, {
                            key: {
                                type: 'parameter-changed',
                                parameter: message.parameter,
                            },
                        });
                    });
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                // really unhook things here.
            });
        }

        // CONSTRUCTION

        bus = runtime.bus().makeChannelBus({ description: 'A app params widget' });

        return {
            start: start,
            stop: stop,
            bus: function () {
                return bus;
            },
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
