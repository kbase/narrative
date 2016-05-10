/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    '../parameterSpec',
    './fieldWidget',
    '../runtime',
    '../microBus',
    '../events',
    'kb_common/html',
    './input/singleTextInput',
    './input/multiTextInput',
    './input/singleSelectInput',
    './input/singleIntInput',
    './input/multiIntInput',
    './input/objectInput',
    './input/newObjectInput',
    './undefinedWidget',
    './input/singleCheckbox',
    './input/singleFloatInput',
    'kb_service/client/narrativeMethodStore',
    './inputWrapperWidget'
], function (Promise, ParameterSpec, FieldWidget, Runtime, Bus, Events, html, SingleTextInputWidget, MultiTextInputWidget, SingleSelectInputWidget, SingleIntInputWidget, MultiIntInputWidget, ObjectInputWidget, NewObjectInputWidget, UndefinedInputWidget, SingleCheckboxInputWidget, SingleFloatInputWidget, NarrativeMethodStore, RowWidget) {
    'use strict';

    var t = html.tag,
        div = t('div'), span = t('span'), form = t('form'), button = t('button'), a = t('a');

    function factory(config) {
        var container, places,
            workspaceInfo = config.workspaceInfo,
            cell = config.cell,
            parentBus = config.bus,
            inputWidgetBus = Bus.make(),
            runtime = Runtime.make(),
            model = {
                value: null
            },
        // HMM. Sync with metadata, or just keep everything there?
        settings = {
            showAdvanced: false
        };

        // DATA API
        function fetchData(methodId, methodTag) {
            var methodRef = {
                ids: [methodId],
                tag: methodTag
            },
            nms = new NarrativeMethodStore(runtime.config('services.narrative_method_store.url'), {
                token: runtime.authToken()
            });

            return nms.get_method_spec(methodRef)
                .then(function (data) {
                    if (!data[0]) {
                        throw new Error('Method not found');
                    }
                    // TODO: really the best way to store state?
                    model.value = {
                        methodSpec: data[0]
                    };
                    // Get an input field widget per parameter
                    var parameters = data[0].parameters.map(function (parameterSpec) {
                        return ParameterSpec.make({parameterSpec: parameterSpec});
                    });
                    model.value.parameters = parameters;
                    return parameters;
                });
        }

        // RENDER API

        function makePanel(title, elementName) {
            return  div({class: 'panel panel-primary'}, [
                div({class: 'panel-heading'}, [
                    div({class: 'panel-title'}, title)
                ]),
                div({class: 'panel-body'}, [
                    div({dataElement: elementName, class: 'container-fluid'})
                ])
            ]);
        }

        function makeCollapsiblePanel(title, elementName) {
            var collapseId = html.genId();

            return div({class: 'panel panel-default'}, [
                div({class: 'panel-heading'}, [
                    div({class: 'panel-title'}, span({
                        class: 'collapsed',
                        dataToggle: 'collapse',
                        dataTarget: '#' + collapseId,
                        style: {cursor: 'pointer'}
                    },
                        title
                        ))
                ]),
                div({id: collapseId, class: 'panel-collapse collapse'},
                    div({class: 'panel-body'}, [
                        div({dataElement: elementName, class: 'container-fluid'})
                    ])
                    )
            ]);
        }

        function renderLayout() {
            var events = Events.make(),
                content = div({class: 'kbase-extension kb-method-cell', style: {display: 'flex', alignItems: 'stretch'}}, [
                    div({class: 'prompt', dataElement: 'prompt', style: {display: 'flex', alignItems: 'stretch', width: '14ex', flexDirection: 'column'}}, [
                        div({dataElement: 'status'})
                    ]),
                    div({class: 'body', dataElement: 'body', style: {display: 'flex', alignItems: 'stretch', flexDirection: 'column', flex: '1'}}, [
                        div({dataElement: 'notifications', style: {display: 'block', width: '100%'}}),
                        div({dataElement: 'widget', style: {display: 'block', width: '100%'}}, [
                            form({dataElement: 'input-widget-form'}, div({class: 'container-fluid'}, [
                                // Insert fields into here.
                                div({class: 'panel panel-primary'}, [
                                    div({class: 'panel-heading'}, [
                                        div({class: 'panel-title', dataElement: 'title'})
                                    ]),
                                    div({class: 'panel-body'}, [
                                        button({type: 'button', class: 'btn btn-default', id: events.addEvent({
                                                type: 'click',
                                                handler: function (e) {
                                                    inputWidgetBus.send({id: 'reset'});
                                                }
                                            })}, 'Reset to Defaults'),
                                        button({
                                            type: 'button',
                                            class: 'btn btn-default',
                                            dataButton: 'toggle-advanced',
                                            id: events.addEvent({
                                                type: 'click',
                                                handler: function (e) {
                                                    inputWidgetBus.send({id: 'toggle-advanced'});
                                                }
                                            })}, 'Show Advanced')
                                    ])
                                ]),
                                makePanel('Inputs', 'input-widget-input-fields'),
                                makePanel('Outputs', 'input-widget-output-fields'),
                                makePanel(span(['Parameters', span({dataElement: 'advanced-hidden'})]), 'input-widget-parameter-fields'),
                                // makeCollapsiblePanel('Advanced Parameters', 'input-widget-advanced-parameter-fields'),
                                // Submit row.
                                div({dataElement: 'input-widget-controls', class: 'container-fluid', style: {marginTop: '6px'}}, [
                                    div({class: 'row'}, [
                                        div({class: 'col-md-12'}, div({class: 'btn-toolbar text-center', style: {textAlign: 'center', marginTop: '6px'}}, [
                                            button({type: 'submit', class: 'btn btn-primary'}, 'Run')
                                        ]))
                                    ])
                                ])
                            ]))
                        ])
                    ])
                ]);
            return {
                content: content,
                events: events
            };
        }

        function render() {
            if (model.value) {
                container.querySelector('[data-element="title"]').innerHTML = model.value.methodSpec.info.name;
            }
        }

        function getParamValue(cell, paramName) {
            if (!cell.metadata.kbase.params) {
                return;
            }
            return cell.metadata.kbase.params[paramName];
        }
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
        function getInputWidgetFactory(parameterSpec) {
            var dataType = parameterSpec.dataType(),
                spec = parameterSpec.spec,
                fieldType = spec.field_type;

            // NOTE:
            // field_type is text or dropdown, but does not always correspond to the 
            // type of control to build. E.g. selecting a workspace object is actually
            // a dropdown even though the field_type is 'text'.

            switch (dataType) {
                case 'string':
                case 'text':
                    if (parameterSpec.multipleItems()) {
                        return UndefinedInputWidget;
                    }
                    switch (fieldType) {
                        case 'text':
                            return SingleTextInputWidget;
                        case 'dropdown':
                            return SingleSelectInputWidget;
                        default:
                            return UndefinedInputWidget;
                    }
                case 'int':                    
                    switch (fieldType) {
                        case 'text':
                            if (parameterSpec.multipleItems()) {
                                return MultiIntInputWidget;
                            }
                            return SingleTextInputWidget;
                        case 'checkbox':
                            return SingleCheckboxInputWidget;
                        default:
                            if (parameterSpec.multipleItems()) {
                                return MultiIntInputWidget;
                            }
                            return SingleTextInputWidget;
                    }
                case 'float':
                    if (parameterSpec.multipleItems()) {
                        return UndefinedInputWidget;
                    }
                    return SingleFloatInputWidget;
                case 'workspaceObjectReference':
                    switch (parameterSpec.uiClass()) {
                        case 'input':
                            return ObjectInputWidget;
                        case 'output':
                            return NewObjectInputWidget;
                        case 'parameter':
                            return ObjectInputWidget;
                        default:
                            return UndefinedInputWidget;
                    }
                case 'unspecified':
                    // a bunch of field types are untyped:
                    switch (fieldType) {
                        case 'text':
                            if (parameterSpec.multipleItems()) {
                                return MultiTextInputWidget;
                            }
                            return SingleTextInputWidget;
                        case 'checkbox':
                            return SingleCheckboxInputWidget;
                        case 'textarea':
                            return UndefinedInputWidget;
                        case 'dropdown':
                            if (parameterSpec.multipleItems()) {
                                return UndefinedInputWidget;
                            }
                            return SingleSelectInputWidget;
                        case 'custom_button':
                            return UndefinedInputWidget;
                        case 'textsubdata':
                            if (parameterSpec.multipleItems()) {
                                return UndefinedInputWidget;
                            }
                            return UndefinedInputWidget;
                        case 'file':
                            return UndefinedInputWidget;
                        case 'custom_textsubdata':
                            if (parameterSpec.multipleItems()) {
                                return UndefinedInputWidget;
                            }
                            return UndefinedInputWidget;
                        case 'custom_widget':
                            return UndefinedInputWidget;
                        case 'tab':
                            return UndefinedInputWidget;
                        default:
                            return UndefinedInputWidget;
                    }
                default:
                    return UndefinedInputWidget;
                    // return makeUnknownInput;
            }
        }

        function validateModel() {
            /*
             * Validation is currently very simple.
             * Iterate through all parameters in the model specification.
             * If the model contains a value, validate it.
             * Record any failure
             * If the model does not contain a value, and it is optional, use the "null value" for that type.
             * If the model does not contain a value, and it is required, record that failure
             * If there are any failures, the validation feails.
             * And return the set of failures.
             * 
             * FOR NOW: let us assume that values only get into the model if 
             * they are valid.
             * All we need to do now then is to ensure that all required fields are present,
             * and missing fields get their default "nullish" value.
             * 
             * Also FOR NOW: we don't have a model of what "blank" is for a field, so we use this:
             * - for strings, empty string or undefined
             * - for ints, undefined
             * - for floats, undefined
             * - for sets, empty array
             * - for object refs, empty string (we should check if refs are valid here as well, but not yet.)
             * 
             * 
             */
            var params = cell.getMeta('params');
            var errors = model.value.parameters.map(function (parameterSpec) {
                if (parameterSpec.required()) {
                    // console.log('VAL', parameterSpec.id(), params);
                    if (parameterSpec.isEmpty(params[parameterSpec.id()])) {
                        return {
                            diagnosis: 'required-missing',
                            errorMessage: 'The ' + parameterSpec.dataType() + ' "' + parameterSpec.id() + '" is required but was not provided'
                        };
                    }
                }
            }).filter(function (error) {
                if (error) {
                    return true;
                }
                return false;
            });
            // console.log('VALIDATION', errors, (errors.length === 0));
            return {
                isValid: (errors.length === 0),
                errors: errors
            };
        }

        function makeFieldWidget(cell, parameterSpec, value) {
            var bus = Bus.make(),
                inputWidget = getInputWidgetFactory(parameterSpec);

            inputBusMap[cell.metadata.kbase.attributes.id] = bus;

            inputBusses.push(bus);

            // Listen for changed values coming from any cell. Since invocation of
            // this function implies that we know the cell, the parameter, and
            // the input widget, this is the place to tie it all together.
            bus.listen({
                test: function (message) {
                    return (message.type === 'changed');
                },
                handle: function (message) {
                    // Nota Bene: This assumes that the control has already validated
                    // the value and it is okay for storing as a 
                    // method parameter.
                    cell.setMeta('params', parameterSpec.id(), message.newValue);
                    // TODO this properly
                    parentBus.send({
                        type: 'status',
                        status: 'editing'
                    });

                    /*
                     * now, the user may or may not be ready for executing this
                     * code, and we certainly don't want to run it unless they
                     * ask for it, but we do want to build the python code
                     * as soon as possible, so if the model validates, we
                     * build it and enable the show code button.
                     */
                    var validationResult = validateModel();
                    // console.log('VALID RESULT', validationResult);
                    if (validationResult.isValid) {
                        parentBus.send({
                            type: 'parameters-validated'
                        });
                    } else {
                        parentBus.send({
                            type: 'parameters-invalid',
                            errors: validationResult.errors
                        });
                        // don't do anything ...
                        console.warn(validationResult.errors);
                    }


                }
            });

            // Listen for sync request from widget. 
            // We'll send the widget the current state of the param stored
            // in the metadata, aka, our data store.
            bus.listen({
                test: function (message) {
                    return (message.type === 'sync');
                },
                handle: function (message) {
                    var value = getParamValue(cell, parameterSpec.id());
                    bus.send({
                        type: 'update',
                        value: value
                    });
                }
            });

            return FieldWidget.make({
                inputControlFactory: inputWidget,
                showHint: true,
                useRowHighight: true,
                initialValue: value,
                parameterSpec: parameterSpec,
                bus: bus,
                workspaceId: workspaceInfo.id,
                runtime: runtime
            });
        }

        function createNode(markup) {
            var node = document.createElement('div');
            node.innerHTML = markup;
            return node.firstChild;
        }

        // LIFECYCYLE API

        function init(config) {
            return Promise.try(function () {
                return null;
            });
        }

        function attach(node) {
            return Promise.try(function () {
                container = node;
                var layout = renderLayout();
                container.innerHTML = layout.content;
                layout.events.attachEvents(container);
                places = {
                    status: container.querySelector('[data-element="status"]'),
                    notifications: container.querySelector('[data-element="notifications"]'),
                    inputFields: container.querySelector('[data-element="input-widget-input-fields"]'),
                    outputFields: container.querySelector('[data-element="input-widget-output-fields"]'),
                    parameterFields: container.querySelector('[data-element="input-widget-parameter-fields"]'),
                    advancedParameterFields: container.querySelector('[data-element="input-widget-advanced-parameter-fields"]'),
                    widget: container.querySelector('[data-element="widget"]')
                };
                return null;
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
            button.innerHTML = (settings.showAdvanced ? 'Hide Advanced' : 'Show Advanced (' + advancedInputs.length +  ' hidden)');

            // Also update the 
        }

        var inputBusses = [],
            inputBusMap = {};
        function start() {
            return Promise.try(function () {
                inputWidgetBus.listen({
                    test: function (message) {
                        return (message.id === 'reset');
                    },
                    handle: function (message) {
                        inputBusses.forEach(function (bus) {
                            bus.send({
                                type: 'reset-to-defaults'
                            });
                        });
                    }
                });
                inputWidgetBus.listen({
                    test: function (message) {
                        return (message.id === 'toggle-advanced');
                    },
                    handle: function (message) {
                        // we can just do that here? Or defer to the inputs? 
                        // I don't know ...
                        //inputBusses.forEach(function (bus) {
                        //    bus.send({
                        //        type: 'toggle-advanced'
                        //    });
                        //});
                        settings.showAdvanced = !settings.showAdvanced;
                        renderAdvanced();
                    }
                });
                
                runtime.bus().listen({
                    test: function (message) {
                        return (message.type === 'jobstatus' && message.jobState.cell_id === cell.metadata.kbase.attributes.id);
                    },
                    handle: function (message) {
                        // console.log('JOBSTATUS', message);
                        var jobStatus = message.job.state.job_state;

                        // Update current status
                        cell.setMeta('attributes', 'jobStatus', jobStatus);

                        // Update status history.
                        
                        // Okay, don't store multiples of the last event.
                        var log = cell.metadata.kbase.log;
                        if (!log) {
                            log = [];
                            cell.metadata.kbase.log = log;
                        }
                        if (log.length > 0) {
                            var lastLog = log[log.length - 1];
                            if (lastLog.data.status === jobStatus) {
                                if (lastLog.count === undefined) {
                                    lastLog.count = 0;
                                }
                                lastLog.count += 1;
                                return;
                            }
                        }
                        
                        cell.pushMeta('log', {
                            timestamp: new Date(),
                            event: 'jobstatus',
                            data: {
                                status: jobStatus
                            }
                        });
                    }
                })
                
                return null;
            });
        }

        function run(params) {
            var widgets = [];
            // First get the method specs, which is stashed in the model, 
            // with the parameters returned.
            return fetchData(params.methodId, params.methodTag)
                .then(function (parameterSpecs) {
                    // Render the layout.
                    render();
                
                    
                
                    // Separate out the params into the primary groups.
                    var inputParams = parameterSpecs.filter(function (spec) {
                        return (spec.spec.ui_class === 'input');
                    }),
                        outputParams = parameterSpecs.filter(function (spec) {
                            return (spec.spec.ui_class === 'output');
                        }),
                        parameterParams = parameterSpecs.filter(function (spec) {
                            return (spec.spec.ui_class === 'parameter');
                        });

                    return [inputParams, outputParams, parameterParams];

                })
                .spread(function (inputParams, outputParams, parameterParams) {
                    return Promise.try(function () {
                        return null;
                    })
                        .then(function () {
                            if (inputParams.length === 0) {
                                places.inputFields.innerHTML = 'No inputs';
                            } else {
                                return Promise.all(inputParams.map(function (spec) {
                                    var fieldWidget = makeFieldWidget(cell, spec, cell.getMeta('params', spec.name())),
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
                                places.outputFields.innerHTML = 'No outputs';
                            } else {
                                return Promise.all(outputParams.map(function (spec) {
                                    var fieldWidget = makeFieldWidget(cell, spec, cell.getMeta('params', spec.name())),
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
                                places.parameterFields.innerHTML = 'No parameters';
                            } else {
                                return Promise.all(parameterParams.map(function (spec) {
                                    var fieldWidget = makeFieldWidget(cell, spec, cell.getMeta('params', spec.name())),
                                        rowWidget = RowWidget.make({widget: fieldWidget, spec: spec}),
                                        rowNode = document.createElement('div');
                                    places.parameterFields.appendChild(rowNode);
                                    widgets.push(rowWidget);
                                    rowWidget.attach(rowNode);
                                }));
                            }
                        });
                })
                .then(function () {
                    return widgets.map(function (widget) {
                        return widget.start();
                    });
                })
                .then(function () {
                    return widgets.map(function (widget) {
                        return widget.run(params);
                    });
                })
                .then(function () {
                    renderAdvanced();
                    cell.kbase.$node.find('[data-element="input-widget-form"]').on('submit', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        parentBus.send({
                            type: 'submitted'
                        });
                    });
                });
        }


        function runx(params) {
            var widgets = [];
            return fetchData(params.methodId, params.methodTag)
                .then(function (parameterSpecs) {
                    render();
                    var inputParams = parameterSpecs.filter(function (spec) {
                        return (spec.spec.ui_class === 'input');
                    }),
                        outputParams = parameterSpecs.filter(function (spec) {
                            return (spec.spec.ui_class === 'output');
                        }),
                        parameterParams = parameterSpecs.filter(function (spec) {
                            return (spec.spec.advanced !== 1 && spec.spec.ui_class === 'parameter');
                        }),
                        advancedParameterParams = parameterSpecs.filter(function (spec) {
                            return (spec.spec.advanced === 1 && spec.spec.ui_class === 'parameter');
                        });

                    return [inputParams, outputParams, parameterParams, advancedParameterParams];

                })
                .spread(function (inputParams, outputParams, parameterParams, advancedParameterParams) {
                    // First create the row layout
                    return Promise.try(function () {
                        return null;
                    })
                        .then(function () {
                            if (inputParams.length === 0) {
                                places.inputFields.innerHTML = 'No inputs';
                            } else {
                                return Promise.all(inputParams.map(function (spec) {
                                    var fieldWidget = makeFieldWidget(cell, spec, cell.getMeta('params', spec.name())),
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
                                places.outputFields.innerHTML = 'No outputs';
                            } else {
                                return Promise.all(outputParams.map(function (spec) {
                                    var fieldWidget = makeFieldWidget(cell, spec, cell.getMeta('params', spec.name())),
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
                                places.parameterFields.innerHTML = 'No parameters';
                            } else {
                                return Promise.all(parameterParams.map(function (spec) {
                                    var fieldWidget = makeFieldWidget(cell, spec, cell.getMeta('params', spec.name())),
                                        rowWidget = RowWidget.make({widget: fieldWidget, spec: spec}),
                                        rowNode = document.createElement('div');
                                    places.parameterFields.appendChild(rowNode);
                                    widgets.push(rowWidget);
                                    rowWidget.attach(rowNode);
                                }));
                            }
                        })
                        .then(function () {
                            if (advancedParameterParams.length === 0) {
                                places.advancedParameterFields.innerHTML = 'No parameters';
                            } else {
                                return Promise.all(advancedParameterParams.map(function (spec) {
                                    var fieldWidget = makeFieldWidget(cell, spec, cell.getMeta('params', spec.name())),
                                        rowWidget = RowWidget.make({widget: fieldWidget, spec: spec}),
                                        rowNode = document.createElement('div');
                                    places.advancedParameterFields.appendChild(rowNode);
                                    widgets.push(rowWidget);
                                    rowWidget.attach(rowNode);
                                }));
                            }
                        });
                })
                .then(function () {
                    return widgets.map(function (widget) {
                        return widget.start();
                    });
                })
                .then(function () {
                    return widgets.map(function (widget) {
                        return widget.run(params);
                    });
                })
                .then(function () {
                    cell.kbase.$node.find('[data-element="input-widget-form"]').on('submit', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        parentBus.send({
                            type: 'submitted'
                        });
                    });
                });
        }

        return {
            init: init,
            attach: attach,
            start: start,
            run: run
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});