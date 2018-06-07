/*global define*/
/*jslint white:true,browser:true*/

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

    'common/runtime'
    // All the input widgets

], function (
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

    // Input widgets
) {
    'use strict';

    var t = html.tag,
        form = t('form'),
        span = t('span'),
        div = t('div');

    function factory(config) {
        var runtime = Runtime.make(),
            paramsBus = config.bus,
            workspaceInfo = config.workspaceInfo,
            initialParams = config.initialParams,
            container,
            ui,
            bus,
            places = {},
            model = Props.make(),
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

        /*
        The field widget is a generic wrapper around the input. It serves the following purposes:
        - intercepts messages in order to display status.
        */

        function makeFieldWidget(appSpec, parameterSpec, value) {
            return paramResolver.loadInputControl(parameterSpec)
                .then(function (inputWidget) {
                    var fieldWidget = FieldWidget.make({
                        inputControlFactory: inputWidget,
                        showHint: true,
                        useRowHighight: true,
                        initialValue: value,
                        appSpec: appSpec,
                        parameterSpec: parameterSpec,
                        workspaceId: workspaceInfo.id,
                        referenceType: 'name',
                        paramsChannelName: paramsBus.channelName
                    });

                    // Forward all changed parameters to the controller. That is our main job!
                    fieldWidget.bus.on('changed', function (message) {
                        paramsBus.send({
                            parameter: parameterSpec.id,
                            newValue: message.newValue
                        }, {
                            key: {
                                type: 'parameter-changed',
                                parameter: parameterSpec.id
                            }
                        });

                        paramsBus.emit('parameter-changed', {
                            parameter: parameterSpec.id,
                            newValue: message.newValue
                        });
                    });

                    fieldWidget.bus.on('touched', function () {
                        paramsBus.emit('parameter-touched', {
                            parameter: parameterSpec.id
                        });
                    });


                    // An input widget may ask for the current model value at any time.
                    fieldWidget.bus.on('sync', function () {
                        paramsBus.emit('parameter-sync', {
                            parameter: parameterSpec.id
                        });
                    });

                    fieldWidget.bus.on('sync-params', function (message) {
                        paramsBus.emit('sync-params', {
                            parameters: message.parameters,
                            replyToChannel: fieldWidget.bus.channelName
                        });
                    });

                    fieldWidget.bus.on('set-param-state', function (message) {
                        paramsBus.emit('set-param-state', {
                            id: parameterSpec.id,
                            state: message.state
                        });
                    });

                    fieldWidget.bus.respond({
                        key: {
                            type: 'get-param-state'
                        },
                        handle: function (message) {
                            return paramsBus.request({ id: parameterSpec.id }, {
                                key: {
                                    type: 'get-param-state'
                                }
                            });
                        }
                    });


                    /*
                     * Or in fact any parameter value at any time...
                     */
                    fieldWidget.bus.on('get-parameter-value', function (message) {
                        paramsBus.request({
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

                    fieldWidget.bus.respond({
                        key: {
                            type: 'get-parameter'
                        },
                        handle: function (message) {
                            if (message.parameterName) {
                                return paramsBus.request(message, {
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
                    paramsBus.listen({
                        key: {
                            type: 'update',
                            parameter: parameterSpec.id
                        },
                        handle: function (message) {
                            fieldWidget.bus.emit('update', {
                                value: message.value
                            });
                        }
                    });

                    return fieldWidget;
                });
        }

        function renderAdvanced(area) {
            // area is either "input" or "parameter"

            var areaElement = area + '-area',
                areaSelector = '[data-element="' + areaElement + '"]',
                advancedInputs = container.querySelectorAll(areaSelector + ' [data-advanced-parameter]');

            if (advancedInputs.length === 0) {
                ui.setContent([areaElement, 'advanced-hidden-message'], '');
                return;
            }

            var removeClass = (settings.showAdvanced ? 'advanced-parameter-hidden' : 'advanced-parameter-showing'),
                addClass = (settings.showAdvanced ? 'advanced-parameter-showing' : 'advanced-parameter-hidden');
            for (var i = 0; i < advancedInputs.length; i += 1) {
                var input = advancedInputs[i];
                input.classList.remove(removeClass);
                input.classList.add(addClass);

                var actualInput = input.querySelector('[data-element="input"]');
                if (actualInput) {
                    $(actualInput).trigger('advanced-shown.kbase');
                }
            }

            // Also update the count in the paramters.
            var events = Events.make({ node: container });

            var message;
            var showAdvancedButton;
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
                        type: 'toggle-advanced'
                    },
                    events: events
                });

                ui.setContent([areaElement, 'advanced-hidden-message'], '(' + message + ') ' + showAdvancedButton);
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
                        type: 'toggle-advanced'
                    },
                    events: events
                });

                ui.setContent([areaElement, 'advanced-hidden-message'], '(' + message + ') ' + showAdvancedButton);
            }

            events.attachEvents();
        }

        function buildBatchToggleButton(batchMode, events) {
            var classes = [];
            if (batchMode) {
                classes.push('batch-active');
            }
            var btn = ui.buildButton({
                dataElement: 'batch-toggle',
                style: { width: '80px' },
                label: 'Batch',
                name: 'batch-toggle',
                events: events,
                type: 'default',
                classes: classes,
                hidden: false,
                event: {
                    type: 'batch-mode-toggle'
                }
            });
            bus.on('batch-mode-toggle', function(message) {
                paramsBus.emit('toggle-batch-mode');
                ui.getButton('batch-toggle').classList.toggle('batch-active');
            });
            return div({
                class: 'btn-group',
                style: { padding: '3px' },
            }, btn);
        }

        function renderLayout() {
            var events = Events.make(),
                batchToggleBtn = buildBatchToggleButton(batchMode, events),
                formContent = [batchToggleBtn, div('batch mode!')],
                content = form({ dataElement: 'input-widget-form' }, formContent);
            return {
                content: content,
                events: events
            };
        }

        // MESSAGE HANDLERS

        function doAttach(node, batchMode) {
            container = node;
            ui = UI.make({
                node: container,
                bus: bus
            });
            var layout = renderLayout();
            container.innerHTML = layout.content;
            layout.events.attachEvents(container);
            // if (!batchMode) {
            //     places = {
            //         inputFields: ui.getElement('input-fields'),
            //         outputFields: ui.getElement('output-fields'),
            //         parameterFields: ui.getElement('parameter-fields'),
            //         advancedParameterFields: ui.getElement('advanced-parameter-fields')
            //     };
            // }
        }

        // EVENTS

        function attachEvents() {
            bus.on('reset-to-defaults', function () {
                widgets.forEach(function (widget) {
                    widget.bus.emit('reset-to-defaults');
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
            bus.on('toggle-batch-mode', function () {
                alert('batch mode toggled!');
            });
        }

        function makeParamsLayout(params) {
            var view = {};
            var paramMap = {};
            var orderedParams = params.map(function (param) {
                paramMap[param.id] = param;
                return param.id;
            });
            var layout = orderedParams.map(function (parameterId) {
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
                content: layout,
                layout: orderedParams,
                params: params,
                view: view,
                paramMap: paramMap
            };
        }

        // LIFECYCLE API

        function renderParameters() {
            // First get the app specs, which is stashed in the model,
            // with the parameters returned.
            // Separate out the params into the primary groups.
            var appSpec = model.getItem('appSpec');

            return Promise.try(function () {
                var params = model.getItem('parameters'),
                    inputParams = makeParamsLayout(
                        params.layout.filter(function (id) {
                            return (params.specs[id].ui.class === 'input');
                        })
                        .map(function (id) {
                            return params.specs[id];
                        })),
                    outputParams = makeParamsLayout(
                        params.layout.filter(function (id) {
                            return (params.specs[id].ui.class === 'output');
                        })
                        .map(function (id) {
                            return params.specs[id];
                        })),
                    parameterParams = makeParamsLayout(
                        params.layout.filter(function (id) {
                            return (params.specs[id].ui.class === 'parameter');
                        })
                        .map(function (id) {
                            return params.specs[id];
                        }));

                return Promise.resolve()
                    .then(function () {
                        if (inputParams.layout.length === 0) {
                            ui.getElement('input-objects-area').classList.add('hidden');
                            // places.inputFields.innerHTML = span({
                            //     style: {
                            //         fontStyle: 'italic'
                            //     }
                            // }, 'This app does not have input objects');
                        } else {
                            places.inputFields.innerHTML = inputParams.content;
                            return Promise.all(inputParams.layout.map(function (parameterId) {
                                var spec = inputParams.paramMap[parameterId];
                                try {
                                    return makeFieldWidget(appSpec, spec, initialParams[spec.id])
                                        .then(function (widget) {
                                            widgets.push(widget);

                                            return widget.start({
                                                node: document.getElementById(inputParams.view[parameterId].id)
                                            });
                                        });
                                } catch (ex) {
                                    console.error('Error making input field widget', ex);
                                    var errorDisplay = div({
                                        style: {
                                            border: '1px red solid'
                                        }
                                    }, [
                                        ex.message
                                    ]);
                                    document.getElementById(inputParams.view[parameterId].id).innerHTML = errorDisplay;
                                }
                            }));
                        }
                    })
                    .then(function () {
                        if (outputParams.layout.length === 0) {
                            ui.getElement('output-objects-area').classList.add('hidden');
                            // places.outputFields.innerHTML = span({ style: { fontStyle: 'italic' } }, 'This app does not create any named output objects');
                        } else {
                            places.outputFields.innerHTML = outputParams.content;
                            return Promise.all(outputParams.layout.map(function (parameterId) {
                                var spec = outputParams.paramMap[parameterId];
                                try {
                                    return makeFieldWidget(appSpec, spec, initialParams[spec.id])
                                        .then(function (widget) {
                                            widgets.push(widget);

                                            return widget.start({
                                                node: document.getElementById(outputParams.view[parameterId].id)
                                            });
                                        });
                                } catch (ex) {
                                    console.error('Error making input field widget', ex);
                                    var errorDisplay = div({ style: { border: '1px red solid' } }, [
                                        ex.message
                                    ]);
                                    document.getElementById(outputParams.view[parameterId].id).innerHTML = errorDisplay;
                                }
                            }));
                        }
                    })
                    .then(function () {
                        if (parameterParams.layout.length === 0) {
                            // TODO: should be own node
                            ui.getElement('parameters-area').classList.add('hidden');
                            // places.parameterFields.innerHTML = span({ style: { fontStyle: 'italic' } }, 'No parameters for this app');
                        } else {
                            places.parameterFields.innerHTML = parameterParams.content;

                            return Promise.all(parameterParams.layout.map(function (parameterId) {
                                var spec = parameterParams.paramMap[parameterId];
                                try {
                                    return makeFieldWidget(appSpec, spec, initialParams[spec.id])
                                        .then(function (widget) {
                                            widgets.push(widget);

                                            return widget.start({
                                                node: document.getElementById(parameterParams.view[spec.id].id)
                                            });
                                        });
                                } catch (ex) {
                                    console.error('Error making input field widget', ex);
                                    var errorDisplay = div({ style: { border: '1px red solid' } }, [
                                        ex.message
                                    ]);
                                    document.getElementById(parameterParams.view[spec.id].id).innerHTML = errorDisplay;
                                }
                            }));
                        }
                    })
                    .then(function () {
                        renderAdvanced('input-objects');
                        renderAdvanced('parameters');
                    });
            });
        }

        function start(arg) {
            return Promise.try(() => {
                // send parent the ready message

                doAttach(arg.node, batchMode);

                model.setItem('appSpec', arg.appSpec);
                model.setItem('parameters', arg.parameters);

                paramsBus.on('parameter-changed', function (message) {
                    // Also, tell each of our inputs that a param has changed.
                    // TODO: use the new key address and subscription
                    // mechanism to make this more efficient.
                    widgets.forEach(function (widget) {
                        widget.bus.send(message, {
                            key: {
                                type: 'parameter-changed',
                                parameter: message.parameter
                            }
                        });
                        // bus.emit('parameter-changed', message);
                    });
                });

                return Promise.try(() => {
                    attachEvents();
                })
                    .catch((err) => {
                        console.error('ERROR in start', err);
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
            }
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});