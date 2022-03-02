define([
    'bluebird',
    'common/html',
    'common/ui',
    'common/events',
    'common/props',
    'common/cellComponents/fieldTableCellWidget',
    'widgets/appWidgets2/paramResolver',
    'common/runtime',
], (Promise, html, UI, Events, Props, FieldWidget, ParamResolver, Runtime) => {
    'use strict';

    const tag = html.tag,
        form = tag('form'),
        span = tag('span'),
        div = tag('div'),
        iTag = tag('i'),
        strong = tag('strong'),
        cssBaseClass = 'kb-app-params';

    function factory(config) {
        const viewOnly = config.viewOnly || false;
        const { bus, workspaceId, paramIds, initialParams } = config;
        // key = param id, value = boolean, true if is in error
        const advancedParamErrors = {};
        const runtime = Runtime.make(),
            model = Props.make(),
            paramResolver = ParamResolver.make(),
            settings = {
                showAdvanced: null,
            },
            widgets = [];
        let container,
            ui,
            places = {},
            numAdvanced = 0;

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

        function makeFieldWidget(inputWidget, appSpec, parameterSpec, value, closeParameters) {
            const fieldWidget = FieldWidget.make({
                inputControlFactory: inputWidget,
                showHint: true,
                useRowHighight: true,
                initialValue: value,
                referenceType: 'name',
                paramsChannelName: bus.channelName,
                appSpec,
                parameterSpec,
                workspaceId,
                closeParameters,
                viewOnly,
            });

            if (!viewOnly) {
                // Forward all changed parameters to the controller. That is our main job!
                fieldWidget.bus.on('changed', (message) => {
                    bus.send(
                        {
                            parameter: parameterSpec.id,
                            newValue: message.newValue,
                            isError: message.isError,
                        },
                        {
                            key: {
                                type: 'parameter-changed',
                                parameter: parameterSpec.id,
                            },
                        }
                    );

                    bus.emit('parameter-changed', {
                        parameter: parameterSpec.id,
                        newValue: message.newValue,
                        isError: message.isError,
                    });
                });

                fieldWidget.bus.on('validation', (message) => {
                    // console.log(parameterSpec.id + ': ' + JSON.stringify(message));
                    // only propagate if invalid. value changes come through
                    // the 'changed' message
                    const paramId = parameterSpec.id;
                    if (paramId in advancedParamErrors) {
                        advancedParamErrors[paramId] = !message.isValid;
                    }
                    showHideAdvancedErrorMessage();
                    if (!message.isValid) {
                        bus.emit('invalid-param-value', {
                            parameter: parameterSpec.id,
                        });
                    }
                });

                fieldWidget.bus.on('touched', () => {
                    bus.emit('parameter-touched', {
                        parameter: parameterSpec.id,
                    });
                });

                // An input widget may ask for the current model value at any time.
                fieldWidget.bus.on('sync', () => {
                    bus.emit('parameter-sync', {
                        parameter: parameterSpec.id,
                    });
                });

                fieldWidget.bus.on('sync-params', (message) => {
                    bus.emit('sync-params', {
                        parameters: message.parameters,
                        replyToChannel: fieldWidget.bus.channelName,
                    });
                });

                fieldWidget.bus.on('set-param-state', (message) => {
                    bus.emit('set-param-state', {
                        id: parameterSpec.id,
                        state: message.state,
                    });
                });

                fieldWidget.bus.respond({
                    key: {
                        type: 'get-param-state',
                    },
                    handle: function () {
                        return bus.request(
                            { id: parameterSpec.id },
                            {
                                key: {
                                    type: 'get-param-state',
                                },
                            }
                        );
                    },
                });

                fieldWidget.bus.respond({
                    key: {
                        type: 'get-parameter',
                    },
                    handle: function (message) {
                        if (message.parameterName) {
                            return bus.request(message, {
                                key: {
                                    type: 'get-parameter',
                                },
                            });
                        } else {
                            return null;
                        }
                    },
                });

                fieldWidget.bus.respond({
                    key: {
                        type: 'get-parameters',
                    },
                    handle: (message) => {
                        if (message.parameterNames) {
                            return Promise.all(
                                message.parameterNames.map((paramName) => {
                                    return bus
                                        .request(
                                            {
                                                parameterName: paramName,
                                            },
                                            {
                                                key: {
                                                    type: 'get-parameter',
                                                },
                                            }
                                        )
                                        .then((result) => {
                                            const returnVal = {};
                                            returnVal[paramName] = result.value;
                                            return returnVal;
                                        });
                                })
                            ).then((results) => {
                                const combined = {};
                                results.forEach((res) => {
                                    Object.keys(res).forEach((key) => {
                                        combined[key] = res[key];
                                    });
                                });
                                return combined;
                            });
                        }
                    },
                });
            }

            // Just pass the update along to the input widget.
            bus.listen({
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

            return fieldWidget;
        }

        function showHideAdvanced() {
            const areaElement = 'parameters-area',
                areaSelector = '[data-element="' + areaElement + '"]',
                advancedInputs = container.querySelectorAll(
                    areaSelector + ' [data-advanced-parameter]'
                );

            // remove or add the hidden field class
            for (const [, entry] of Object.entries(advancedInputs)) {
                entry.classList.toggle(`${cssBaseClass}__fields--parameters-hidden`);
            }

            // edit the labels
            let headerLabel = `${numAdvanced} advanced parameter${numAdvanced > 1 ? 's' : ''}`,
                buttonLabel;
            if (settings.showAdvanced) {
                headerLabel += ' showing';
                buttonLabel = 'hide advanced';
            } else {
                headerLabel += ' hidden';
                buttonLabel = 'show advanced';
            }

            // set labels
            const messageElem = container.querySelector('[data-element="advanced-hidden-message"]');
            messageElem.querySelector('span').textContent = `(${headerLabel})`;
            messageElem.querySelector('button').textContent = buttonLabel;
            showHideAdvancedErrorMessage();
        }

        function renderAdvanced() {
            // remove or add the hidden field class
            const areaElement = 'parameters-area';

            // Also update the count in the parameters.
            const events = Events.make({ node: container });

            if (numAdvanced === 0) {
                ui.setContent([areaElement, 'advanced-hidden-message'], '');
            } else {
                const showAdvancedButton = ui.buildButton({
                    class: `${cssBaseClass}__toggle--advanced-hidden`,
                    label: '',
                    type: 'link',
                    name: 'advanced-parameters-toggler',
                    event: {
                        type: 'toggle-advanced',
                    },
                    events,
                });

                ui.setContent(
                    [areaElement, 'advanced-hidden-message'],
                    [
                        span({
                            class: `${cssBaseClass}__toggle--advanced-message`,
                        }),
                        showAdvancedButton,
                    ].join()
                );
                showHideAdvanced();
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
                            class: `${cssBaseClass}__message--advanced-hidden`,
                            dataElement: 'advanced-hidden-message',
                        }),
                    ]),
                    name: 'parameters-area',
                    body: div({
                        class: `${cssBaseClass}__fields--parameters`,
                        dataElement: 'parameter-fields',
                    }),
                    classes: ['kb-panel-bulk-params'],
                }),
            ]);

            const content = form({ dataElement: 'input-widget-form' }, formContent);
            return {
                content,
                events,
            };
        }

        function showHideAdvancedErrorMessage() {
            const messageParentSelector = '[data-element="advanced-hidden-message"]';
            const advancedErrorClass = `${cssBaseClass}__toggle--advanced-errors`;
            const messageSelector = `${messageParentSelector} .${advancedErrorClass}`;
            const messageNode = container.querySelector(messageSelector);
            const hasErrors = Object.values(advancedParamErrors).some((v) => v);
            if (!settings.showAdvanced && hasErrors && !messageNode) {
                container.querySelector(messageParentSelector).appendChild(
                    ui.createNode(
                        span({ class: advancedErrorClass }, [
                            iTag({
                                class: `${advancedErrorClass}--icon fa fa-exclamation-triangle`,
                            }),
                            strong(' Warning: '),
                            span(
                                'Error in advanced parameter. Show advanced parameters for details.'
                            ),
                        ])
                    )
                );
            } else if ((!hasErrors || settings.showAdvanced) && messageNode) {
                container.querySelector(messageSelector).remove();
            }
        }

        // MESSAGE HANDLERS
        function doAttach(node) {
            container = node;
            ui = UI.make({
                node: container,
                bus,
            });
            const layout = renderLayout();
            container.innerHTML = layout.content;
            layout.events.attachEvents(container);

            places = {
                parameterFields: ui.getElement('parameter-fields'),
                advancedParameterFields: ui.getElement('advanced-parameter-fields'),
            };
        }

        // EVENTS
        function attachEvents() {
            bus.on('reset-to-defaults', () => {
                widgets.forEach((widget) => {
                    widget.bus.emit('reset-to-defaults');
                });
            });

            bus.on('toggle-advanced', () => {
                settings.showAdvanced = !settings.showAdvanced;
                showHideAdvanced();
            });

            runtime.bus().on('workspace-changed', () => {
                // tell each input widget about this amazing event!
                widgets.forEach((widget) => {
                    widget.bus.emit('workspace-changed');
                });
            });
        }

        /**
         * Also sets the number of advanced parameters, and initializes the
         * advancedParamErrors object.
         * @param {*} params
         * @returns
         */
        function makeParamsLayout(params) {
            const view = {},
                paramMap = {};

            const orderedParams = params.map((param) => {
                paramMap[param.id] = param;
                return param.id;
            });

            const layout = orderedParams
                .map((parameterId) => {
                    const elementId = html.genId();
                    const advanced = paramMap[parameterId].ui.advanced ? parameterId : false;
                    if (advanced) {
                        advancedParamErrors[parameterId] = false; // init these to be no error
                        numAdvanced++;
                    }

                    view[parameterId] = {
                        id: elementId,
                    };

                    return div({
                        id: elementId,
                        dataParameter: parameterId,
                        dataAdvancedParameter: advanced,
                    });
                })
                .join('\n');

            return {
                content: layout,
                layout: orderedParams,
                params,
                view,
                paramMap,
            };
        }

        function createParameterWidget(appSpec, parameterInfo, parameterId) {
            const paramSpec = parameterInfo.paramMap[parameterId];
            let controlPromise;
            if (viewOnly) {
                controlPromise = paramResolver.loadViewControl(paramSpec);
            } else {
                controlPromise = paramResolver.loadInputControl(paramSpec);
            }
            return controlPromise
                .then((inputWidget) => {
                    // console.log(`starting ${paramSpec.id} with ${initialParams[paramSpec.id]}`)
                    const widget = makeFieldWidget(
                        inputWidget,
                        appSpec,
                        paramSpec,
                        initialParams[paramSpec.id]
                    );

                    widgets.push(widget);
                    return widget.start({
                        node: container.querySelector('#' + parameterInfo.view[paramSpec.id].id),
                    });
                })
                .catch((ex) => {
                    console.error(`Error making params input field widget: ${ex}`);
                    const errorDisplay = div(
                        {
                            class: 'kb-field-widget__error_message--parameters',
                        },
                        [ex.message]
                    );
                    container.querySelector('#' + parameterInfo.view[paramSpec.id].id).innerHTML =
                        errorDisplay;

                    throw new Error(`Error making input field widget: ${ex}`);
                });
        }

        // LIFECYCLE API
        function renderParameters() {
            // First get the app specs, which is stashed in the model,
            // with the parameters returned.
            // Separate out the params into the primary groups.
            const appSpec = model.getItem('appSpec');
            const params = model.getItem('parameterSpecs');
            const filteredParams = makeParamsLayout(params);

            // if there aren't any parameters we can just hide the whole area
            if (!filteredParams.layout.length) {
                return Promise.resolve(ui.getElement('parameters-area').classList.add('hidden'));
            }

            places.parameterFields.innerHTML = filteredParams.content;

            return Promise.all(
                filteredParams.layout.map(async (parameterId) => {
                    await createParameterWidget(appSpec, filteredParams, parameterId);
                })
            ).then(() => {
                renderAdvanced(filteredParams.advancedIds);
            });
        }

        /**
         *
         * @param {object} arg - should have keys:
         *  - appSpec - the app spec to be passed along to the individual widgets
         *  - parameters - an object with parameter specs and their proper layout order
         * @returns
         */
        function start(arg) {
            doAttach(arg.node);
            // get the parameter specs in the right order.
            const parameterSpecs = [];
            arg.parameters.layout.forEach((id) => {
                if (paramIds.includes(id)) {
                    const paramSpec = arg.parameters.specs[id];
                    parameterSpecs.push(paramSpec);
                }
            });

            // keep the appSpec
            model.setItem('appSpec', arg.appSpec);
            // keep an ordered list of used parameter specs
            model.setItem('parameterSpecs', parameterSpecs);

            bus.on('parameter-changed', (message) => {
                // Also, tell each of our inputs that a param has changed.
                widgets.forEach((widget) => {
                    widget.bus.send(message, {
                        key: {
                            type: 'parameter-changed',
                            parameter: message.parameter,
                        },
                    });
                });
            });

            return renderParameters()
                .then(() => {
                    // do something after success
                    attachEvents();
                })
                .catch((error) => {
                    throw new Error(`Unable to start paramsWidget: ${error}`);
                });
        }

        function stop() {
            return Promise.try(() => {
                if (container) {
                    container.innerHTML = '';
                }
            });
        }

        return {
            start,
            stop,
            bus: () => bus,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
