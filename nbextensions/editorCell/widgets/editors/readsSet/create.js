define([
    'bluebird',
    // LOCAL
    'common/html',
    'common/ui',
    'common/events',
    'common/props',
    // Wrapper for inputs
    'common/cellComponents/inputWrapperWidget',
    'widgets/appWidgets2/fieldWidget',
    'widgets/appWidgets2/paramResolver',
    'common/runtime',
    // All the input widgets
], (
    Promise,
    html,
    UI,
    Events,
    Props,
    //Wrappers
    RowWidget,
    FieldWidget,
    ParamResolver,
    Runtime

    // Input widgets
) => {
    'use strict';

    const t = html.tag,
        form = t('form'),
        span = t('span'),
        div = t('div');

    function factory(config) {
        const runtime = Runtime.make(),
            parentBus = config.bus,
            workspaceInfo = config.workspaceInfo,
            model = Props.make(),
            inputBusses = [],
            paramResolver = ParamResolver.make(),
            widgets = [],
            bus = runtime.bus().makeChannelBus({ description: 'A app params widget' });

        let container, ui, places;

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

        function makeFieldWidget(appSpec, parameterSpec, value) {
            const fieldBus = runtime.bus().makeChannelBus({ description: 'A field widget' }),
                inputWidget = paramResolver.loadInputControl(parameterSpec);

            inputBusses.push(fieldBus);

            // Forward all changed parameters to the controller. That is our main job!
            fieldBus.on('changed', (message) => {
                parentBus.emit('parameter-changed', {
                    parameter: parameterSpec.id(),
                    newValue: message.newValue,
                });
            });

            // An input widget may ask for the current model value at any time.
            fieldBus.on('sync', () => {
                parentBus.emit('parameter-sync', {
                    parameter: parameterSpec.id(),
                });
            });

            fieldBus.on('sync-params', (message) => {
                // eslint-disable-next-line no-console
                console.log('request sync params', message);
                parentBus.emit('sync-params', {
                    parameters: message.parameters,
                    replyToChannel: fieldBus.channelName,
                });
            });

            /*
             * Or in fact any parameter value at any time...
             */
            fieldBus.on('get-parameter-value', (message) => {
                parentBus
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

            fieldBus.respond({
                key: {
                    type: 'get-parameter',
                },
                handle: function (message) {
                    if (message.parameterName) {
                        return parentBus.request(message, {
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
            parentBus.listen({
                key: {
                    type: 'update',
                    parameter: parameterSpec.id(),
                },
                handle: function (message) {
                    fieldBus.emit('update', {
                        value: message.value,
                    });
                },
            });

            return {
                bus,
                widget: FieldWidget.make({
                    inputControlFactory: inputWidget,
                    showHint: true,
                    useRowHighight: true,
                    initialValue: value,
                    appSpec,
                    parameterSpec,
                    bus: fieldBus,
                    workspaceId: workspaceInfo.id,
                    referenceType: 'ref',
                }),
            };
        }

        function renderLayout() {
            const events = Events.make(),
                content = form({ dataElement: 'input-widget-form' }, [
                    // Toolbar area
                    ui.buildPanel({
                        type: 'default',
                        classes: ['kb-panel-light'],
                        body: [div('Create Set Editor')],
                    }),
                    // Main editor panel
                    div({ dataElement: 'field-area' }, [div({ dataElement: 'fields' })]),
                ]);

            return {
                content,
                events,
            };
        }

        // MESSAGE HANDLERS

        function doAttach(node) {
            container = node;
            ui = UI.make({
                node: container,
                bus,
            });
            const layout = renderLayout();
            container.innerHTML = layout.content;
            layout.events.attachEvents(container);
            places = {
                fields: ui.getElement('fields'),
            };
        }

        // EVENTS

        function attachEvents() {
            bus.on('reset-to-defaults', () => {
                // eslint-disable-next-line no-console
                console.log('resetting...');
                inputBusses.forEach((inputBus) => {
                    inputBus.emit('reset-to-defaults');
                });
            });
            runtime.bus().on('workspace-changed', () => {
                // tell each input widget about this amazing event!
                widgets.forEach((widget) => {
                    widget.bus.emit('workspace-changed');
                });
            });
        }

        // Maybe
        function validateParameterSpec(spec) {
            // ensure that inputs are consistent with inputs

            // and outputs with output

            // and params with param

            // validate type

            return spec;
        }

        function validateParameterSpecs(params) {
            return params.map((spec) => {
                return validateParameterSpec(spec);
            });
        }

        // LIFECYCLE API

        // Editor layout is controled by a simple spec.
        // We are still prototyping this...

        // Render layout per editor type.
        function renderEditorLayout() {
            return div([
                div({ dataParameter: 'name' }),
                div({ dataParameter: 'description' }),
                div({ dataParameter: 'items' }),
            ]);
        }

        function renderParameters() {
            // First get the app spec, which is stashed in the model,
            // with the parameters returned.

            const appSpec = model.getItem('appSpec');

            return Promise.try(() => {
                const params = validateParameterSpecs(model.getItem('parameters'));

                return Promise.resolve()
                    .then(() => {
                        if (params.length === 0) {
                            places.fields.innerHTML = span(
                                { style: { fontStyle: 'italic' } },
                                'No input objects for this app'
                            );
                        } else {
                            // The "fields" becomes the layout.
                            places.fields.innerHTML = renderEditorLayout();

                            return Promise.all(
                                params.map((spec) => {
                                    try {
                                        const result = makeFieldWidget(
                                                appSpec,
                                                spec,
                                                model.getItem(['params', spec.name()])
                                            ),
                                            rowWidget = RowWidget.make({
                                                widget: result.widget,
                                                spec,
                                            }),
                                            rowNode = document.createElement('div');
                                        const rowPlace = document.querySelector(
                                            '[data-parameter="' + spec.name() + '"]'
                                        );
                                        if (!rowPlace) {
                                            console.warn('Parameter not found in layout', spec);
                                            return;
                                        }
                                        rowPlace.appendChild(rowNode);
                                        widgets.push({
                                            widget: rowWidget,
                                            bus: result.bus,
                                        });
                                        rowWidget.attach(rowNode);
                                    } catch (ex) {
                                        console.error('Error making input field widget', ex);
                                        // TRY Throwing up
                                        // or not: throw new Error('Error making input field widget: ' + ex.message);
                                        const errorDisplay = div(
                                            { style: { border: '1px solid red' } },
                                            [ex.message]
                                        );
                                        places.fields.appendChild(ui.createNode(errorDisplay));
                                    }
                                })
                            );
                        }
                    })

                    .then(() => {
                        return Promise.all(
                            widgets.map((widget) => {
                                return widget.widget.start();
                            })
                        );
                    })
                    .then(() => {
                        return Promise.all(
                            widgets.map((widget) => {
                                return widget.widget.run(params);
                            })
                        );
                    });
            });
        }

        function start() {
            return Promise.try(() => {
                // parent will send us our initial parameters
                parentBus.on('run', (message) => {
                    doAttach(message.node);

                    model.setItem('appSpec', message.appSpec);
                    model.setItem('parameters', message.parameters);

                    // TODO: this should be a promise, or emit an event at the
                    // conclusion which triggers a render.
                    bus.emit('reset-to-defaults');

                    // we then create our widgetsfrend
                    renderParameters()
                        .then(() => {
                            // do something after success
                            attachEvents();
                        })
                        .catch((err) => {
                            // do somethig with the error.
                            console.error('ERROR in start', err);
                        });
                });

                parentBus.on('parameter-changed', (message) => {
                    // Also, tell each of our inputs that a param has changed.
                    // TODO: use the new key address and subscription
                    // mechanism to make this more efficient.
                    inputBusses.forEach((bus) => {
                        bus.send(message, {
                            key: {
                                type: 'parameter-changed',
                                parameter: message.parameter,
                            },
                        });
                    });
                });

                // send parent the ready message
                parentBus.emit('ready');
            });
        }

        function stop() {
            return Promise.resolve();
        }

        return {
            start,
            stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
