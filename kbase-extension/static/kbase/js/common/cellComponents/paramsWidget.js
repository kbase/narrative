define([
    'bluebird',
    'jquery',
    // CDN
    'common/html',
    // LOCAL
    'common/ui',
    'common/events',
    'common/props',
    'common/cellComponents/fieldTableCellWidget',
    'widgets/appWidgets2/paramResolver',
    'common/runtime'
], function (
    Promise,
    $,
    html,
    UI,
    Events,
    Props,
    FieldWidget,
    ParamResolver,
    Runtime
) {
    'use strict';

    let tag = html.tag,
        form = tag('form'),
        span = tag('span'),
        div = tag('div');

    function factory(config) {
        let runtime = Runtime.make(),
            bus = config.bus,
            workspaceId = config.workspaceId,
            initialParams = config.initialParams,
            container,
            ui,
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
      appSpec - specifies the whole app
      parameterSpec - just the segment of the appSpec that specifies this individual parameter
      value - the initial value of this field
      closeParameters - a list of "close" parameters, which might be context-dependent. E.g. for an output
          field, this would be the list of all parameters meant to be output objects, so their names can
          be cross-validated for uniqueness (optional)
      */
        function makeFieldWidget(appSpec, parameterSpec, value, closeParameters) {
            return paramResolver.loadInputControl(parameterSpec)
                .then(function (inputWidget) {
                    let fieldWidget = FieldWidget.make({
                        inputControlFactory: inputWidget,
                        showHint: true,
                        useRowHighight: true,
                        initialValue: value,
                        appSpec: appSpec,
                        parameterSpec: parameterSpec,
                        workspaceId: workspaceId,
                        referenceType: 'name',
                        paramsChannelName: bus.channelName,
                        closeParameters: closeParameters
                    });

                    // Forward all changed parameters to the controller. That is our main job!
                    fieldWidget.bus.on('changed', function (message) {
                        bus.send({
                            parameter: parameterSpec.id,
                            newValue: message.newValue,
                            isError: message.isError
                        }, {
                            key: {
                                type: 'parameter-changed',
                                parameter: parameterSpec.id
                            }
                        });

                        bus.emit('parameter-changed', {
                            parameter: parameterSpec.id,
                            newValue: message.newValue,
                            isError: message.isError
                        });
                    });

                    fieldWidget.bus.on('touched', function () {
                        bus.emit('parameter-touched', {
                            parameter: parameterSpec.id
                        });
                    });


                    // An input widget may ask for the current model value at any time.
                    fieldWidget.bus.on('sync', function () {
                        bus.emit('parameter-sync', {
                            parameter: parameterSpec.id
                        });
                    });

                    fieldWidget.bus.on('sync-params', function (message) {
                        bus.emit('sync-params', {
                            parameters: message.parameters,
                            replyToChannel: fieldWidget.bus.channelName
                        });
                    });

                    fieldWidget.bus.on('set-param-state', function (message) {
                        bus.emit('set-param-state', {
                            id: parameterSpec.id,
                            state: message.state
                        });
                    });

                    fieldWidget.bus.respond({
                        key: {
                            type: 'get-param-state'
                        },
                        handle: function () {
                            return bus.request({ id: parameterSpec.id }, {
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
                        bus.request({
                            parameter: message.parameter
                        }, {
                            key: 'get-parameter-value'
                        })
                            .then(function (response) {
                                bus.emit('parameter-value', {
                                    parameter: response.parameter
                                });
                            });
                    });

                    fieldWidget.bus.respond({
                        key: {
                            type: 'get-parameter'
                        },
                        handle: function (message) {
                            if (message.parameterName) {
                                return bus.request(message, {
                                    key: {
                                        type: 'get-parameter'
                                    }
                                });
                            } else {
                                return null;
                            }
                        }
                    });

                    fieldWidget.bus.respond({
                        key: {
                            type: 'get-parameters'
                        },
                        handle: (message) => {
                            if (message.parameterNames) {
                                return Promise.all(
                                    message.parameterNames.map((paramName) => {
                                        return bus.request({
                                            parameterName: paramName
                                        }, {
                                            key: {
                                                type: 'get-parameter'
                                            }
                                        })
                                            .then((result) => {
                                                let returnVal = {};
                                                returnVal[paramName] = result.value;
                                                return returnVal;
                                            });
                                    })
                                )
                                    .then((results) => {
                                        let combined = {};
                                        results.forEach((res) => {
                                            Object.keys(res).forEach((key) => {
                                                combined[key] = res[key];
                                            });
                                        });
                                        return combined;
                                    });
                            }
                        }
                    });

                    // Just pass the update along to the input widget.
                    bus.listen({
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

        function renderAdvanced() {
            const areaElement = 'parameters-area',
                areaSelector = '[data-element="' + areaElement + '"]',
                advancedInputs = container.querySelectorAll(areaSelector + ' [data-advanced-parameter]');

            if (!advancedInputs.length) {
                ui.setContent([areaElement, 'advanced-hidden-message'], '');
                return;
            }

            //remove or add the hidden field class
            for (const [, entry] of Object.entries(advancedInputs)) {
                entry.classList.toggle('kb-app-params__fields--parameters__hidden_field');
            }

            // Also update the count in the paramters.
            const events = Events.make({ node: container });

            let message,
                showAdvancedButton;

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

        function renderLayout() {
            const events = Events.make();
            let formContent = [];

            formContent = formContent.concat([
                ui.buildPanel({
                    title: span([
                        'Parameters',
                        span({
                            class: 'kb-app-params__advanced-message--parameters',
                            dataElement: 'advanced-hidden-message'
                        })
                    ]),
                    name: 'parameters-area',
                    body: div({
                        class: 'kb-app-params__fields--parameters',
                        dataElement: 'parameter-fields'
                    }),
                    classes: ['kb-panel-light']
                })
            ]);

            const content = form({ dataElement: 'input-widget-form' }, formContent);
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
            let layout = renderLayout();
            container.innerHTML = layout.content;
            layout.events.attachEvents(container);

            places = {
                parameterFields: ui.getElement('parameter-fields'),
                advancedParameterFields: ui.getElement('advanced-parameter-fields')
            };
        }

        // EVENTS
        function attachEvents() {
            bus.on('reset-to-defaults', function () {
                widgets.forEach(function (widget) {
                    widget.bus.emit('reset-to-defaults');
                });
            });

            bus.on('toggle-advanced', function () {
                settings.showAdvanced = !settings.showAdvanced;
                renderAdvanced();
            });

            runtime.bus().on('workspace-changed', function () {
                // tell each input widget about this amazing event!
                widgets.forEach(function (widget) {
                    widget.bus.emit('workspace-changed');
                });
            });
        }

        function makeParamsLayout(params) {
            let view = {},
                paramMap = {};

            const orderedParams = params.map(function (param) {
                paramMap[param.id] = param;
                return param.id;
            });

            const layout = orderedParams.map(function (parameterId) {
                const elementId = html.genId();
                const advanced = paramMap[parameterId].ui.advanced ? parameterId : false;

                view[parameterId] = {
                    id: elementId
                };

                return div({
                    id: elementId,
                    dataParameter: parameterId,
                    dataAdvancedParameter: advanced
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
            const appSpec = model.getItem('appSpec');

            return Promise.try(function () {
                const params = model.getItem('parameters');
                let parameterParams = makeParamsLayout(
                    params.layout.filter(function (id) {
                        const original = params.specs[id].original;

                        let isParameter = false;

                        if (original) {

                            //looking for file inputs via the dynamic_dropdown data source
                            if (original.dynamic_dropdown_options) {
                                isParameter = original.dynamic_dropdown_options.data_source !== 'ftp_staging';
                            }

                            //looking for output fields - these should go in file paths
                            else if (original.text_options && original.text_options.is_output_name) {
                                isParameter = false;
                            }

                            //all other cases should be a param element
                            else {
                                isParameter = true;
                            }
                        }

                        return isParameter;

                    }).map(function (id) {
                        return params.specs[id];
                    }));

                return Promise.resolve()
                    .then(function () {
                        if (!parameterParams.layout.length) {
                            // TODO: should be own node
                            ui.getElement('parameters-area').classList.add('hidden');
                        } else {
                            places.parameterFields.innerHTML = parameterParams.content;

                            return Promise.all(parameterParams.layout.map(function (parameterId) {
                                const spec = parameterParams.paramMap[parameterId];
                                try {
                                    return makeFieldWidget(appSpec, spec, initialParams[spec.id])
                                        .then(function (widget) {
                                            widgets.push(widget);
                                            return widget.start({
                                                node: document.getElementById(parameterParams.view[spec.id].id)
                                            });
                                        });
                                } catch (ex) {
                                    // console.error('Error making input field widget', ex);
                                    const errorDisplay = div({
                                        class: 'kb-field-widget__error_message--parameters'
                                    }, [
                                        ex.message
                                    ]);
                                    document.getElementById(parameterParams.view[spec.id].id).innerHTML = errorDisplay;
                                }
                            }));
                        }
                    })
                    .then(function () {
                        renderAdvanced();
                    });
            });
        }

        function start(arg) {
            return Promise.try(function () {
                // send parent the ready message

                doAttach(arg.node);

                model.setItem('appSpec', arg.appSpec);
                model.setItem('parameters', arg.parameters);

                bus.on('parameter-changed', function (message) {
                    // Also, tell each of our inputs that a param has changed.
                    widgets.forEach(function (widget) {
                        widget.bus.send(message, {
                            key: {
                                type: 'parameter-changed',
                                parameter: message.parameter
                            }
                        });
                    });
                });


                return renderParameters()
                    .then(function () {
                        // do something after success
                        attachEvents();
                    })
                    .catch(function (err) {
                        // do somethig with the error.
                        console.error('ERROR in start', err);
                    });
            });


        }

        function stop() {
            return Promise.try(function () {
                // really unhook things here.
            });
        }

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
