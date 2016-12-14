/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    // CDN
    'kb_common/html',
    // LOCAL
    'common/dom',
    'common/runtime',
    'common/events',
    'common/props',
    // Wrapper for inputs
    './inputWrapperWidget',
    'widgets/appWidgets2/fieldWidget',
    // Display widgets
    'widgets/appWidgets2/paramDisplayResolver'

], function(
    Promise,
    html,
    Dom,
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
        form = t('form'),
        span = t('span');

    function factory(config) {
        var runtime = Runtime.make(),
            parentBus = config.bus,
            cellId = config.cellId,
            workspaceInfo = config.workspaceInfo,
            container,
            dom,
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
            var bus = runtime.bus().makeChannelBus({ description: 'Params view input bus comm widget' }),
                inputWidget = paramResolver.getWidgetFactory(parameterSpec);

            inputBusses.push(bus);

            // An input widget may ask for the current model value at any time.
            bus.on('sync', function() {
                parentBus.emit('parameter-sync', {
                    parameter: parameterSpec.id()
                });
            });

            parentBus.listen({
                key: {
                    type: 'update',
                    parameter: parameterSpec.id()
                },
                handle: function(message) {
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
                content = form({ dataElement: 'input-widget-form' }, [
                    dom.buildPanel({
                        title: 'Options',
                        type: 'default',
                        body: [
                            dom.makeButton('Show Advanced', 'toggle-advanced', { events: events }),
                        ]
                    }),
                    dom.makePanel('Inputs', 'input-fields'),
                    dom.makePanel(span(['Parameters', span({ dataElement: 'advanced-hidden' })]), 'parameter-fields'),
                    dom.makePanel('Outputs', 'output-fields')
                ]);

            return {
                content: content,
                events: events
            };
        }

        // MESSAGE HANDLERS

        function doAttach(node) {
            container = node;
            dom = Dom.make({
                node: container,
                bus: bus
            });
            var layout = renderLayout();
            container.innerHTML = layout.content;
            layout.events.attachEvents(container);
            places = {
                inputFields: dom.getElement('input-fields'),
                outputFields: dom.getElement('output-fields'),
                parameterFields: dom.getElement('parameter-fields'),
                advancedParameterFields: dom.getElement('advanced-parameter-fields')
            };
        }

        // EVENTS

        function attachEvents() {
            bus.on('reset-to-defaults', function() {
                inputBusses.forEach(function(inputBus) {
                    inputBus.send({
                        type: 'reset-to-defaults'
                    });
                });
            });
            bus.on('toggle-advanced', function() {
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
                inputParams = params.filter(function(spec) {
                    return (spec.spec.ui_class === 'input');
                }),
                outputParams = params.filter(function(spec) {
                    return (spec.spec.ui_class === 'output');
                }),
                parameterParams = params.filter(function(spec) {
                    return (spec.spec.ui_class === 'parameter');
                });

            return Promise.resolve()
                .then(function() {
                    if (inputParams.length === 0) {
                        places.inputFields.innerHTML = 'No inputs';
                    } else {
                        return Promise.all(inputParams.map(function(spec) {
                            var fieldWidget = makeFieldWidget(spec, model.getItem(['params', spec.name()])),
                                rowWidget = RowWidget.make({ widget: fieldWidget, spec: spec }),
                                rowNode = document.createElement('div');
                            places.inputFields.appendChild(rowNode);
                            widgets.push(rowWidget);
                            rowWidget.attach(rowNode);
                        }));
                    }
                })
                .then(function() {
                    if (outputParams.length === 0) {
                        places.outputFields.innerHTML = 'No outputs';
                    } else {
                        return Promise.all(outputParams.map(function(spec) {
                            var fieldWidget = makeFieldWidget(spec, model.getItem(['params', spec.name()])),
                                rowWidget = RowWidget.make({ widget: fieldWidget, spec: spec }),
                                rowNode = document.createElement('div');
                            places.outputFields.appendChild(rowNode);
                            widgets.push(rowWidget);
                            rowWidget.attach(rowNode);
                        }));
                    }
                })
                .then(function() {
                    if (parameterParams.length === 0) {
                        places.parameterFields.innerHTML = 'No parameters';
                    } else {
                        return Promise.all(parameterParams.map(function(spec) {
                            var fieldWidget = makeFieldWidget(spec, model.getItem(['params', spec.name()])),
                                rowWidget = RowWidget.make({ widget: fieldWidget, spec: spec }),
                                rowNode = document.createElement('div');
                            places.parameterFields.appendChild(rowNode);
                            widgets.push(rowWidget);
                            rowWidget.attach(rowNode);
                        }));
                    }
                })
                .then(function() {
                    return Promise.all(widgets.map(function(widget) {
                        return widget.start();
                    }));
                })
                .then(function() {
                    return Promise.all(widgets.map(function(widget) {
                        return widget.run(params);
                    }));
                })
                .then(function() {
                    renderAdvanced();
                });
        }

        function start() {
            // send parent the ready message
            parentBus.emit('ready');

            // parent will send us our initial parameters
            parentBus.on('run', function(message) {
                doAttach(message.node);

                model.setItem('parameters', message.parameters);

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
        }

        function stop() {

        }

        // CONSTRUCTION

        bus = runtime.bus().makeChannelBus({ description: 'params view own bus' });


        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});