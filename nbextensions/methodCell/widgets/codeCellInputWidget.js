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
        div = t('div'), span = t('span'), form = t('form'), button = t('button');

    function factory(config) {
        var container, places,
            workspaceInfo = config.workspaceInfo,
            cell = config.cell,
            parentBus = config.bus,
            inputWidgetBus = Bus.make(),
            runtime = Runtime.make();

        // DATA API
        function fetchData(methodId, methodVersion) {
            var methodRef = {
                ids: [methodId],
                tag: methodVersion
            },
            nms = new NarrativeMethodStore(runtime.config('services.narrative_method_store.url'), {
                token: runtime.authToken()
            });

            return nms.get_method_spec(methodRef)
                .then(function (data) {
                    if (!data[0]) {
                        throw new Error('Method not found');
                    }
                    // Get an input field widget per parameter
                    return data[0].parameters.map(function (parameterSpec) {
                        return ParameterSpec.make({parameterSpec: parameterSpec});
                    });
                });
        }

        // RENDER API

        function renderLayout() {
            var events = Events.make(),
                content = div({class: 'kbase-extension', style: {display: 'flex', alignItems: 'stretch'}}, [
                    div({class: 'prompt', dataElement: 'prompt', style: {display: 'flex', alignItems: 'stretch', width: '14ex', flexDirection: 'column'}}, [
                        div({dataElement: 'status'})
                    ]),
                    div({class: 'body', dataElement: 'body', style: {display: 'flex', alignItems: 'stretch', flexDirection: 'column', flex: '1'}}, [
                        div({dataElement: 'notifications', style: {display: 'block', width: '100%'}}),
                        div({dataElement: 'widget', style: {display: 'block', width: '100%'}}, [
                            form({dataElement: 'input-widget-form'}, div({class: 'container-fluid'}, [
                                // Insert fields into here.
                                div({class: 'panel panel-default'}, [
                                    div({class: 'panel-heading'}, [
                                        div({class: 'panel-tite'}, 'Toolbar')
                                    ]),
                                    div({class: 'panel-body'}, [
                                        button({type: 'button', class: 'btn btn-default', id: events.addEvent({
                                                type: 'click',
                                                handler: function (e) {
                                                    inputWidgetBus.send({id: 'reset'});
                                                }
                                            })}, 'Reset to Defaults')
                                    ])
                                ]),
                                div({class: 'panel panel-default'}, [
                                    div({class: 'panel-heading'}, [
                                        div({class: 'panel-tite'}, 'Inputs')
                                    ]),
                                    div({class: 'panel-body'}, [
                                        div({dataElement: 'input-widget-input-fields', class: 'container-fluid'})
                                    ])
                                ]),
                                div({class: 'panel panel-default'}, [
                                    div({class: 'panel-heading'}, [
                                        div({class: 'panel-tite'}, 'Outputs')
                                    ]),
                                    div({class: 'panel-body'}, [
                                        div({dataElement: 'input-widget-output-fields', class: 'container-fluid'})
                                    ])
                                ]),
                                div({class: 'panel panel-default'}, [
                                    div({class: 'panel-heading'}, [
                                        div({class: 'panel-tite'}, 'Parameters')
                                    ]),
                                    div({class: 'panel-body'}, [
                                        div({dataElement: 'input-widget-parameter-fields', class: 'container-fluid'})
                                    ])
                                ]),
                                div({class: 'panel panel-default'}, [
                                    div({class: 'panel-heading'}, [
                                        div({class: 'panel-tite'}, 'Advanced Parameters')
                                    ]),
                                    div({class: 'panel-body'}, [
                                        div({dataElement: 'input-widget-advanced-parameter-fields', class: 'container-fluid'})
                                    ])
                                ]),
                                // Submit row.
                                div({dataElement: 'input-widget-controls', class: 'container-fluid'}, [
                                    div({class: 'row'}, [
                                        div({class: 'col-md-3'}),
                                        div({class: 'col-md-9'}, button({type: 'submit'}, 'Run'))
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
                            break;
                        case 'dropdown':
                            return SingleSelectInputWidget;
                            break;
                        default:
                            return UndefinedInputWidget;
                    }
                case 'int':
                    if (parameterSpec.multipleItems()) {
                        return MultiIntInputWidget;
                    }
                    return SingleIntInputWidget;
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

        function makeFieldWidget(cell, parameterSpec, value) {
            var bus = Bus.make(),
                inputWidget = getInputWidgetFactory(parameterSpec);

            inputBusses.push(bus);

            // Listen for changed values coming from any cell. Since invocation of
            // this function implies that we know the cell, the parameter, and
            // the input widget, this is the place to tie it all together.
            bus.listen({
                test: function (message) {
                    return (message.type === 'changed');
                },
                handle: function (message) {
                    cell.setMeta('params', parameterSpec.id, message.newValue);
                    // TODO this properly
                    parentBus.send({
                        type: 'status',
                        status: 'editing'
                    });
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
                    var value = getParamValue(cell, parameterSpec.id);
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

        var inputBusses = [];
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
                return null;
            });
        }

        function run(params) {
            var widgets = [];
            return fetchData(params.methodId, params.methodVersion)
                .then(function (parameterSpecs) {
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
                    return Promise.all(inputParams.map(function (spec) {
                        var fieldWidget = makeFieldWidget(cell, spec, cell.getMeta('params', spec.name())),
                            rowWidget = RowWidget.make({widget: fieldWidget, spec: spec}),
                            rowNode = document.createElement('div');
                        places.inputFields.appendChild(rowNode);
                        widgets.push(rowWidget);
                        rowWidget.attach(rowNode);
                    }))
                        .then(function () {
                            return Promise.all(outputParams.map(function (spec) {
                                var fieldWidget = makeFieldWidget(cell, spec, cell.getMeta('params', spec.name())),
                                    rowWidget = RowWidget.make({widget: fieldWidget, spec: spec}),
                                    rowNode = document.createElement('div');
                                places.outputFields.appendChild(rowNode);
                                widgets.push(rowWidget);
                                rowWidget.attach(rowNode);
                            }));
                        })
                        .then(function () {
                            return Promise.all(parameterParams.map(function (spec) {
                                var fieldWidget = makeFieldWidget(cell, spec, cell.getMeta('params', spec.name())),
                                    rowWidget = RowWidget.make({widget: fieldWidget, spec: spec}),
                                    rowNode = document.createElement('div');
                                places.parameterFields.appendChild(rowNode);
                                widgets.push(rowWidget);
                                rowWidget.attach(rowNode);
                            }));
                        })
                        .then(function () {
                            return Promise.all(advancedParameterParams.map(function (spec) {
                                var fieldWidget = makeFieldWidget(cell, spec, cell.getMeta('params', spec.name())),
                                    rowWidget = RowWidget.make({widget: fieldWidget, spec: spec}),
                                    rowNode = document.createElement('div');
                                places.advancedParameterFields.appendChild(rowNode);
                                widgets.push(rowWidget);
                                rowWidget.attach(rowNode);
                            }));
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
//                    cell.kbase.$node.find('[data-element="input-widget-form"]').on('submit', function (e) {
//                        e.preventDefault();
//                        parentBus.send({
//                            id: 'submitted'
//                        });
//                    });
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
    }
    ;
});