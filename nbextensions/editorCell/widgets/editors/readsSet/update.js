/*global define*/
/*jslint white:true,browser:true*/

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
    './model'
    // All the input widgets

], function(
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
) {
    'use strict';

    var t = html.tag,
        form = t('form'),
        div = t('div');
    // bus = runtime.bus().makeChannelBus({ description: 'A app params widget' });

    function factory(config) {
        var runtime = Runtime.make(),
            parentBus = config.bus,
            workspaceInfo = config.workspaceInfo,
            appId = config.appId,
            appTag = config.appTag,
            hostNode, container,
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

            return paramResolver.loadInputControl(parameterSpec)
                .then(function(inputWidget) {

                    var fieldWidget = FieldWidget.make({
                        inputControlFactory: inputWidget,
                        showHint: true,
                        useRowHighight: true,
                        initialValue: value,
                        appSpec: appSpec,
                        parameterSpec: parameterSpec,
                        workspaceId: workspaceInfo.id,
                        referenceType: 'ref'
                    });

                    fieldWidgets.push(fieldWidget);

                    // Forward all changed parameters to the controller. That is our main job!
                    fieldWidget.bus.on('changed', function(message) {
                        parentBus.emit('parameter-changed', {
                            parameter: parameterSpec.id,
                            newValue: message.newValue
                        });
                    });

                    fieldWidget.bus.on('touched', function() {
                        parentBus.emit('parameter-touched', {
                            parameter: parameterSpec.id
                        });
                    });


                    // An input widget may ask for the current model value at any time.
                    fieldWidget.bus.on('sync', function() {
                        parentBus.emit('parameter-sync', {
                            parameter: parameterSpec.id
                        });
                    });

                    fieldWidget.bus.on('sync-params', function(message) {
                        parentBus.emit('sync-params', {
                            parameters: message.parameters,
                            replyToChannel: fieldWidget.bus.channelName
                        });
                    });


                    /*
                     * Or in fact any parameter value at any time...
                     */
                    fieldWidget.bus.on('get-parameter-value', function(message) {
                        parentBus.request({
                                parameter: message.parameter
                            }, {
                                key: 'get-parameter-value'
                            })
                            .then(function(message) {
                                channel.emit('parameter-value', {
                                    parameter: message.parameter
                                });
                            });
                    });

                    //bus.on('parameter-value', function (message) {
                    //    bus.emit('parameter-value', message);
                    //});

                    fieldWidget.bus.respond({
                        key: {
                            type: 'get-parameter'
                        },
                        handle: function(message) {
                            if (message.parameterName) {
                                return parentBus.request(message, {
                                    key: {
                                        type: 'get-parameter'
                                    }
                                });
                            } else {
                                return null;
                            }
                        }
                    });

                    // Just pass the update along to the input widget.
                    parentBus.listen({
                        key: {
                            type: 'update',
                            parameter: parameterSpec.id
                        },
                        handle: function(message) {
                            fieldWidget.bus.emit('update', {
                                value: message.value
                            });
                        }
                    });


                    // just forward...
                    //bus.on('newstate', function (message) {
                    //    inputWidgetBus.send(message);
                    //});
                    return {
                        bus: channel,
                        widget: fieldWidget
                    };
                });
        }

        function buildLayout(events) {
            return form({ dataElement: 'input-widget-form' }, [
                div({ dataElement: 'field-area' }, [
                    div({ dataElement: 'fields' })
                ])
            ]);
        }

        // MESSAGE HANDLERS



        // EVENTS

        function attachEvents() {
            channel.on('reset-to-defaults', function() {
                fieldWidgets.forEach(function(fieldWidget) {
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
            return params.map(function(spec) {
                return validateParameterSpec(spec);
            });
        }

        // LIFECYCLE API

        // Just a simple row layout.
        function renderEditorLayout() {
            var view = {};
            var parameterLayout = model.getItem('parameters.parameters.layout');
            var layout = parameterLayout.map(function(parameterId) {
                var id = html.genId();
                view[parameterId] = {
                    id: id
                };

                return div({
                    id: id,
                    dataParameter: parameterId
                });
            }).join('\n');

            return {
                view: view,
                content: layout
            };
        }

        function renderParameters() {
            var appSpec = model.getItem('appSpec');
            var parameterSpecs = model.getItem('parameters');
            var layout = renderEditorLayout();

            ui.setContent('fields', layout.content);

            return Promise.all(parameterSpecs.parameters.layout.map(function(parameterId) {
                var spec = parameterSpecs.parameters.specs[parameterId];
                try {
                    return makeFieldWidget(appSpec, spec, model.getItem(['params', spec.id]))
                        .then(function(result) {
                            widgets.push(result);

                            return result.widget.start({
                                node: document.getElementById(layout.view[parameterId].id)
                            });
                        });
                } catch (ex) {
                    console.error('Error making input field widget', ex);
                    var errorDisplay = div({ style: { border: '1px red solid' } }, [
                        ex.message
                    ]);
                    document.getElementById(layout.view[parameterId].id).innerHTML = errorDisplay;
                }
            }));
        }

        function doAttach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
            ui = UI.make({
                node: container,
                bus: channel
            });
            var events = Events.make({
                node: container
            });
            container.innerHTML = buildLayout(events);
            events.attachEvents(container);
        }

        function start(arg) {
            readsSetModel = ReadsSetModel.make({
                runtime: runtime,
                appId: appId,
                appTag: appTag
            });
            return readsSetModel.start()
                .then(function() {

                    doAttach(arg.node);

                    model.setItem('appSpec', arg.appSpec);
                    model.setItem('parameters', arg.parameters);
                    model.setItem('params', config.initialValue);

                    // we then create our widgets
                    renderParameters()
                        .then(function() {
                            // do something after success
                            attachEvents();
                        })
                        .catch(function(err) {
                            // do somethig with the error.
                            console.error('ERROR in start', err);
                        });

                    // TODO: probably unused, unnecessary.
                    // Used to communicate changes to a parameter from outside,
                    channel.on('parameter-changed', function(message) {
                        // Also, tell each of our inputs that a param has changed.
                        // TODO: use the new key address and subscription
                        // mechanism to make this more efficient.
                        fieldWidgets.forEach(function(fieldWidget) {
                            fieldWidget.bus.send(message, {
                                key: {
                                    type: 'parameter-changed',
                                    parameter: message.parameter
                                }
                            });
                            // bus.emit('parameter-changed', message);
                        });
                    });
                });
        }

        function stop() {
            return Promise.try(function() {
                    // stop our comm bus
                    busConnection.stop();

                    // Stop all of the param field widgets.
                    return Promise.all(fieldWidgets.map(function(fieldWidget) {
                            return fieldWidget.stop();
                        }))
                        .then(function() {
                            fieldWidgets = [];
                        });

                })
                .then(function() {
                    if (hostNode && container) {
                        try {
                            hostNode.removeChild(container);
                        } catch (ex) {
                            console.warn('Error removing container from update editor widget', ex);
                        }
                    }
                })
        }

        // CONSTRUCTION

        return {
            start: start,
            stop: stop,
            bus: channel
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});