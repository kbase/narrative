/*global define*/
/*jslint white:true,browser:true*/

define([
    'jquery',
    'bluebird',
    'base/js/namespace',
    'base/js/dialog',
    '../parameterSpec',
    './fieldWidget',
    '../runtime',
    '../microBus',
    '../events',
    'kb_common/html',
    '../props',
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
    './input/singleSubdata',
    'kb_service/client/narrativeMethodStore',
    'kb_service/client/workspace',
    './inputWrapperWidget',
    '../pythonInterop',
    '../utils',
    '../jobs'
], function ($, Promise, Jupyter, dialog, ParameterSpec, FieldWidget, Runtime, Bus, Events, html, Props, SingleTextInputWidget, MultiTextInputWidget, SingleSelectInputWidget, SingleIntInputWidget, MultiIntInputWidget, ObjectInputWidget, NewObjectInputWidget, UndefinedInputWidget, SingleCheckboxInputWidget, SingleFloatInputWidget, SingleSubdataWidget, NarrativeMethodStore, Workspace, RowWidget, PythonInterop, utils, Jobs) {
    'use strict';

    var t = html.tag,
        div = t('div'), span = t('span'), form = t('form'),
        button = t('button'), a = t('a'),
        table = t('table'), tr = t('tr'), td = t('td'), th = t('th'),
        textarea = t('textarea'),
        ul = t('ul'), li = t('li');

    function factory(config) {
        var container, places,
            workspaceInfo = config.workspaceInfo,
            cell = config.cell,
            parentBus = config.bus,
            inputWidgetBus = Bus.make(),
            runtime = Runtime.make(),
            model = {
                value: {}
            },
        meta,
            // Every state starts out as null, meaning not applicable.
            // Some process within this object must set the state to something 
            // sensible.
            state = {
                modes: {
                    editing: null, // null=not applicable, enabled = can edit, editing = enabled + edits made, disabled = may not edit
                    model: null, // none = no model yet, incomplete = data present, but not complete, valid = data is present, correct, and complete,
                    // invalid = bad data in the model!
                    code: null, // null = not applicable (e.g. no code), runnable = code is available, running=code is executing, run = code has run
                    request: null, // method request: null=not applicable (e.g. no code), sending=request sent but otherwise unknown, queued=job queued,
                    // running=job executing, completed=job finished (see result).
                    result: null // request result: null=not applicable, success=successfully completed, error=completed with error, canceled=user canceled
                },
                data: {
                    method: null,
                    inputs: null,
                    settings: null,
                    results: null
                },
                settings: {
                    showAdvanced: null

                }
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
                    model.value.methodSpec = data[0];
                    // Get an input field widget per parameter
                    var parameters = data[0].parameters.map(function (parameterSpec) {
                        return ParameterSpec.make({parameterSpec: parameterSpec});
                    });
                    model.value.parameters = parameters;
                    return parameters;
                });
        }

        // RENDER API

        function makeButton(label, name, options) {
            var klass = options.type || 'default',
                events = options.events;
            return button({
                type: 'button',
                class: ['btn', 'btn-' + klass].join(' '),
                dataButton: name,
                id: addButtonClickEvent(events, name)
            }, label);
        }

        function enableButton(name) {
            getButton(name).classList.remove('disabled');
        }

        function disableButton(name) {
            getButton(name).classList.add('disabled');
        }

        function setButtonLabel(name, label) {
            getButton(name).innerHTML = label;
        }

        function addButtonClickEvent(events, eventName) {
            return events.addEvent({
                type: 'click',
                handler: function () {
                    inputWidgetBus.send({type: eventName});
                }
            });
        }

        function hideElement(name) {
            getElement(name).style.display = 'none';
        }

        function showElement(name) {
            getElement(name).style.display = 'block';
        }


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

        function buildPanel(args) {
            var style = {}, type = args.type || 'primary';
            if (args.hidden) {
                style.display = 'none';
            }
            return  div({class: 'panel panel-' + type, dataElement: args.name, style: style}, [
                div({class: 'panel-heading'}, [
                    div({class: 'panel-title'}, args.title)
                ]),
                div({class: 'panel-body'}, [
                    args.body
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
                    div({
                        class: 'body',
                        dataElement: 'body',
                        style: {display: 'flex', alignItems: 'stretch', flexDirection: 'column', flex: '1'}
                    }, [
                        div({dataElement: 'notifications', style: {display: 'block', width: '100%'}}),
                        div({dataElement: 'widget', style: {display: 'block', width: '100%'}}, [
                            div({class: 'container-fluid'}, [
                                buildPanel({
                                    title: 'Quick Status',
                                    name: 'status-bar',
                                    hidden: false,
                                    type: 'default',
                                    body: [
                                        div({style: {lineHeight: '20px'}}, [
                                            span({
                                            }, [
                                                span('Edit:'),
                                                span({
                                                    style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                    dataElement: 'edit'
                                                })
                                            ]),
                                            span({
                                            }, [
                                                span('Params:'),
                                                span({
                                                    style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                    dataElement: 'params'
                                                })
                                            ]),
                                            span({
                                            }, [
                                                span('Code:'),
                                                span({
                                                    style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                    dataElement: 'code'
                                                })
                                            ]),
                                            span({
                                            }, [
                                                span('Request:'),
                                                span({
                                                    style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                    dataElement: 'request'
                                                })
                                            ]),
                                            span({
                                            }, [
                                                span('Result:'),
                                                span({
                                                    style: {
                                                        border: '1px silver solid',
                                                        padding: '4px',
                                                        display: 'inline-block',
                                                        minWidth: '20px',
                                                        backgroundColor: 'gray', color: '#FFF'
                                                    },
                                                    dataElement: 'result'
                                                })
                                            ])
                                        ])
                                    ]
                                }),
                                buildPanel({
                                    title: 'Available Actions',
                                    name: 'availableActions',
                                    hidden: false,
                                    type: 'default',
                                    body: [
                                        div({class: 'btn-toolbar'}, [
                                            div({class: 'btn-group'}, [
                                                makeButton('Run', 'run', {events: events, type: 'primary'})
                                            ]),
                                            div({class: 'btn-group'}, [
                                                makeButton('Cancel', 'cancel', {events: events, type: 'danger'})
                                            ]),
                                            div({class: 'btn-group'}, [
                                                makeButton('Re-run', 're-run', {events: events, type: 'primary'})
                                            ]),
                                            div({class: 'btn-group'}, [
                                                makeButton('Show Dev Options', 'toggle-developer-options', {events: events})
                                            ])
                                        ])
                                    ]
                                }),
                                buildPanel({
                                    title: 'Dev',
                                    name: 'developer-options',
                                    hidden: true,
                                    type: 'default',
                                    body: [
                                        makeButton('Show Code', 'toggle-code-view', {events: events}),
                                        makeButton('Edit Metadata', 'edit-cell-metadata', {events: events}),
                                        makeButton('Edit Notebook Metadata', 'edit-notebook-metadata', {events: events})
                                    ]
                                }),
                                buildPanel({
                                    title: 'Parameters',
                                    name: 'parameters-group',
                                    hidden: false,
                                    type: 'default',
                                    body: [
                                        form({dataElement: 'input-widget-form'}, [
                                            buildPanel({
                                                title: 'Parameter Options',
                                                type: 'default',
                                                body: [
                                                    makeButton('Show Advanced', 'toggle-advanced', {events: events}),
                                                    makeButton('Reset to Defaults', 'reset-to-defaults', {events: events})
                                                ]
                                            }),
                                            makePanel('Inputs', 'input-widget-input-fields'),
                                            makePanel('Outputs', 'input-widget-output-fields'),
                                            makePanel(span(['Parameters', span({dataElement: 'advanced-hidden'})]), 'input-widget-parameter-fields')
                                        ])
                                    ]
                                }),
                                buildPanel({
                                    title: 'Method Execution',
                                    name: 'run-group',
                                    hidden: false,
                                    type: 'default',
                                    body: [
                                        buildPanel({
                                            title: 'Run Status',
                                            name: 'runStatus',
                                            hidden: false,
                                            type: 'primary',
                                            body: [
                                                div({style: {lineHeight: '20px'}}, [
                                                    span({
                                                    }, [
                                                        span('State:'),
                                                        span({
                                                            style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                            dataElement: 'state'
                                                        })
                                                    ]),
                                                    span({
                                                    }, [
                                                        span({dataElement: 'launchTimeLabel'}),
                                                        span({
                                                            style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                            dataElement: 'launchTime'
                                                        })
                                                    ]),
                                                    span({
                                                    }, [
                                                        span({dataElement: 'queueTimeLabel'}),
                                                        span({
                                                            style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                            dataElement: 'queueTime'
                                                        })
                                                    ]),
                                                    span({
                                                    }, [
                                                        span({dataElement: 'runTimeLabel'}),
                                                        span({
                                                            style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                            dataElement: 'runTime'
                                                        })
                                                    ]),
                                                    span({
                                                    }, [
                                                        span('Completed:'),
                                                        span({
                                                            style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                            dataElement: 'completed'
                                                        })
                                                    ]),
                                                    span({
                                                    }, [
                                                        span('Success:'),
                                                        span({
                                                            style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                            dataElement: 'success'
                                                        })
                                                    ]),
                                                    span({
                                                    }, [
                                                        span('Error:'),
                                                        span({
                                                            style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                                            dataElement: 'error'
                                                        })
                                                    ])
                                                ])
                                            ]
                                        }),
                                        buildPanel({
                                            title: 'Job Details Status',
                                            name: 'job-details',
                                            hidden: false,
                                            type: 'primary',
                                            body: [
                                                table({class: 'table table-striped'}, [
                                                    tr([th('Job Id'), td({dataElement: 'id'})]),
                                                    tr([th('Status'), td({dataElement: 'status'})]),
                                                    tr([th('Deleted?'), td({dataElement: 'deleted'})]),
                                                    tr([th('Submitted'), td({dataElement: 'submitted'})]),
                                                    tr([th('Started'), td({dataElement: 'started'})]),
                                                    tr([th('Completed'), td({dataElement: 'completed'})])
                                                ])
                                            ]
                                        }),
                                        buildPanel({
                                            title: 'Job Log',
                                            name: 'job-log',
                                            hidden: false,
                                            type: 'primary',
                                            body: [
                                                textarea({class: 'form-control', dataElement: 'logs'})
                                            ]
                                        }),
                                        buildPanel({
                                            title: 'Job Error',
                                            name: 'job-error',
                                            hidden: false,
                                            type: 'primary',
                                            body: [
                                                textarea({class: 'form-control', dataElement: 'message'})
                                            ]
                                        }),
                                        buildPanel({
                                            title: 'Job Report',
                                            name: 'job-report',
                                            hidden: false,
                                            type: 'primary',
                                            body: [
                                                div('Objects Created'),
                                                div({dataElement: 'objects-created'}),
                                                div('Message'),
                                                div({dataElement: 'message'}),
                                                div('Warnings'),
                                                div({dataElement: 'warnings'})
                                            ]
                                        })
                                    ]
                                })
                            ])
                        ])
                    ])
                ]);
            return {
                content: content,
                events: events
            };
        }

        function render() {
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
                            return SingleIntInputWidget;
                        case 'checkbox':
                            return SingleCheckboxInputWidget;
                        default:
                            if (parameterSpec.multipleItems()) {
                                return MultiIntInputWidget;
                            }
                            return SingleIntInputWidget;
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
                            console.log('TEXTSUBDATA', parameterSpec);
                            if (parameterSpec.multipleItems()) {
                                return UndefinedInputWidget;
                            }
                            return SingleSubdataWidget;
                        case 'file':
                            return UndefinedInputWidget;
                        case 'custom_textsubdata':
                            console.log('CUSTOM_TEXTSUBDATA', parameterSpec);
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
            var params = meta.getItem('params');
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

        function buildPython(cell) {
            var code = PythonInterop.buildMethodRunner(cell);
            cell.set_text(code);
        }

        function resetPython(cell) {
            cell.set_text('');
        }

        function setStatus(cell, status) {
            meta.setItem('attributes.status', status);
        }

        function getStatus(cell) {
            meta.getItem('attributes.status');
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

                    // TODO:
                    // This should really trigger request for a state change in 
                    // the model. What happens then? Read on ...
                    /*
                     * State change mechanism.
                     * The cell has a state. The state consists of the method
                     * and method inputs.
                     * It also consists of these attributes:
                     * edit - is it editable? what is the editing state?
                     * code - is there code? has it been modified? 
                     * run - is it runnable yet? is it running or finished?
                     * result - is there a result yet? is it an error or result data?
                     * 
                     * Anyway, as a state machine of sorts, what can be done to the 
                     * cell, and what the user can do within it, is determined 
                     * by this state...
                     * 
                     * We need to have a way of expressing this which is not just 
                     * a noodley mess of events and a state object. Not that this
                     * isn't far better than random properties and callbacks.
                     * But still...
                     */

                    //++ +
                    // Nota Bene: This assumes that the control has already validated
                    // the value and it is okay for storing as a 
                    // method parameter.
                    meta.setItem(['params', parameterSpec.id()], message.newValue);
                    // TODO this properly
//                    parentBus.send({
//                        type: 'status',
//                        status: 'editing'
//                    });

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
                        buildPython(cell);
                        updateQuickState({
                            edit: 'editing',
                            params: 'ok',
                            code: 'built',
                            request: null,
                            result: null
                        });
                        setStatus(cell, 'runnable');
                        // renderStatus(cell);

//                        parentBus.send({
//                            type: 'parameters-validated'
//                        });
                    } else {
                        resetPython(cell);
                        updateQuickState({
                            edit: 'editing',
                            params: 'incomplete',
                            code: 'incomplete-params',
                            request: null,
                            result: null
                        });
                        // showStatus(cell);

//                        parentBus.send({
//                            type: 'parameters-invalid',
//                            errors: validationResult.errors
//                        });
                        // don't do anything ...
                        // console.warn(validationResult.errors);
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
                handle: function () {
                    var value = meta.getItem(['params', parameterSpec.id()])
                    bus.send({
                        type: 'update',
                        value: value
                    });
                }
            });

            // just forward...
            //bus.on('newstate', function (message) {
            //    inputWidgetBus.send(message);
            //});

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

        function restoreModelFromMetadata() {
            var runStatus = meta.getItem('runStatus');
            if (runStatus) {
                model.value.runStatus = runStatus;
            } else {
                model.value.runStatus = makeRunStatus();
            }
        }

        // LIFECYCYLE API

        function init() {
            return Promise.try(function () {
                restoreModelFromMetadata();
                initCodeInputArea();
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
            button.innerHTML = (settings.showAdvanced ? 'Hide Advanced' : 'Show Advanced (' + advancedInputs.length + ' hidden)');

            // Also update the 
        }

        function doEditNotebookMetadata() {
            Jupyter.notebook.edit_metadata({
                notebook: Jupyter.notebook,
                keyboard_manager: Jupyter.notebook.keyboard_manager
            });
        }

        function doEditCellMetadata() {
            dialog.edit_metadata({
                md: cell.metadata,
                callback: function (md) {
                    cell.metadata = md;
                },
                name: 'Cell',
                notebook: Jupyter.notebook,
                keyboard_manager: Jupyter.keyboard_manager
            });
        }

        function initCodeInputArea() {
            var codeInputArea = cell.input.find('.input_area');
            if (!cell.kbase.inputAreaDisplayStyle) {
                cell.kbase.inputAreaDisplayStyle = codeInputArea.css('display');
            }
            meta.setItem('user-settings.showCodeInputArea', false);
        }

        function showCodeInputArea() {
            var codeInputArea = cell.input.find('.input_area');
            if (meta.getItem('user-settings.showCodeInputArea')) {
                codeInputArea.css('display', cell.kbase.inputAreaDisplayStyle);
            } else {
                codeInputArea.css('display', 'none');
            }
        }


        function toggleCodeInputArea(cell) {
            if (meta.getItem('user-settings.showCodeInputArea')) {
                meta.setItem('user-settings.showCodeInputArea', false);
            } else {
                meta.setItem('user-settings.showCodeInputArea', true);
            }
            showCodeInputArea();
            return meta.getItem('user-settings.showInputCodeArea');
        }

        function toggleDeveloperOptions(cell) {
            var name = 'showDeveloperOptions',
                selector = 'developer-options',
                node = getElement(selector),
                showing = meta.getItem(['user-settings', name]);
            if (showing) {
                meta.setItem(['user-settings', name], false);
            } else {
                meta.setItem(['user-settings', name], true);
            }
            showing = meta.getItem(['user-settings', name]);
            if (showing) {
                node.style.display = 'block';
            } else {
                node.style.display = 'none';
            }
            return showing;
        }

        function updateQuickState(newState) {
            // do we need to do anything special for this state change?
            // TODO:

            // udpate the metadata
            meta.setItem('state', newState);

            evaluateQuickState();

            // re-render
            renderQuickState();
        }

        /*
         * Determine the current cell mode based on the various state properties.
         */
        function evaluateQuickState() {
            var state = meta.getItem('state');

            // Now adjust the ui
            switch (state.request) {
                case null:
                    if (state.code === 'built') {
                        getButton('run').classList.remove('disabled');
                    } else {
                        getButton('run').classList.add('disabled');
                    }

                    // Run display.
                    getElement('run-group').style.display = 'none';
                    getElement('parameters-group').style.display = 'block';

                    break;
                case 'executed':
                    // lock the run button
                    getButton('run').classList.add('disabled');

                    // lock the inputs

                    // actually, re-render the inputs as read-only.

                    // show the run stuff.
                    getElement('run-group').style.display = 'block';
                    getElement('parameters-group').style.display = 'none';
                    break;
                case 'running':
                    // lock the run button
                    getButton('run').classList.add('disabled');

                    // lock the inputs

                    // actually, re-render the inputs as read-only.

                    // show the run stuff.
                    getElement('run-group').style.display = 'block';
                    getElement('parameters-group').style.display = 'none';
                    break;
                case 'completed':
                    // lock the run button
                    getButton('run').classList.add('disabled');

                    // lock the inputs

                    // actually, re-render the inputs as read-only.

                    // show the run stuff.
                    getElement('run-group').style.display = 'block';
                    getElement('parameters-group').style.display = 'none';
                    break;
            }
        }

        // a shortcut for now...
        function renderQuickState() {
            // Show the quick status bar
            var state = meta.getItem('state');
            if (state) {
                Object.keys(state).forEach(function (key) {
                    var stateValue = state[key],
                        el = getElement(['status-bar', key]);

                    if (el) {
                        el.innerHTML = stateValue || 'n/a';
                    }
                });
            }

            // Now adjust the ui
            switch (state.request) {
                case null:
                    if (state.code === 'built') {
                        enableButton('run');
                        disableButton('re-run');
                        enableButton('reset-to-defaults');
                        enableButton('toggle-advanced');
                        enableButton('toggle-developer-options');
                    } else {
                        disableButton('run');
                        disableButton('re-run');
                        enableButton('reset-to-defaults');
                        enableButton('toggle-advanced');
                        enableButton('toggle-developer-options');
                    }

                    // Run display.
                    hideElement('run-group');
                    showElement('parameters-group');

                    break;
                case 'executed':
                    // lock the run button

                    disableButton('run');
                    enableButton('re-run');
                    enableButton('toggle-developer-options');

                    // lock the inputs

                    // actually, re-render the inputs as read-only.

                    // show the run stuff.
                    showElement('run-group');
                    hideElement('parameters-group');
                    break;
                case 'running':
                    // lock the run button
                    getButton('run').classList.add('disabled');

                    // lock the inputs

                    // actually, re-render the inputs as read-only.

                    // show the run stuff.
                    getElement('run-group').style.display = 'block';
                    getElement('parameters-group').style.display = 'none';
                    break;
                case 'completed':
                    // lock the run button
                    getButton('run').classList.add('disabled');

                    // lock the inputs

                    // actually, re-render the inputs as read-only.

                    // show the run stuff.
                    getElement('run-group').style.display = 'block';
                    getElement('parameters-group').style.display = 'none';
                    break;

            }
        }

        function getElement(names) {
            if (typeof names === 'string') {
                names = [names];
            }
            var selector = names.map(function (name) {
                return '[data-element="' + name + '"]';
            }).join(' ');

            return container.querySelector(selector);
        }

        function getButton(names) {
            if (typeof names === 'string') {
                names = [names];
            }
            var selector = names.map(function (name) {
                return '[data-button="' + name + '"]';
            }).join(' '),
                button = container.querySelector(selector);
            if (!button) {
                throw new Error('Button ' + names.join('/') + ' not found');
            }
            return button;
        }

        function getNode(names) {
            if (!(names instanceof Array)) {
                names = [names];
            }
            var selector = names.map(function (dataSelector) {
                return '[data-' + dataSelector.type + '="' + dataSelector.name + '"]';
            }).join(' ');

            return container.querySelector(selector);
        }

        function renderJobDetails() {
            var details = meta.getItem('jobDetails');

            if (details) {
                Object.keys(details).forEach(function (key) {
                    var value = details[key],
                        el = getElement(['job-details', key]);
                    if (el) {
                        el.innerHTML = value;
                    }
                });
            }
        }

        function confirmDialog(prompt, yes, no) {
            return window.confirm(prompt);
        }

        function doRerun() {
            var confirmed = confirmDialog('Are you sure you want to zap the data?', 'Yes', 'No way, dude');
            if (!confirmed) {
                return;
            }

            // delete the job
            var job = meta.getItem('jobDetails');

            if (job) {
                runtime.send({
                    type: 'delete-job',
                    jobId: job.id
                });
            }
            meta.deleteItem('job');

            // remove job state and history

            // set the new state

            // re-render.

        }

        var inputBusses = [],
            inputBusMap = {};
        function start() {
            return Promise.try(function () {
                var bus = inputWidgetBus;

                showCodeInputArea();

                /*
                 * listeners for the local input cell message bus
                 */
                bus.on('reset-to-defaults', function () {
                    inputBusses.forEach(function (inputBus) {
                        inputBus.send({
                            type: 'reset-to-defaults'
                        });
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
                bus.on('toggle-code-view', function () {
                    var showing = toggleCodeInputArea(),
                        label = showing ? 'Hide Code' : 'Show Code';
                    setButtonLabel('toggle-code-view', label);
                });
                bus.on('edit-cell-metadata', function () {
                    doEditCellMetadata();
                });
                bus.on('edit-notebook-metadata', function () {
                    doEditNotebookMetadata();
                });
                bus.on('toggle-developer-options', function () {
                    var showing = toggleDeveloperOptions(cell),
                        label = showing ? 'Hide Dev Options' : 'Show Dev Options';
                    setButtonLabel('toggle-developer-options', label);
                });
                bus.on('run', function () {
                    doRun();
                });
                bus.on('re-run', function () {
                    doRerun();
                });

                parentBus.listen({
                    test: function (message) {
                        return (message.type === 'newstate');
                    },
                    handle: function (message) {
                        console.log('GOT NEWSTATE', message);
                        // updateQuickState(message.state);
                    }
                });

                parentBus.on('reset-to-defaults', function () {
                    bus.send({
                        type: 'reset-to-defaults'
                    });
                });
                
                runtime.bus().listen({
                    test: function (message) {
                        if (message.type === 'runstatus') {
                            console.log('RUNSTATUS', message);
                        }
                        return (message.type === 'runstatus' && message.data.cell_id === cell.metadata.kbase.attributes.id);
                    },
                    handle: function (message) {
                        var event = message.data.event;
                        updateRunLaunchStatus(message.data);
                        cell.pushMeta('log', {
                            timestamp: new Date(),
                            event: 'runstatus',
                            data: {
                                jobId: message.jobId,
                                runId: message.runId,
                                status: message.event
                            }
                        });
                    }
                });

                runtime.bus().listen({
                    test: function (message) {
                        return (message.type === 'jobstatus' && message.jobState.cell_id === cell.metadata.kbase.attributes.id);
                    },
                    handle: function (message) {
                        var jobStatus = message.job.state.job_state;

                        // Update current status
                        updateJobStatus(message);
                        updateRunJobStatus(message.job);
                        renderRunStatus();
                        updateJobDetails(message);
                        // updateJobLog(message);
                        updateJobReport(message.job);
                        renderJobReport();
                        renderJobError();

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
                                jobId: message.jobId,
                                status: jobStatus
                            }
                        });
                    }
                });
                return null;
            });
        }

        // TODO: corral in the async requests! We don't want them to overlap, 
        // that's for sure.
        function updateJobLog(data) {
            Jobs.getLogData(data.jobId, 0)
                .then(function (logLines) {
                    console.log('Got log lines!', logLines.length, logLines);
                })
                .catch(function (err) {
                    console.error('Error getting log lines', err);
                    getElement(['job-log', 'logs']).innerHTML = 'ERROR:\n' +
                        err.remoteStacktrace.join('\n');
                });
        }

        /*
         * 
         * Job errors
         */
        function getJobError(job) {
            /*
             * If the job has not completed, there will be not outputs, so we 
             * can just bail.
             */
            if (!job.state.step_errors || Object.keys(job.state.step_errors).length === 0) {
                return;
            }

            var stepJobIds = job.state.step_job_ids,
                stepKey = Object.keys(stepJobIds)[0],
                stepError = job.state.step_errors[stepKey];

            return stepError;
        }

        /*
         * Okay, the job report is buried in the job state.
         * In the job state is a "step_job_ids" a holdover from the app days
         * In it is one property, which represents the job for this method/app.
         * The key matches the outputs found in the step_outputs property.
         * The value for that the step_outputs property is a string, but it is a 
         * tricky string, for it is a JSON string. We parse that to get the 
         * final project ... the report_ref, which we can use to get the report!
         * 
         */
        function updateJobReport(job) {
            /*
             * If the job has not completed, there will be not outputs, so we 
             * can just bail.
             */
            if (!job.state.step_outputs || Object.keys(job.state.step_outputs).length === 0) {
                return;
            }

            var stepJobIds = job.state.step_job_ids,
                stepKey = Object.keys(stepJobIds)[0],
                stepOutput = JSON.parse(job.state.step_outputs[stepKey]),
                reportRef = stepOutput[0].report_ref,
                workspace = new Workspace(runtime.config('services.workspace.url'), {
                    token: runtime.authToken()
                });

            return workspace.get_objects([{
                    ref: reportRef
                }])
                .then(function (result) {
                    if (!result[0]) {
                        return;
                    }
                    var report = result[0].data;
                    // Store it in the metadata.
                    meta.setItem('jobReport', JSON.parse(JSON.stringify(report)));
                })
                .catch(function (err) {
                    console.error('Error getting report', err);
                });
        }

        function renderJobError() {
            var error = meta.getItem('runStatus.errorMessage'),
                node = getElement(['job-error', 'message']);

            if (error) {
                node.innerHTML = error;
            }
        }

        function renderJobReport() {
            var report = meta.getItem('jobReport'),
                objectsCreated, warnings;
            if (!report) {
                return;
            }

            if (report.objects_created.length === 0) {
                objectsCreated = 'no objects created';
            } else {
                objectsCreated = ul(report.objects_created.map(function (object) {
                    return li(object);
                }).join('\n'));
            }
            getElement(['job-report', 'objects-created']).innerHTML = objectsCreated;

            getElement(['job-report', 'message']).innerHTML = report.text_message || ' no message';

            if (report.warnings.length === 0) {
                warnings = 'no warnings';
            } else {
                warnings = ul(report.warnings.map(function (object) {
                    return li(object);
                }).join('\n'));
            }
            getElement(['job-report', 'warnings']).innerHTML = warnings;
        }

        function updateJobDetails(data) {
            var details = {
                id: data.jobId,
                status: data.job.state.job_state,
                deleted: data.job.state.is_deleted,
                submitted: data.job.state.submit_time,
                started: data.job.state.start_time,
                completed: data.job.state.complete_time
            };
            meta.setItem('jobDetails', details);

            renderJobDetails();
        }

        function updateJobStatus(data) {
            var state = meta.getItem('state'), newState;
            switch (data.jobState.status) {
                case 'queued':
                    newState = {
                        edit: 'disabled',
                        code: 'locked',
                        request: 'queued',
                        result: null
                    };
                    break;
                case 'job_started':
                    newState = {
                        edit: 'disabled',
                        code: 'locked',
                        request: 'running',
                        result: null
                    };
                    // ???
                    addJob(cell, data.job_id);
                    break;
                case 'in-progress':
                    newState = {
                        edit: 'disabled',
                        code: 'locked',
                        request: 'in-progress',
                        result: null
                    };
                    break;
                case 'completed':
                    newState = {
                        edit: 'disabled',
                        code: 'locked',
                        request: 'completed',
                        result: 'success'
                    };
                    break;
                case 'suspend':
                case 'error':
                    newState = {
                        edit: 'disabled',
                        code: 'locked',
                        request: 'completed',
                        result: 'error'
                    };
                    break;
            }
            updateQuickState(newState);
            renderQuickState();
        }

        function elapsed(value, defaultValue) {
            if (!value) {
                return defaultValue;
            }
            if (value.elapsed) {
                return String(value.elapsed);
            }
            return defaultValue;
        }

        function makeRunStatus() {
            return {
                launch: null,
                queued: null,
                running: null,
                completed: null,
                success: null,
                error: null
            };
        }

        function renderRunStatus() {
            var state = model.value.runStatus,
                viewModel;

            if (!state) {
                return;
            }

            viewModel = {
                state: state.state || 'n/a',
                launchTimeLabel: (function () {
                    if (state.launch && state.launch.start) {
                        if (state.launch.end) {
                            return 'Launched';
                        } else {
                            return 'Launching';
                        }
                    } else {
                        return 'Will Launch';
                    }
                }()),
                launchTime: elapsed(state.launch) || '',
                queueTimeLabel: (function () {
                    if (state.queued && state.queued.start) {
                        if (state.queued.end) {
                            return 'Queued';
                        } else {
                            return 'Queueing';
                        }
                    } else {
                        return 'Will Queue';
                    }
                }()),
                queueTime: elapsed(state.queued) || '',
                runTimeLabel: (function () {
                    if (state.running && state.running.start) {
                        if (state.running.end) {
                            return 'Ran';
                        } else {
                            return 'Running';
                        }
                    } else {
                        return 'Will Run';
                    }
                }()),
                runTime: elapsed(state.running, ''),
                completed: state.completed ? 'yes' : '',
                success: state.success ? 'yes' : '',
                error: state.error ? 'yes' : ''
            };
            Object.keys(viewModel).forEach(function (key) {
                var stateValue = viewModel[key],
                    el = getElement(['runStatus', key]);
                if (el) {
                    el.innerHTML = stateValue;
                }
            });
        }

        function updateRunJobStatus(job) {
            var runStatus = model.value.runStatus,
                // job = data.jobState,
                now = new Date().getTime();
            if (!runStatus) {
                runStatus = makeRunStatus();
            }
            /*
             * Once we have recorded a completed state, the run status should
             * not be updated.
             * Somewhere we must be protected from invald run updates ...
             */
            if (runStatus.completed) {
                return;
            }

            switch (job.state.job_state) {
                case 'queued':
                    runStatus.state = 'queued';
                    if (!runStatus.queued) {
                        var submitTime = new Date(job.state.submit_time).getTime();
                        if (!runStatus.launch) {
                            console.warn('No launch state before job queued!');
                            // repair the state
                            runStatus.launch = {
                                start: null,
                                end: submitTime,
                                elapsed: 0
                            };
                        } else {
                            runStatus.launch.end = submitTime;
                            runStatus.launch.elapsed = runStatus.launch.end - runStatus.launch.start;
                        }
                        runStatus.queued = {
                            start: submitTime,
                            elapsed: now - submitTime
                        };
                    } else {
                        runStatus.queued.elapsed = now - runStatus.queued.start;
                    }
                    break;
//                case 'job-started':
//                    if (!runStatus.queue) {
//                        console.warn('No queue state before job start!');
//                        // repair the state
//                        runStatus.queue = {
//                            elapsed: 0
//                        };
//                    } else {
//                        runStatus.queue.end = new Date().getTime();
//                        runStatus.queue.elapsed = runStatus.queue.end - runStatus.queue.start;
//                    }
//                    runStatus.running = {
//                        start: new Date()
//                    };
//                    break;
                case 'in-progress':
                    runStatus.state = 'running';

                    var startTime = new Date(job.state.start_time).getTime();
                    var submitTime = new Date(job.state.submit_time).getTime();
                    if (!runStatus.running) {
                        console.warn('No job start state before job in progress!');
                        runStatus.running = {
                            start: startTime,
                            elapsed: now - startTime
                        };
                        if (!runStatus.queued) {
                            console.warn('no queued before in-progress');
                            runStatus.queued = {
                                start: submitTime
                            };
                        }
                        runStatus.queued.end = startTime;
                        runStatus.queued.elapsed = startTime - submitTime;
                    } else {
                        runStatus.running.elapsed = now - runStatus.running.start;
                    }
                    break;
                case 'completed':
                    runStatus.state = 'completed';
                    if (!runStatus.completed) {
                        var completedTime = new Date(job.state.complete_time).getTime();
                        var startTime = new Date(job.state.start_time).getTime();
                        if (!runStatus.queued) {
                            var submitTime = new Date(job.state.submit_time).getTime();
                            var startTime = new Date(job.state.start_time).getTime();
                            console.warn('no queued before completed');
                            runStatus.queued = {
                                start: submitTime,
                                end: startTime,
                                elapsed: startTime - submitTime
                            };
                        }
                        if (!runStatus.running) {
                            console.warn('No job start or progress state before job completed !');
                            // repair the state
                            runStatus.running = {
                                start: startTime
                            };
                        } else {
                            runStatus.running.end = completedTime;
                            runStatus.running.elapsed = completedTime - startTime;
                        }
                        runStatus.completed = true;
                        runStatus.success = true;
                    }
                    break;
                case 'suspend':
                    runStatus.state = 'error';
                    var completedTime = new Date(job.state.complete_time).getTime();
                    var startTime = new Date(job.state.start_time).getTime();
                    if (!runStatus.running) {
                        console.warn('No job start or progress state before job completed with error!');
                        runStatus.running = {
                            start: startTime
                        };
                    }
                    runStatus.running.end = completedTime;
                    runStatus.running.elapsed = startTime - completedTime;
                    runStatus.errorMessage = getJobError(job);
                    runStatus.completed = true;
                    runStatus.error = true;
                    break;
                case 'error':
                    runStatus.state = 'error';
                    var completedTime = new Date(job.state.complete_time).getTime();
                    var startTime = new Date(job.state.start_time).getTime();
                    if (!runStatus.running) {
                        console.warn('No job start or progress state before job completed with error !');
                        // repair the state
                        runStatus.running = {
                            start: startTime
                        };
                    }
                    runStatus.running.end = completedTime;
                    runStatus.running.elapsed = startTime - completedTime;
                    runStatus.error = true;
                    break;
            }

            model.value.runStatus = runStatus;
            meta.setItem('runStatus', runStatus);
        }

        function updateRunLaunchStatus(runMessage) {
            var runStatus = model.value.runStatus,
                now = new Date().getTime();
            if (!runStatus) {
                runStatus = makeRunStatus();
            }
            /*
             * Once we have recorded a completed state, the run status should
             * not be updated.
             * Somewhere we must be protected from invald run updates ...
             */
            if (runStatus.completed) {
                return;
            }

            // These methods are guaranteed to only happen once, and we should
            // get every single event.
            switch (runMessage.event) {
                case 'validating_method':
                    runStatus.state = 'validating',
                        runStatus.launch = {
                            start: new Date().getTime()
                        };
                    break;
                case 'validated_method':
                    runStatus.state = 'validated';
                    runStatus.launch.elapsed = now - runStatus.launch.start;
                    break;
                case 'launching_job':
                    runStatus.state = 'launching';
                    runStatus.launch.elapsed = now - runStatus.launch.start;
                    break;
                case 'launched_job':
                    runStatus.state = 'launched';
                    runStatus.launch.elapsed = now - runStatus.launch.start;
                    break;
            }

            model.value.runStatus = runStatus;
            meta.setItem('runStatus', runStatus);
        }

        function doRun() {
            updateQuickState({
                edit: 'locked',
                params: 'locked',
                code: 'locked',
                request: 'executed',
                result: 'pending'
            });
            cell.execute();
        }

        function run(params) {
            var widgets = [];
            // First get the method specs, which is stashed in the model, 
            // with the parameters returned.
            return fetchData(params.methodId, params.methodTag)
                .then(function (parameterSpecs) {
                    // Render the layout.
                    render();                    
                    cell.setMeta('attributes', 'title', model.value.methodSpec.info.name);
                    renderQuickState();
                    renderJobDetails();
                    renderRunStatus();
                    renderJobReport();
                    renderJobError();


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
                                    var fieldWidget = makeFieldWidget(cell, spec, meta.getItem(['params', spec.name()])),
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
                                    var fieldWidget = makeFieldWidget(cell, spec, meta.getItem(['params', spec.name()])),
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
                                    var fieldWidget = makeFieldWidget(cell, spec, meta.getItem(['params', spec.name()])),
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
                    // if this is the first time running this widget, the edit state will be 
                    // null. Well, we are now editing, so set it.
                    // updateQuickState({edit: 'editing'});
                });
        }

        // INIT

        meta = Props.make({
            data: utils.getMeta(cell, 'methodCell'),
            onUpdate: function (props) {
                utils.setMeta(cell, 'methodCell', props.getRawObject());
            }
        });

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