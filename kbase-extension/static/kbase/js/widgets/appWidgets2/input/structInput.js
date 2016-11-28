/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    '../validation',
    'common/events',
    'common/ui',
    'common/runtime',
    'common/lang',
    '../inputParamResolver',
    '../fieldWidgetCompact',

    'bootstrap',
    'css!font-awesome'
], function(
    Promise,
    html,
    Validation,
    Events,
    UI,
    Runtime,
    lang,
    Resolver,
    FieldWidget) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        input = t('input'),
        span = t('span'),
        resolver = Resolver.make();

    function factory(config) {
        var spec = config.parameterSpec,
            container,
            parent,
            bus = config.bus,
            ui,
            viewModel = {
                data: {},
                meta: {
                    enabled: null
                }
            },
            runtime = Runtime.make(),
            structFields = null,
            // model = {
            //     value: {},
            //     enabled: null
            // },
            // structFields,
            fieldLayout = spec.ui.layout,
            struct = spec.parameters,
            places = {};

        if (spec.data.constraints.required) {
            viewModel.meta.enabled = true;
        } else {
            viewModel.meta.enabled = false;
        }

        function setModelValue(value) {
            return Promise.try(function() {
                    viewModel.data = value;

                })
                .then(function() {
                    // render();
                })
                .catch(function(err) {
                    console.error('Error setting model value', err);
                });
        }

        function unsetModelValue() {
            return Promise.try(function() {
                    viewModel.data = {};
                })
                .then(function(changed) {
                    // render();
                });
        }

        function resetModelValue() {
            if (spec.defaultValue) {
                setModelValue(lang.copy(spec.defaultValue));
            } else {
                unsetModelValue();
            }
        }

        /*
         * If the parameter is optional, and is empty, return null.
         * If it allows multiple values, wrap single results in an array
         * There is a weird twist where if it ...
         * well, hmm, the only consumer of this, isValid, expects the values
         * to mirror the input rows, so we shouldn't really filter out any
         * values.
         */

        function getInputValue() {
            return ui.getElement('input-container.input').value;
        }

        /*
         *
         * Text fields can occur in multiples.
         * We have a choice, treat single-text fields as a own widget
         * or as a special case of multiple-entry -- 
         * with a min-items of 1 and max-items of 1.
         * 
         *
         */

        function copyProps(from, props) {
            var newObj = {};
            props.forEach(function(prop) {
                newObj[prop] = from[prop];
            });
            return newObj;
        }

        function validate(rawValue) {
            return Promise.try(function() {
                var validationOptions = {
                    required: spec.data.constraints.required
                };
                return Validation.validateTextString(rawValue, validationOptions);
            });
        }

        function updateValue() {

        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */


        // here is where we left off ... the single input control is now a field, which is a struct
        // containing a widget, created but not started. We need to create a structure in 
        // which to embed the widget, link them in (by id), then start them...
        // we also need to stop them, so we will need to have a structure for the widgets.
        // either do that here, or in makesingleinputcontrol as it used to do

        function doToggleEnableControl(ev) {
            var label = document.querySelector('#' + places.enableControl + ' [data-element="label"]');
            if (viewModel.meta.enabled) {
                viewModel.meta.enabled = false;
                label.innerHTML = 'Enable';
                Object.keys(structFields).forEach(function(id) {
                    var field = structFields[id];
                    field.bus.emit('disable');
                });
            } else {
                viewModel.meta.enabled = true;
                label.innerHTML = 'Enabled';
                Object.keys(structFields).forEach(function(id) {
                    var field = structFields[id];
                    field.bus.emit('enable');
                });
            }
        }

        function enableControl(events) {
            var required = spec.data.constraints.required;

            places.enableControl = html.genId();

            // If the group is required, there is no choice, it is always enabled.
            if (required) {
                return div({
                    id: places.enableControl
                }, [
                    input({
                        type: 'checkbox',
                        checked: true,
                        readonly: true,
                        disabled: true
                    }),
                    ' This group is required'
                ]);
            }

            var label;
            if (viewModel.meta.enabled) {
                label = 'Disable';
            } else {
                label = 'Enable'
            }
            return div({
                id: places.enableControl
            }, [
                input({
                    id: events.addEvent({
                        type: 'click',
                        handler: function(e) {
                            doToggleEnableControl(e);
                        }
                    }),
                    type: 'checkbox',
                    checked: false
                }),
                span({
                    dataElement: 'label',
                    style: {
                        marginLeft: '4px'
                    }
                }, label)
            ]);
        }

        function makeInputControl(events, bus) {
            var promiseOfFields = fieldLayout.map(function(fieldName) {
                var fieldSpec = struct.specs[fieldName];

                return makeSingleInputControl(fieldSpec, events, bus);
            });

            // TODO: support different layouts, this is a simple stacked
            // one for now.


            return Promise.all(promiseOfFields)
                .then(function(fields) {
                    var layout = div({ style: { border: '1px silver solid', padding: '4px' } }, [
                        div({
                            class: 'row'
                        }, [
                            enableControl(events)
                        ])
                    ].concat(
                        fields.map(function(field) {
                            return div({ id: field.id, style: { border: '0px orange dashed', padding: '0px' } });
                        })).join('\n'));

                    return {
                        content: layout,
                        fields: fields
                    };
                });
        }

        /*
         * The single input control wraps a field widget, which provides the 
         * wrapper around the input widget itself.
         */
        function makeSingleInputControl(fieldSpec, events) {
            return resolver.getInputWidgetFactory(fieldSpec)
                .then(function(widgetFactory) {

                    var fieldBus = runtime.bus().makeChannelBus(null, 'Control bus'),
                        id = html.genId(),
                        fieldWidget = FieldWidget.make({
                            inputControlFactory: widgetFactory,
                            showHint: true,
                            useRowHighight: true,
                            // initialValue: value,
                            // appSpec: appSpec,
                            parameterSpec: fieldSpec,
                            bus: fieldBus,
                            // workspaceId: workspaceInfo.id,
                            referenceType: 'ref'
                        });

                    // set up listeners for the input
                    fieldBus.on('sync', function(message) {
                        var value = viewModel.data[fieldSpec.id];
                        if (value) {
                            fieldBus.emit('update', {
                                value: value
                            });
                        }
                    });
                    fieldBus.on('validation', function(message) {
                        if (message.diagnosis === 'optional-empty') {
                            bus.emit('changed', {
                                newValue: viewModel.data
                            });
                        }
                    });
                    fieldBus.on('changed', function(message) {
                        viewModel.data[fieldSpec.id] = message.newValue;
                        bus.emit('changed', {
                            newValue: viewModel.data
                        });
                    });

                    fieldBus.on('touched', function(message) {
                        bus.emit('touched', {
                            parameter: fieldSpec.id
                        });
                    });

                    return {
                        id: id,
                        bus: fieldBus,
                        fieldName: fieldSpec.id,
                        instance: fieldWidget
                    };
                });
        }



        /*
         * Render the struct input control and place, place it into the dom,
         * attach events, and start up the field widgets.
         */
        function renderStruct(events) {
            return makeInputControl(events)
                .then(function(result) {
                    ui.setContent('input-container', result.content);
                    structFields = {};
                    result.fields.forEach(function(field) {
                        structFields[field.fieldName] = field;
                    });


                    // Start up all the widgets
                    return Promise.all(
                        result.fields.map(function(field) {
                            return field.instance.start({
                                node: document.getElementById(field.id)
                            });
                        }));
                })
                .then(function() {
                    Object.keys(structFields).forEach(function(id) {
                        if (viewModel.meta.enabled) {
                            structFields[id].bus.emit('enable');
                        } else {
                            structFields[id].bus.emit('disable');
                        }
                    })
                })
                .catch(function(err) {
                    console.error(err);
                    ui.setContent('input-container', 'ERROR!' + err.message);
                });
        }

        function render(events) {
            container.innerHTML = div({
                dataElement: 'main-panel'
            }, [
                div({ dataElement: 'input-container' })
            ]);

            return renderStruct(events);
        }

        // function autoValidate() {
        //     return Promise.all(viewModel.data.map(function (value, index) {
        //             // could get from DOM, but the model is the same.
        //             var rawValue = container.querySelector('[data-index="' + index + '"]').value;
        //             return validate(rawValue);
        //         }))
        //         .then(function (results) {
        //             // a bit of a hack -- we need to handle the 
        //             // validation here, and update the individual rows
        //             // for now -- just create one mega message.
        //             var errorMessages = [],
        //                 validationMessage;
        //             results.forEach(function (result, index) {
        //                 if (result.errorMessage) {
        //                     errorMessages.push(result.errorMessage + ' in item ' + index);
        //                 }
        //             });
        //             if (errorMessages.length) {
        //                 validationMessage = {
        //                     diagnosis: 'invalid',
        //                     errorMessage: errorMessages.join('<br/>')
        //                 };
        //             } else {
        //                 validationMessage = {
        //                     diagnosis: 'valid'
        //                 };
        //             }
        //             bus.emit('validation', validationMessage);

        //         });
        // }

        // LIFECYCLE API

        // Okay, we need to 

        function start() {
            return Promise.try(function() {
                bus.on('run', function(message) {
                    var events = Events.make();
                    Promise.try(function() {
                            parent = message.node;
                            console.log('STRUCT PARENT?', parent, message);
                            container = parent.appendChild(document.createElement('div'));
                            ui = UI.make({ node: container });

                            return render(events);
                        })
                        .then(function(theLayout) {
                            events.attachEvents(container);

                            bus.on('reset-to-defaults', function(message) {
                                resetModelValue();
                            });

                            bus.on('update', function(message) {
                                // Update the model, and since we have sub widgets,
                                // we should send the individual data to them.
                                // setModelValue(message.value);
                                viewModel.data = message.value;
                                console.log('struct update', message);
                                Object.keys(message.value).forEach(function(id) {
                                    structFields[id].bus.emit('update', {
                                        value: message.value[id]
                                    });
                                });

                            });
                            // A fake submit.
                            bus.on('submit', function() {
                                bus.emit('submitted', {
                                    value: viewModel.data
                                });
                            });
                            // The controller of this widget will be smart enough to 
                            // know...
                            bus.emit('sync');
                        })
                        .catch(function(err) {
                            console.error('ERROR', err);
                            container.innerHTML = err.message;
                        });
                });
            });
        }

        function stop() {
            return Promise.try(function() {
                if (structFields) {
                    structFields.forEach(function(field) {
                        field.stop();
                    });
                }
            });
        }

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