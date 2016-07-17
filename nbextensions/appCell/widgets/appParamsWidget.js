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
    './fieldWidget',
    'widgets/appWidgets/paramInputResolver',

    'common/runtime'
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
            ui,
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
         * - input app - input, select
         */


        // RENDERING

        function makeFieldWidget(parameterSpec, value) {
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
                    console.log('GOT?', message);
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
                    parameterSpec: parameterSpec,
                    bus: fieldBus,
                    workspaceId: workspaceInfo.id
                })
            };
        }

        function renderAdvanced(area) {
            
            // area is either "input" or "parameter"
            
            var areaElement = area + '-area',
                areaSelector = '[data-element="' + areaElement + '"]',
                advancedInputs = container.querySelectorAll(areaSelector + ' [data-advanced-parameter]');
            if (advancedInputs.length === 0) {
                ui.setContent([areaElement, 'advanced-hidden-message'], '');
                // ui.disableButton('toggle-advanced');
                return;
            }
            
//            ui.enableButton('toggle-advanced');

            var removeClass = (settings.showAdvanced ? 'advanced-parameter-hidden' : 'advanced-parameter-showing'),
                addClass = (settings.showAdvanced ? 'advanced-parameter-showing' : 'advanced-parameter-hidden');
            for (var i = 0; i < advancedInputs.length; i += 1) {
                var input = advancedInputs[i];
                input.classList.remove(removeClass);
                input.classList.add(addClass);
            }
//
//            // How many advanaced?
//
//            // Also update the button
//            var button = container.querySelector('[data-button="toggle-advanced"]');
//            button.innerHTML = (settings.showAdvanced ? 'Hide Advanced' : 'Show Advanced (' + advancedInputs.length + ' hidden)');

            // Also update the count in the paramters.
            var events = Events.make({node: container});
            
            var message;
            if (settings.showAdvanced) {
                if (advancedInputs.length > 1) {
                    message = String(advancedInputs.length) + ' advanced parameters showing';
                } else {
                    message = String(advancedInputs.length) + ' advanced parameter showing';
                }
                var showAdvancedButton = ui.buildButton({
                    label: 'hide advanced',
                    type: 'link',
                    name: 'advanced-parameters-toggler',
                    eventType: 'toggle-advanced',
                    events: events
                });
                
                ui.setContent([areaElement, 'advanced-hidden-message'], '(' + message + ') ' + showAdvancedButton);
            } else {
                if (advancedInputs.length > 1) {
                    message = String(advancedInputs.length) + ' advanced parameters hidden';
                } else {
                    message = String(advancedInputs.length) + ' advanced parameter hidden';
                }
                var showAdvancedButton = ui.buildButton({
                    label: 'show advanced',
                    type: 'link',
                    name: 'advanced-parameters-toggler',
                    eventType: 'toggle-advanced',
                    events: events
                });
                
                ui.setContent([areaElement, 'advanced-hidden-message'], '(' + message + ') ' + showAdvancedButton);
            }
            
            events.attachEvents();
        }

        function renderLayout() {
            var events = Events.make(),
                content = form({dataElement: 'input-widget-form'}, [
                    ui.buildPanel({
                        type: 'default',
                        body: [
                            // ui.makeButton('Show Advanced', 'toggle-advanced', {events: events}),
                            ui.makeButton('Reset to Defaults', 'reset-to-defaults', {events: events})
                        ],
                        classes: ['kb-panel-light']
                    }),
                    ui.buildPanel({
                        title: span(['Input Objects', span({dataElement: 'advanced-hidden-message', style: {marginLeft: '6px', fontStyle: 'italic'}})]),
                        name: 'input-objects-area',
                        body: div({dataElement: 'input-fields'}),
                        classes: ['kb-panel-light']
                    }),
                    // ui.makePanel('Input Objects', 'input-fields'),
                    ui.buildPanel({
                        title: span(['Parameters', span({dataElement: 'advanced-hidden-message', style: {marginLeft: '6px', fontStyle: 'italic'}})]),
                        name: 'parameters-area',
                        body: div({dataElement: 'parameter-fields'}),
                        classes: ['kb-panel-light']
                    }),
                    ui.buildPanel({
                        title: 'Output Objects',
                        name: 'output-objects-area',
                        body: div({dataElement: 'output-fields'}),
                        classes: ['kb-panel-light']
                    })
                        // ui.makePanel('Output Report', 'output-report')
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
                renderAdvanced('input-objects');
                renderAdvanced('parameters');
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

        function renderParameters(params) {
            // First get the app specs, which is stashed in the model,
            // with the parameters returned.
            // Separate out the params into the primary groups.


            return Promise.try(function () {
                var params = validateParameterSpecs(model.getItem('parameters')),
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
                                    // TRY Throwing up
                                    // or not: throw new Error('Error making input field widget: ' + ex.message);
                                    var errorDisplay = div({style: {border: '1px red solid'}}, [
                                        ex.message
                                    ]);
                                    places.inputFields.appendChild(ui.createNode(errorDisplay));
                                }
                            }));
                        }
                    })
                    .then(function () {
                        if (outputParams.length === 0) {
                            places.outputFields.innerHTML = span({style: {fontStyle: 'italic'}}, 'No output objects for this app');
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
                                    // throw new Error('Error making output field widget: ' + ex.message);
                                    var errorDisplay = div({style: {border: '1px red solid'}}, [
                                        ex.message
                                    ]);
                                    places.outputFields.appendChild(ui.createNode(errorDisplay));
                                }
                            }));
                        }
                    })
                    .then(function () {
                        // Show the user that a report object will be created. Otherwise it may seem weird that there is
                        // no way to specify the output object
                        //if (env.appSpec) {
                        //    +++
                        // }
                    })
                    .then(function () {
                        if (parameterParams.length === 0) {
                            // TODO: should be own node
                            ui.setContent('parameter-fields', span({style: {fontStyle: 'italic'}}, 'No parameters for this app'));
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
                                    console.error('Error making parameter field widget', ex);
                                    var errorDisplay = div({style: {border: '1px red solid'}}, [
                                        ex.message
                                    ]);
                                    places.parameterFields.appendChild(ui.createNode(errorDisplay));
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
                        renderAdvanced('input-objects');
                        renderAdvanced('parameters');
                    });
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
                    bus.send(message, {
                        key: {
                            type: 'parameter-changed',
                            parameter: message.parameter
                        }
                    });
                    // bus.emit('parameter-changed', message);
                });
            });


        }

        function stop() {

        }

        // CONSTRUCTION

        bus = runtime.bus().makeChannelBus(null, 'A app params widget');


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
