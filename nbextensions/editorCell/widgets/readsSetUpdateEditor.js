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
    './inputWrapperWidget',
    'widgets/appWidgets/fieldWidget',
    'widgets/appWidgets/paramInputResolver',
    'common/runtime',
    './readsSetModel'
        // All the input widgets

], function (
    Promise,
    html,
    UI,
    Events,
    Props,
    //Wrappers
    RowWidget,
    FieldWidget,
    ParamResolver,
    Runtime,
    ReadsSetModel

    // Input widgets
    ) {
    'use strict';

    var t = html.tag,
        form = t('form'), span = t('span'), div = t('div');

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
                .spread(function (setObject) {
                    // Set the params.
                    model.setItem('params', {});
                    model.setItem('params.name', setObject.info[1]);
                    model.setItem('params.description', setObject.data.description);
                    model.setItem('params.items', setObject.data.items.map(function (item) {
                        item.objectInfo = apiUtils.objectInfoToObject(item.info);
                        return item.ref;
                    }));

                    loadUpdateEditor();

                })
                .catch(function (err) {
                    console.error('ERROR getting reads set ', err);
                    console.error(err.detail.replace('\n', '<br>'));
                    loadErrorWidget(err);
                });

        }
        


        // RENDERING

        function makeFieldWidget(appSpec, parameterSpec, value) {
            var fieldBus = runtime.bus().makeChannelBus(null, 'A field widget'),
                inputWidget = paramResolver.getInputWidgetFactory(parameterSpec);

            inputBusses.push(fieldBus);

            // Forward all changed parameters to the controller. That is our main job!
            fieldBus.on('changed', function (message) {
                parentBus.emit('parameter-changed', {
                    parameter: parameterSpec.id(),
                    newValue: message.newValue
                });
            });


            // An input widget may ask for the current model value at any time.
            fieldBus.on('sync', function () {
                parentBus.emit('parameter-sync', {
                    parameter: parameterSpec.id()
                });
            });
            
            fieldBus.on('sync-params', function (message) {
                console.log('request sync params', message);
                parentBus.emit('sync-params', {
                    parameters: message.parameters,
                    replyToChannel: fieldBus.channelName
                });
            });


            /*
             * Or in fact any parameter value at any time...
             */
            fieldBus.on('get-parameter-value', function (message) {
                parentBus.request({
                    parameter: message.parameter
                }, {
                    key: 'get-parameter-value'
                })
                    .then(function (message) {
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
                handle: function (message) {
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
                    parameter: parameterSpec.id()
                },
                handle: function (message) {
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
        }

        function renderLayout() {
            var events = Events.make(),
                content = form({dataElement: 'input-widget-form'}, [
                    // Toolbar area
                    ui.buildPanel({
                        type: 'default',
                        classes: ['kb-panel-light'],
                        body: [
                            div('Update Editor')
                            // ui.makeButton('Show Advanced', 'toggle-advanced', {events: events}),
                            // ui.makeButton('Reset to Defaults', 'reset-to-defaults', {events: events})
                        ]
                    }),
                    // Main editor panel
                    div({dataElement: 'field-area'}, [
                        div({dataElement: 'fields'})
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
            bus.on('reset-to-defaults', function () {
                inputBusses.forEach(function (inputBus) {
                    inputBus.emit('reset-to-defaults');
                });
            });
            runtime.bus().on('workspace-changed', function () {
                // tell each input widget about this amazing event!
                widgets.forEach(function (widget) {
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
            return params.map(function (spec) {
                return validateParameterSpec(spec);
            });
        }

        // LIFECYCLE API

        // Editor layout is controled by a simple spec.
        // We are still prototyping this...

        // Render layout per editor type.
        function renderEditorLayout() {
            return div([
                div({dataParameter: 'name'}),
                div({dataParameter: 'description'}),
                // div({dataParameter: 'type'}),
                div({dataParameter: 'items'})
            ]);
        }

        function renderParameters(params) {
            // First get the app specs, which is stashed in the model,
            // with the parameters returned.
            // Separate out the params into the primary groups.
            
            var appSpec = model.getItem('appSpec');


            return Promise.try(function () {
                var params = validateParameterSpecs(model.getItem('parameters'));

                return Promise.resolve()
                    .then(function () {
                        if (params.length === 0) {
                            places.fields.innerHTML = span({style: {fontStyle: 'italic'}}, 'No input objects for this app');
                        } else {
                            // The "fields" becomes the layout.
                            places.fields.innerHTML = renderEditorLayout();

                            return Promise.all(params.map(function (spec) {
                                try {
                                    var result = makeFieldWidget(appSpec, spec, model.getItem(['params', spec.name()])),
                                        rowWidget = RowWidget.make({widget: result.widget, spec: spec}),
                                        rowNode = document.createElement('div');
                                    // places.fields.appendChild(rowNode);
                                    var rowPlace = document.querySelector('[data-parameter="' + spec.name() + '"]');
                                    if (!rowPlace) {
                                        console.warn('Parameter not found in layout', spec);
                                        return;
                                    }
                                    rowPlace.appendChild(rowNode);
                                    widgets.push({
                                        widget: rowWidget,
                                        bus: result.bus
                                    });
                                    rowWidget.attach(rowNode);
                                } catch (ex) {
                                    console.error('Error making input field widget', ex);
                                    // TRY Throwing up
                                    // or not: throw new Error('Error making input field widget: ' + ex.message);
                                    var errorDisplay = div({style: {border: '1px red solid'}}, [
                                        ex.message
                                    ]);
                                    places.fields.appendChild(ui.createNode(errorDisplay));
                                }
                            }));
                        }
                    })                   
                    
                    .then(function () {
                        return Promise.all(widgets.map(function (widget) {
                            return widget.widget.start();
                        }));
                    })
                    .then(function () {
                        return Promise.all(widgets.map(function (widget) {
                            return widget.widget.run(params);
                        }));
                    });
            });
        }

        function start() {
            console.log('starting...');
            readsSetModel = ReadsSetModel.make({
                runtime: runtime,
                appId: appId,
                appTag: appTag
            });
            return readsSetModel.start()
                .then(function () {

                    // parent will send us our initial parameters
                    bus.on('run', function (message) {
                        doAttach(message.node);

                        model.setItem('appSpec', message.appSpec);
                        model.setItem('parameters', message.parameters);

                        // we then create our widgets
                        renderParameters()
                            .then(function () {
                                // do something after success
                                attachEvents();
                            })
                            .catch(function (err) {
                                // do somethig with the error.
                                console.error('ERROR in start', err);
                            });
                    });

                    bus.on('parameter-changed', function (message) {
                        // Also, tell each of our inputs that a param has changed.
                        // TODO: use the new key address and subscription
                        // mechanism to make this more efficient.
                        inputBusses.forEach(function (bus) {
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
        make: function (config) {
            return factory(config);
        }
    };
});
