/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    '../validation',
    'common/events',
    'common/ui',
    'common/runtime',
    '../inputParamResolver',
    '../fieldWidgetCompact',

    'bootstrap',
    'css!font-awesome'
], function (
    Promise,
    html,
    Validation,
    Events,
    UI,
    Runtime,
    Resolver,
    FieldWidget) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), span = t('span'),
        resolver = Resolver.make();

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            constraints = spec.data.constraints,
            container,
            parent,
            bus = config.bus,
            ui,
            model = {

            },
            viewModel = {},
            runtime = Runtime.make(),
            structFields,
            fieldLayout = spec.ui.layout,
            struct = spec.parameters;

        function setModelValue(value, index) {
            return Promise.try(function () {
                model.value = value;
                
            })
                .then(function () {
                    // render();
                })
                .catch(function (err) {
                    console.error('Error setting model value', err);
                });
        }

        function unsetModelValue() {
            return Promise.try(function () {
                model.value = {};
            })
                .then(function (changed) {
                    // render();
                });
        }

        function resetModelValue() {
            if (spec.defaultValue) {
                setModelValue(spec.defaultValue);
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
            props.forEach(function (prop) {
                newObj[prop] = from[prop];
            });
            return newObj;
        }

        function validate(rawValue) {
            return Promise.try(function () {
                var validationOptions = {
                    required: spec.required()
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

        function makeInputControl(events, bus) {
            var promiseOfFields = fieldLayout.map(function (fieldName) {
                var fieldSpec = struct[fieldName];

                return makeSingleInputControl(fieldSpec, events, bus);
            });

            // TODO: support different layouts, this is a simple stacked
            // one for now.


            return Promise.all(promiseOfFields)
                .then(function (fields) {
                    var layout = div({style: {border: '1px silver solid', padding: '4px'}}, 
                        fields.map(function (field) {
                        return div({id: field.id, style: {border: '0px orange dashed', padding: '0px'}});
                    }).join('\n'));
                    
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
                .then(function (widgetFactory) {

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
                    fieldBus.on('sync', function (message) {
                        var value = viewModel[fieldSpec.id];
                        if (value) {
                            fieldBus.emit('update', {
                                value: value
                            });
                        }
                    });
                    fieldBus.on('validation', function (message) {
                        if (message.diagnosis === 'optional-empty') {
                            bus.emit('changed', {
                                newValue: viewModel
                            });
                        }
                    });
                    fieldBus.on('changed', function (message) {
                        viewModel[fieldSpec.id] = message.newValue;
                        bus.emit('changed', {
                            parameter: fieldSpec.id,
                            newValue: viewModel
                        });
                    });

                    fieldBus.on('touched', function (message) {
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
                .then(function (result) {
                    ui.setContent('input-container', result.content);
                    structFields = {};
                    result.fields.forEach(function (field) {
                        structFields[field.fieldName] = field;
                    });
                        
                    // Start up all the widgets
                    return Promise.all(
                        result.fields.map(function (field) {
                            return field.instance.start({
                                node: document.getElementById(field.id)
                            });
                        }));
                })
                .catch(function (err) {
                    console.error(err);
                    ui.setContent('input-container', 'ERROR!' + err.message);
                });
        }
        
        function render(events) {
            container.innerHTML = div({
                        dataElement: 'main-panel'
                    }, [
                        div({dataElement: 'input-container'}, )
                    ]);
            
            return renderStruct(events);
        }

        function autoValidate() {
            return Promise.all(model.value.map(function (value, index) {
                // could get from DOM, but the model is the same.
                var rawValue = container.querySelector('[data-index="' + index + '"]').value;
                return validate(rawValue);
            }))
                .then(function (results) {
                    // a bit of a hack -- we need to handle the 
                    // validation here, and update the individual rows
                    // for now -- just create one mega message.
                    var errorMessages = [],
                        validationMessage;
                    results.forEach(function (result, index) {
                        if (result.errorMessage) {
                            errorMessages.push(result.errorMessage + ' in item ' + index);
                        }
                    });
                    if (errorMessages.length) {
                        validationMessage = {
                            diagnosis: 'invalid',
                            errorMessage: errorMessages.join('<br/>')
                        };
                    } else {
                        validationMessage = {
                            diagnosis: 'valid'
                        };
                    }
                    bus.emit('validation', validationMessage);

                });
        }

        // LIFECYCLE API
        
        // Okay, we need to 

        function start() {
            return Promise.try(function () {
                bus.on('run', function (message) {
                    var events = Events.make();
                    Promise.try(function () {
                        parent = message.node;
                        container = parent.appendChild(document.createElement('div'));
                        ui = UI.make({node: container});

                        return render(events);
                    })
                    .then(function (theLayout) {
                        events.attachEvents(container);

                        bus.on('reset-to-defaults', function (message) {
                            resetModelValue();
                        });
                        bus.on('update', function (message) {
                            // Update the model, and since we have sub widgets,
                            // we should send the individual data to them.
                            // setModelValue(message.value);
                            viewModel = message.value;
                                console.log('struct update', message);
                            Object.keys(message.value).forEach(function (id) {
                                structFields[id].bus.emit('update', {
                                    value: message.value[id]
                                });
                            });

                        });
                        // A fake submit.
                        bus.on('submit', function () {
                            bus.emit('submitted', {
                                value: viewModel
                            });
                        });
                        // The controller of this widget will be smart enough to 
                        // know...
                        bus.emit('sync');
                    })
                    .catch(function (err) {
                        console.error('ERROR',err);
                        container.innerHTML = err.message;
                    });
                });
            });
        }

        function stop() {
            return Promise.try(function () {
                if (structFields) {
                    structFields.forEach(function (field) {
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
        make: function (config) {
            return factory(config);
        }
    };
});