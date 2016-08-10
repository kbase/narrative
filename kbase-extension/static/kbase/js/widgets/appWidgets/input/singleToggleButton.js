/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'jquery',
    'base/js/namespace',
    'kb_common/html',
    'common/validation',
    'common/events',
    'common/ui',
    'common/props',
    
    'bootstrap',
    'css!font-awesome'
], function (Promise, $, Jupyter, html, Validation, Events, UI, Props) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), input = t('input'), label = t('label');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            parent, container,
            bus = config.bus,
            model,
            ui;

        options.enabled = true;

        /*
         * If the parameter is optional, and is empty, return null.
         * If it allows multiple values, wrap single results in an array
         * There is a weird twist where if it ...
         * well, hmm, the only consumer of this, isValid, expects the values
         * to mirror the input rows, so we shouldn't really filter out any
         * values.
         */

        function getInputValue() {
            var input = ui.getElement('input-container.input'),
                checked = input.checked;
            
            if (checked) {
                return input.value;
            }
            // Bad -- checkboxes do not let us represent a "positive" false
            // state. We should explore a better control.
            return 'false';
        }

        /*
         * 
         * Sets the value in the model and then refreshes the widget.
         * 
         */
        function setModelValue(value) {
            model.setItem('value', value);
        }

        function resetModelValue() {
            setModelValue(spec.defaultValue());
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

        function validate() {
            return Promise.try(function () {
                if (!options.enabled) {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: 'disabled'
                    };
                }

                var rawValue = getInputValue(),
                    // TODO should actually create the set of checkbox values and
                    // make this a validation option, although not specified as 
                    // such in the spec.
                    validationOptions = {
                        required: spec.required()
                    };

                return Validation.validateBoolean(rawValue, validationOptions);
            });
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeInputControl(events, bus) {
            var value = model.getItem('value'),
                isChecked = (value ? true : false);
            
            return label([
                input({
                    type: 'checkbox',
                    dataElement: 'input',
                    value: 'true',
                    checked: isChecked,
                    id: events.addEvents({
                        events: [
                            {
                                type: 'change',
                                handler: function (e) {
                                    validate()
                                        .then(function (result) {
                                            if (result.isValid) {
                                                bus.emit('changed', {
                                                    newValue: result.parsedValue
                                                });
                                                setModelValue(result.parsedValue);
                                            }
                                            bus.emit('validation', {
                                                errorMessage: result.errorMessage,
                                                diagnosis: result.diagnosis
                                            });
                                        });
                                }
                            },
                            {
                                type: 'focus',
                                handler: function (e) {
                                    Jupyter.keyboard_manager.disable();
                                }
                            },
                            {
                                type: 'blur',
                                handler: function (e) {
                                    Jupyter.keyboard_manager.enable();
                                }
                            }
                        ]})
                })]);
        }
        function autoValidate() {
            return validate()
                .then(function (result) {
                    bus.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }
        function render() {
            Promise.try(function () {
                var events = Events.make(),
                    inputControl = makeInputControl(events, bus);
                    
                ui.setContent('input-container', inputControl);
                events.attachEvents(container);
            })
                .then(function () {
                    return autoValidate();
                });
        }

        function layout(events) {
            var content = div({
                dataElement: 'main-panel'
            }, [
                div({dataElement: 'input-container'})
            ]);
            return {
                content: content,
                events: events
            };
        }


        // LIFECYCLE API
        function start() {
            return Promise.try(function () {
                bus.on('run', function (message) {                    
                    parent = message.node;
                    container = message.node.appendChild(document.createElement('div'));

                    var events = Events.make({node: container}),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents();

                    ui = UI.make({node: container});
                    
                    
                    bus.on('reset-to-defaults', function (message) {
                        resetModelValue();
                    });
                    
                    // shorthand for a test of the message type.
                    bus.on('update', function (message) {
                        setModelValue(message.value);
                    });

                    bus.emit('sync');
                });
            });
        }
        
        function stop() {
            // TODO: detach all events.
        }

        model = Props.make({
            data: {
                value: null
            },
            onUpdate: function (props) {
                render();
            }
        });

        return {
            start: start
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});