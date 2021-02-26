define([
    'bluebird',
    // CDN
    'kb_common/html',
    // LOCAL
    'common/ui',
    'common/events',
    'common/props',
    // Wrapper for inputs
    'widgets/appWidgets2/fieldWidgetCompact',
    'widgets/appWidgets2/paramResolver',
    'common/runtime',
    './model',
    // All the input widgets
], (
    Promise,
    html,
    UI,
    Events,
    Props,
    //Wrappers
    FieldWidget,
    ParamResolver,
    Runtime,
    ReadsSetModel

    // Input widgets
) => {
    'use strict';

    const t = html.tag,
        form = t('form'),
        div = t('div');
    // bus = runtime.bus().makeChannelBus({ description: 'A app params widget' });

    function factory(config) {
        let runtime = Runtime.make(),
            parentBus = config.bus,
            workspaceInfo = config.workspaceInfo,
            appId = config.appId,
            appTag = config.appTag,
            hostNode,
            container,
            ui,
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(busConnection.genName()),
            model = Props.make(),
            fieldWidgets = [],
            paramResolver = ParamResolver.make(),
            widgets = [],
            readsSetModel;

        // RENDERING

        function makeFieldWidget(appSpec, parameterSpec, value) {
            return paramResolver.loadInputControl(parameterSpec).then((inputWidget) => {
                const fieldWidget = FieldWidget.make({
                    inputControlFactory: inputWidget,
                    showHint: true,
                    useRowHighight: true,
                    initialValue: value,
                    appSpec: appSpec,
                    parameterSpec: parameterSpec,
                    workspaceId: workspaceInfo.id,
                    referenceType: 'ref',
                });

                fieldWidgets.push(fieldWidget);

                // Forward all changed parameters to the controller. That is our main job!
                fieldWidget.bus.on('changed', (message) => {
                    parentBus.emit('parameter-changed', {
                        parameter: parameterSpec.id,
                        newValue: message.newValue,
                    });
                });

                fieldWidget.bus.on('touched', () => {
                    parentBus.emit('parameter-touched', {
                        parameter: parameterSpec.id,
                    });
                });

                // An input widget may ask for the current model value at any time.
                fieldWidget.bus.on('sync', () => {
                    parentBus.emit('parameter-sync', {
                        parameter: parameterSpec.id,
                    });
                });

                fieldWidget.bus.on('sync-params', (message) => {
                    parentBus.emit('sync-params', {
                        parameters: message.parameters,
                        replyToChannel: fieldWidget.bus.channelName,
                    });
                });

                /*
                 * Or in fact any parameter value at any time...
                 */
                fieldWidget.bus.on('get-parameter-value', (message) => {
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
                            channel.emit('parameter-value', {
                                parameter: message.parameter,
                            });
                        });
                });

                //bus.on('parameter-value', function (message) {
                //    bus.emit('parameter-value', message);
                //});

                fieldWidget.bus.respond({
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
                        parameter: parameterSpec.id,
                    },
                    handle: function (message) {
                        fieldWidget.bus.emit('update', {
                            value: message.value,
                        });
                    },
                });

                // just forward...
                //bus.on('newstate', function (message) {
                //    inputWidgetBus.send(message);
                //});
                return {
                    bus: channel,
                    widget: fieldWidget,
                };
            });
        }

        function buildLayout(events) {
            return form({ dataElement: 'input-widget-form' }, [
                div({ dataElement: 'field-area' }, [div({ dataElement: 'fields' })]),
            ]);
        }

        // MESSAGE HANDLERS

        // EVENTS

        function attachEvents() {
            channel.on('reset-to-defaults', () => {
                fieldWidgets.forEach((fieldWidget) => {
                    fieldWidget.bus.emit('reset-to-defaults');
                });
            });
            //runtime.bus().on('workspace-changed', function() {
            // tell each input widget about this amazing event!
            //widgets.forEach(function(widget) {
            //    widget.bus.emit('workspace-changed');
            //});
            // });
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

        // Just a simple row layout.
        function renderEditorLayout() {
            const view = {};
            const parameterLayout = model.getItem('parameters.parameters.layout');
            const layout = parameterLayout
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
                view: view,
                content: layout,
            };
        }

        function renderParameters() {
            const appSpec = model.getItem('appSpec');
            const parameterSpecs = model.getItem('parameters');
            const layout = renderEditorLayout();

            ui.setContent('fields', layout.content);

            return Promise.all(
                parameterSpecs.parameters.layout.map((parameterId) => {
                    const spec = parameterSpecs.parameters.specs[parameterId];
                    try {
                        return makeFieldWidget(
                            appSpec,
                            spec,
                            model.getItem(['params', spec.id])
                        ).then((result) => {
                            widgets.push(result);

                            return result.widget.start({
                                node: document.getElementById(layout.view[parameterId].id),
                            });
                        });
                    } catch (ex) {
                        console.error('Error making input field widget', ex);
                        const errorDisplay = div({ style: { border: '1px red solid' } }, [
                            ex.message,
                        ]);
                        document.getElementById(
                            layout.view[parameterId].id
                        ).innerHTML = errorDisplay;
                    }
                })
            );
        }

        function doAttach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
            ui = UI.make({
                node: container,
                bus: channel,
            });
            const events = Events.make({
                node: container,
            });
            container.innerHTML = buildLayout(events);
            events.attachEvents(container);
        }

        function start(arg) {
            readsSetModel = ReadsSetModel.make({
                runtime: runtime,
                appId: appId,
                appTag: appTag,
            });
            return readsSetModel.start().then(() => {
                doAttach(arg.node);

                model.setItem('appSpec', arg.appSpec);
                model.setItem('parameters', arg.parameters);
                model.setItem('params', config.initialValue);

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

                // TODO: probably unused, unnecessary.
                // Used to communicate changes to a parameter from outside,
                channel.on('parameter-changed', (message) => {
                    // Also, tell each of our inputs that a param has changed.
                    // TODO: use the new key address and subscription
                    // mechanism to make this more efficient.
                    fieldWidgets.forEach((fieldWidget) => {
                        fieldWidget.bus.send(message, {
                            key: {
                                type: 'parameter-changed',
                                parameter: message.parameter,
                            },
                        });
                        // bus.emit('parameter-changed', message);
                    });
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                // stop our comm bus
                busConnection.stop();

                // Stop all of the param field widgets.
                return Promise.all(
                    fieldWidgets.map((fieldWidget) => {
                        return fieldWidget.stop();
                    })
                ).then(() => {
                    fieldWidgets = [];
                });
            }).then(() => {
                if (hostNode && container) {
                    try {
                        hostNode.removeChild(container);
                    } catch (ex) {
                        console.warn('Error removing container from update editor widget', ex);
                    }
                }
            });
        }

        // CONSTRUCTION

        return {
            start: start,
            stop: stop,
            bus: channel,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
