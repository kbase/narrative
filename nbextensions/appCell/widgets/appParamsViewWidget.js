/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    // CDN
    'kb_common/html',
    // LOCAL
    'common/ui',
    'common/runtime',
    'common/events',
    'common/props',
    // Wrapper for inputs
    './inputWrapperWidget',
    'widgets/appWidgets/fieldWidget',
    // Display widgets
    'widgets/appWidgets/paramDisplayResolver'

], function (
    Promise,
    html,
    UI,
    Runtime,
    Events,
    Props,
    //Wrappers
    RowWidget,
    FieldWidget,
    ParamResolver
    ) {
    'use strict';

    var t = html.tag,
        form = t('form'), span = t('span'), div = t('div');

    function factory(config) {
        var runtime = Runtime.make(),
            parentBus = config.bus,
            cellId = config.cellId,
            workspaceInfo = config.workspaceInfo,
            container,
            ui,
            bus,
            places,
            model = Props.make(),
            inputBusses = [],
            settings = {
                showAdvanced: null
            },

            paramResolver = ParamResolver.make();

        // DATA

        /*
         * The input control widget is selected based on these parameters:
         * - data type - (text, int, float, workspaceObject (ref, name)
         * - input app - input, select
         */


        // RENDERING

        function makeFieldWidget(parameterSpec, value) {
            var bus = runtime.bus().makeChannelBus(null, 'Params view input bus comm widget'),
                inputWidget = paramResolver.getWidgetFactory(parameterSpec);

            inputBusses.push(bus);

            // An input widget may ask for the current model value at any time.
            bus.on('sync', function () {
                parentBus.emit('parameter-sync', {
                    parameter: parameterSpec.id()
                });
            });
            
            parentBus.listen({
              key: {
                type: 'update',
                parameter: parameterSpec.id()
              },
              handle: function (message) {
                bus.emit('update', {
                  value: message.value
                });
              }
            });

            // Just pass the update along to the input widget.
            // TODO: commented out, is it even used?
            // parentBus.listen({
            //     test: function (message) {
            //         var pass = (message.type === 'update' && message.parameter === parameterSpec.id());
            //         return pass;
            //     },
            //     handle: function (message) {
            //         bus.send(message);
            //     }
            // });

            return FieldWidget.make({
                inputControlFactory: inputWidget,
                showHint: true,
                useRowHighight: true,
                initialValue: value,
                parameterSpec: parameterSpec,
                bus: bus,
                workspaceId: workspaceInfo.id
            });
        }

        function renderAdvanced() {
            var advancedInputs = container.querySelectorAll('[data-advanced-parameter]');
            if (advancedInputs.length === 0) {
                return;
            }
            var removeClass = (settings.showAdvanced ? 'advanced-parameter-hidden' : 'advanced-parameter-showing'),
                addClass = (settings.showAdvanced ? 'advanced-parameter-showing' : 'advanced-parameter-hidden');
            for (var i = 0; i < advancedInputs.length; i += 1) {
                var input = advancedInputs[i];
                input.classList.remove(removeClass);
                input.classList.add(addClass);
            }

            // How many advanaced?

            // Also update the button
            var button = container.querySelector('[data-button="toggle-advanced"]');
            button.innerHTML = (settings.showAdvanced ? 'Hide Advanced' : 'Show Advanced (' + advancedInputs.length + ' hidden)');

            // Also update the
        }

        function renderLayout() {
            var events = Events.make(),
                content = form({dataElement: 'input-widget-form'}, [
                    ui.buildPanel({
                        type: 'default',
                        classes: 'kb-panel-light',
                        body: [
                            ui.makeButton('Show Advanced', 'toggle-advanced', {events: events})
                        ]
                    }),
                    ui.buildPanel({
                        title: 'Inputs',
                        body: div({dataElement: 'input-fields'}),
                        classes: ['kb-panel-container']
                    }),
                    ui.buildPanel({
                        title: span(['Parameters', span({dataElement: 'advanced-hidden'})]), 
                        body: div({dataElement: 'parameter-fields'}),
                        classes: ['kb-panel-container']
                    }),
                    ui.buildPanel({
                        title: 'Outputs', 
                        body: div({dataElement: 'output-fields'}),
                        classes: ['kb-panel-container']
                    })
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
                inputFields: ui.getElement('input-fields'),
                outputFields: ui.getElement('output-fields'),
                parameterFields: ui.getElement('parameter-fields'),
                advancedParameterFields: ui.getElement('advanced-parameter-fields')
            };
        }

        // EVENTS

        function attachEvents() {
            bus.on('reset-to-defaults', function () {
                inputBusses.forEach(function (inputBus) {
                    inputBus.send({
                        type: 'reset-to-defaults'
                    });
                });
            });
            bus.on('toggle-advanced', function () {
                settings.showAdvanced = !settings.showAdvanced;
                renderAdvanced();
            });
        }

        // LIFECYCLE API

        function renderParameters(params) {
            var widgets = [];
            // First get the app specs, which is stashed in the model,
            // with the parameters returned.
            // Separate out the params into the primary groups.
            var params = model.getItem('parameters'),
                inputParams = params.filter(function (spec) {
                    return (spec.spec.ui_class === 'input');
                }),
                outputParams = params.filter(function (spec) {
                    return (spec.spec.ui_class === 'output');
                }),
                parameterParams = params.filter(function (spec) {
                    return (spec.spec.ui_class === 'parameter');
                });

            return Promise.resolve()
                .then(function () {
                    if (inputParams.length === 0) {
                        places.inputFields.innerHTML = span({style: {fontStyle: 'italic'}}, 'No input objects for this app');
                    } else {
                        return Promise.all(inputParams.map(function (spec) {
                            var fieldWidget = makeFieldWidget(spec, model.getItem(['params', spec.name()])),
                                rowWidget = RowWidget.make({widget: fieldWidget, spec: spec}),
                                rowNode = document.createElement('div');
                            places.inputFields.appendChild(rowNode);
                            widgets.push(rowWidget);
                            rowWidget.attach(rowNode);
                        }));
                    }
                })
                .then(function () {
                    if (outputParams.length === 0) {
                        places.outputFields.innerHTML = span({style: {fontStyle: 'italic'}}, 'No output objects for this app');
                    } else {
                        return Promise.all(outputParams.map(function (spec) {
                            var fieldWidget = makeFieldWidget(spec, model.getItem(['params', spec.name()])),
                                rowWidget = RowWidget.make({widget: fieldWidget, spec: spec}),
                                rowNode = document.createElement('div');
                            places.outputFields.appendChild(rowNode);
                            widgets.push(rowWidget);
                            rowWidget.attach(rowNode);
                        }));
                    }
                })
                .then(function () {
                    if (parameterParams.length === 0) {
                        ui.setContent('parameter-fields', span({style: {fontStyle: 'italic'}}, 'No parameters for this app'));
                    } else {
                        return Promise.all(parameterParams.map(function (spec) {
                            var fieldWidget = makeFieldWidget(spec, model.getItem(['params', spec.name()])),
                                rowWidget = RowWidget.make({widget: fieldWidget, spec: spec}),
                                rowNode = document.createElement('div');
                            places.parameterFields.appendChild(rowNode);
                            widgets.push(rowWidget);
                            rowWidget.attach(rowNode);
                        }));
                    }
                })
                .then(function () {
                    return Promise.all(widgets.map(function (widget) {
                        return widget.start();
                    }));
                })
                .then(function () {
                    return Promise.all(widgets.map(function (widget) {
                        return widget.run(params);
                    }));
                })
                .then(function () {
                    renderAdvanced();
                });
        }

        function start() {
            // send parent the ready message
            return Promise.try(function () {
                parentBus.emit('ready');

                // parent will send us our initial parameters
                parentBus.on('run', function (message) {
                    doAttach(message.node);

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
            });
        }

        function stop() {
            return Promise.try(function () {
                // unregister listerrs...
            });
        }

        // CONSTRUCTION

        bus = runtime.bus().makeChannelBus(null, 'params view own bus');


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
