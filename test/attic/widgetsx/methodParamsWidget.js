/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    // CDN
    'kb_common/html',
    // LOCAL
    '../dom',
    '../events',
    '../props',
    // Wrapper for inputs
    './inputWrapperWidget',
    './fieldWidget',
    './paramInputResolver',
    '../runtime'
        // All the input widgets

], function (
    Promise,
    html,
    Dom,
    Events,
    Props,
    //Wrappers
    RowWidget,
    FieldWidget,
    ParamResolver,
    Runtime

    // Input widgets
    ) {
    'use strict';

    var t = html.tag,
        form = t('form'), span = t('span'), div = t('div');

    function factory(config) {
        var runtime = Runtime.make(),
            parentBus = config.bus,
            workspaceInfo = config.workspaceInfo,
            container,
            dom,
            bus,
            places,
            model = Props.make(),
            inputBusses = [],
            paramResolver = ParamResolver.make(),
            settings = {
                showAdvanced: null
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
         * - input method - input, select
         */


        // RENDERING

        function makeFieldWidget(parameterSpec, value) {
            var bus = runtime.bus().makeChannelBus(),
                inputWidget = paramResolver.getInputWidgetFactory(parameterSpec);

            inputBusses.push(bus);

            // Forward all changed parameters to the controller. That is our main job!
            bus.on('changed', function (message) {
                parentBus.emit('parameter-changed', {
                    parameter: parameterSpec.id(),
                    newValue: message.newValue
                });
            });


            // An input widget may ask for the current model value at any time.
            bus.on('sync', function () {
                parentBus.emit('parameter-sync', {
                    parameter: parameterSpec.id()
                });
            });

            // Just pass the update along to the input widget.
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
                    parameterSpec: parameterSpec,
                    bus: bus,
                    workspaceId: workspaceInfo.id
                })
            };
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
                    dom.buildPanel({
                        title: 'Options',
                        type: 'default',
                        body: [
                            dom.makeButton('Show Advanced', 'toggle-advanced', {events: events}),
                            dom.makeButton('Reset to Defaults', 'reset-to-defaults', {events: events})
                        ]
                    }),
                    dom.makePanel('Inputs', 'input-fields'),
                    dom.makePanel('Outputs', 'output-fields'),
                    dom.makePanel(span(['Parameters', span({dataElement: 'advanced-hidden'})]), 'parameter-fields')
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
            bus.on('reset-to-defaults', function () {
                inputBusses.forEach(function (inputBus) {
                    inputBus.emit('reset-to-defaults');
                });
            });
            bus.on('toggle-advanced', function () {
                // we can just do that here? Or defer to the inputs?
                // I don't know ...
                //inputBusses.forEach(function (bus) {
                //    bus.send({
                //        type: 'toggle-advanced'
                //    });
                //});
                settings.showAdvanced = !settings.showAdvanced;
                renderAdvanced();
            });
            parentBus.on('workspace-changed', function () {
                // tell each input widget about this amazing event!
                widgets.forEach(function (widget) {
                    widget.bus.emit('workspace-changed');
                });
            });
        }

        // LIFECYCLE API

        function renderParameters(params) {
            // First get the method specs, which is stashed in the model,
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
                        places.inputFields.innerHTML = 'No inputs';
                    } else {
                        return Promise.all(inputParams.map(function (spec) {
                            try {
                                var result = makeFieldWidget(spec, model.getItem(['params', spec.name()])),
                                    rowWidget = RowWidget.make({widget: result.widget, spec: spec}),
                                    rowNode = document.createElement('div');
                                places.inputFields.appendChild(rowNode);
                                widgets.push({
                                    widget: rowWidget,
                                    bus: result.bus
                                });
                                rowWidget.attach(rowNode);
                            } catch (ex) {
                                console.error('Error making input field widget', ex);
                                var errorDisplay = div({style: {border: '1px red solid'}}, [
                                    ex.message
                                ]);
                                places.inputFields.appendChild(dom.createNode(errorDisplay));
                            }
                        }));
                    }
                })
                .then(function () {
                    if (outputParams.length === 0) {
                        places.outputFields.innerHTML = 'No outputs';
                    } else {
                        return Promise.all(outputParams.map(function (spec) {
                            try {
                                var result = makeFieldWidget(spec, model.getItem(['params', spec.name()])),
                                    rowWidget = RowWidget.make({widget: result.widget, spec: spec}),
                                    rowNode = document.createElement('div');
                                places.outputFields.appendChild(rowNode);
                                widgets.push({
                                    widget: rowWidget,
                                    bus: result.bus
                                });
                                rowWidget.attach(rowNode);
                            } catch (ex) {
                                console.error('Error making output field widget', ex);
                                var errorDisplay = div({style: {border: '1px red solid'}}, [
                                    ex.message
                                ]);
                                places.outputFields.appendChild(dom.createNode(errorDisplay));
                            }
                        }));
                    }
                })
                .then(function () {
                    if (parameterParams.length === 0) {
                        places.parameterFields.innerHTML = 'No parameters';
                    } else {
                        return Promise.all(parameterParams.map(function (spec) {
                            try {
                                var result = makeFieldWidget(spec, model.getItem(['params', spec.name()])),
                                    rowWidget = RowWidget.make({widget: result.widget, spec: spec}),
                                    rowNode = document.createElement('div');
                                places.parameterFields.appendChild(rowNode);
                                widgets.push({
                                    widget: rowWidget,
                                    bus: result.bus
                                });
                                rowWidget.attach(rowNode);
                            } catch (ex) {
                                console.error('Error making paramter field widget', ex);
                                var errorDisplay = div({style: {border: '1px red solid'}}, [
                                    ex.message
                                ]);
                                places.parameterFields.appendChild(dom.createNode(errorDisplay));
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
                })
                .then(function () {
                    renderAdvanced();
                });
        }

        function start() {
            // send parent the ready message
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

            parentBus.on('parameter-changed', function (message) {
                // Also, tell each of our inputs that a param has changed.
                // TODO: use the new key address and subscription
                // mechanism to make this more efficient.
                inputBusses.forEach(function (bus) {
                    bus.emit('parameter-changed', message);
                });
            });


        }

        function stop() {

        }

        // CONSTRUCTION

        bus = runtime.bus().makeChannelBus();


        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});
