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
    'widgets/appWidgets2/inputParamResolver',
    'common/runtime',
    './readsSetModel'
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
        span = t('span'),
        div = t('div');

    function factory(config) {
        var runtime = Runtime.make(),
            parentBus = config.bus,
            workspaceInfo = config.workspaceInfo,
            appId = config.appId,
            appTag = config.appTag,
            container,
            ui,
            bus,
            places,
            model = Props.make(),
            inputBusses = [],
            paramResolver = ParamResolver.make(),
            settings = {
                showAdvanced: null
            },
            widgets = [],
            readsSetModel;


        // DATA
        function updateEditor(objectRef) {
            var setApiClient = new GenericClient({
                    url: runtime.config('services.service_wizard.url'),
                    token: runtime.authToken(),
                    module: 'SetAPI',
                    version: 'dev'
                }),
                params = {
                    ref: objectRef,
                    include_item_info: 1
                };
            return setApiClient.callFunc('get_reads_set_v1', [params])
                .spread(function(setObject) {
                    // Set the params.
                    model.setItem('params', {});
                    model.setItem('params.name', setObject.info[1]);
                    model.setItem('params.description', setObject.data.description);
                    model.setItem('params.items', setObject.data.items.map(function(item) {
                        item.objectInfo = apiUtils.objectInfoToObject(item.info);
                        return item.ref;
                    }));

                    loadUpdateEditor();

                })
                .catch(function(err) {
                    console.error('ERROR getting reads set ', err);
                    console.error(err.detail.replace('\n', '<br>'));
                    loadErrorWidget(err);
                });

        }



        // RENDERING

        function makeFieldWidget(appSpec, parameterSpec, value) {

            return paramResolver.getInputWidgetFactory(parameterSpec)
                .then(function(inputWidget) {

                    var fieldBus = runtime.bus().makeChannelBus(null, 'A field widget');

                    inputBusses.push(fieldBus);

                    // Forward all changed parameters to the controller. That is our main job!
                    fieldBus.on('changed', function(message) {
                        parentBus.emit('parameter-changed', {
                            parameter: parameterSpec.id,
                            newValue: message.newValue
                        });
                    });

                    fieldBus.on('touched', function() {
                        parentBus.emit('parameter-touched', {
                            parameter: parameterSpec.id
                        });
                    });


                    // An input widget may ask for the current model value at any time.
                    fieldBus.on('sync', function() {
                        parentBus.emit('parameter-sync', {
                            parameter: parameterSpec.id
                        });
                    });

                    fieldBus.on('sync-params', function(message) {
                        console.log('request sync params', message);
                        parentBus.emit('sync-params', {
                            parameters: message.parameters,
                            replyToChannel: fieldBus.channelName
                        });
                    });


                    /*
                     * Or in fact any parameter value at any time...
                     */
                    fieldBus.on('get-parameter-value', function(message) {
                        parentBus.request({
                                parameter: message.parameter
                            }, {
                                key: 'get-parameter-value'
                            })
                            .then(function(message) {
                                bus.emit('parameter-value', {
                                    parameter: message.parameter
                                });
                            });
                    });

                    //bus.on('parameter-value', function (message) {
                    //    bus.emit('parameter-value', message);
                    //});

                    fieldBus.respond({
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
                            fieldBus.emit('update', {
                                value: message.value
                            });
                        }
                    });


                    // just forward...
                    //bus.on('newstate', function (message) {
                    //    inputWidgetBus.send(message);
                    //});
                    return {
                        bus: bus,
                        widget: FieldWidget.make({
                            inputControlFactory: inputWidget,
                            showHint: true,
                            useRowHighight: true,
                            initialValue: value,
                            appSpec: appSpec,
                            parameterSpec: parameterSpec,
                            bus: fieldBus,
                            workspaceId: workspaceInfo.id,
                            referenceType: 'ref'
                        })
                    };
                });
        }

        function renderLayout() {
            var events = Events.make(),
                content = form({ dataElement: 'input-widget-form' }, [
                    // Toolbar area
                    //                    ui.buildPanel({
                    //                        type: 'default',
                    //                        classes: ['kb-panel-light'],
                    //                        body: [
                    //                            div('Update Editor')
                    //                            // ui.makeButton('Show Advanced', 'toggle-advanced', {events: events}),
                    //                            // ui.makeButton('Reset to Defaults', 'reset-to-defaults', {events: events})
                    //                        ]
                    //                    }),
                    // Main editor panel
                    div({ dataElement: 'field-area' }, [
                        div({ dataElement: 'fields' })
                    ])
                    //                    ui.buildPanel({
                    //                        title: span(['EDITOR', span({dataElement: 'advanced-hidden-message', style: {marginLeft: '6px', fontStyle: 'italic'}})]), 
                    //                        name: 'field-area',
                    //                        body: div({dataElement: 'fields'}),
                    //                        classes: ['kb-panel-light']
                    //                    })
                ]);

            return {
                content: content,
                events: events
            };
        }

        // MESSAGE HANDLERS

        function doAttach(node) {
            container = node;
            ui = UI.make({
                node: container,
                bus: bus
            });
            var layout = renderLayout();
            container.innerHTML = layout.content;
            layout.events.attachEvents(container);
            places = {
                fields: ui.getElement('fields')
            };
        }

        // EVENTS

        function attachEvents() {
            bus.on('reset-to-defaults', function() {
                inputBusses.forEach(function(inputBus) {
                    inputBus.emit('reset-to-defaults');
                });
            });
            runtime.bus().on('workspace-changed', function() {
                // tell each input widget about this amazing event!
                widgets.forEach(function(widget) {
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
            return params.map(function(spec) {
                return validateParameterSpec(spec);
            });
        }

        // LIFECYCLE API

        // Just a simple row layout.
        function renderEditorLayout() {
            var view = {};
            var parameterLayout = model.getItem('layout');
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
            var parameterLayout = model.getItem('layout');
            var layout = renderEditorLayout();

            places.fields.innerHTML = layout.content;

            return Promise.all(parameterLayout.map(function(parameterId) {
                var spec = parameterSpecs[parameterId];
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

        function start() {
            readsSetModel = ReadsSetModel.make({
                runtime: runtime,
                appId: appId,
                appTag: appTag
            });
            return readsSetModel.start()
                .then(function() {

                    // parent will send us our initial parameters
                    bus.on('run', function(message) {
                        doAttach(message.node);

                        model.setItem('appSpec', message.appSpec);
                        model.setItem('parameters', message.parameters);
                        model.setItem('layout', message.layout);

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
                    });

                    bus.on('parameter-changed', function(message) {
                        // Also, tell each of our inputs that a param has changed.
                        // TODO: use the new key address and subscription
                        // mechanism to make this more efficient.
                        inputBusses.forEach(function(bus) {
                            bus.send(message, {
                                key: {
                                    type: 'parameter-changed',
                                    parameter: message.parameter
                                }
                            });
                            // bus.emit('parameter-changed', message);
                        });
                    });

                    // send parent the ready message
                    console.log('sending ready...');
                    bus.emit('ready');
                });
        }

        function stop() {
            return Promise.resolve();
        }

        // CONSTRUCTION

        bus = runtime.bus().makeChannelBus(null, 'A app params widget');


        return {
            start: start,
            stop: stop,
            bus: bus
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});