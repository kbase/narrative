/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'base/js/namespace',
    'kb_common/html',
    'common/validation',
    'common/events',
    'common/dom',
    'common/props',
    '../inputUtils',
    
    'bootstrap',
    'css!font-awesome'
], function (Promise, Jupyter, html, Validation, Events, Dom, Props, inputUtils) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), input = t('input');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            parent,
            container,
            bus = config.bus,
            model,
            dom;

        // Validate configuration.
        // Nothing to do...

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
            return dom.getElement('input-container.input').value;
        }

        function resetModelValue() {
            if (spec.spec.default_values && spec.spec.default_values.length > 0) {
                model.setItem('value', spec.spec.default_values[0]);
            } else {
                model.setItem('value', undefined);
            }
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
                    validationOptions = copyProps(spec.spec.text_options, ['min_float', 'max_float']),
                    validationResult;

                validationOptions.required = spec.required();
                validationResult = Validation.validateFloatString(rawValue, validationOptions);
                
                return validationResult;

//                return {
//                    isValid: validationResult.isValid,
//                    validated: true,
//                    diagnosis: validationResult.diagnosis,
//                    errorMessage: validationResult.errorMessage,
//                    value: validationResult.parsedValue
//                };
            });
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeInputControl(currentValue, events, bus) {
            // CONTROL
            var initialControlValue,
                min = spec.spec.text_options.min_float,
                max = spec.spec.text_options.max_float;
            if (currentValue) {
                initialControlValue = String(currentValue);
            }
            return div({style: {width: '100%'}, dataElement: 'input-wrapper'}, [
                div({class: 'input-group', style: {width: '100%'}}, [
                    (min ? div({class: 'input-group-addon', fontFamily: 'monospace'}, String(min) + ' &#8804; ') : ''),
                    input({
                        id: events.addEvents({
                            events: [
                                {
                                    type: 'change',
                                    handler: function (e) {
                                        validate()
                                            .then(function (result) {
                                                if (result.isValid) {
                                                    model.setItem('value', result.value);
                                                    bus.emit('changed', {
                                                        newValue: result.value
                                                    });
                                                } else if (result.diagnosis === 'required-missing') {
                                                    model.setItem('value', result.value);
                                                    bus.emit('changed', {
                                                        newValue: result.value
                                                    });
                                                } else {
                                                    console.log('INVALID', result, config);
                                                    if (config.showOwnMessages) {
                                                        // show error message -- new!
                                                        var result = inputUtils.buildMessageAlert({
                                                            title: 'ERROR',
                                                            type: 'danger',
                                                            id: result.messageId,
                                                            message: result.errorMessage
                                                        });
                                                        dom.setContent('input-container.message', result.content);
                                                        var messageNode = dom.getElement('input-container.message');
                                                        result.events.attachEvents();                                                        
                                                    }
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
                            ]}),
                        class: 'form-control',
                        dataElement: 'input',
                        dataType: 'float',
                        value: initialControlValue
                    }),
                    (max ? div({class: 'input-group-addon', fontFamily: 'monospace'}, ' &#8804; ' + String(max)) : '')
                ]),
                div({dataElement: 'message', style: {backgroundColor: 'red', color: 'white'}})
            ]);
        }

        function render() {
            Promise.try(function () {
                var events = Events.make(),
                    inputControl = makeInputControl(model.getItem('value'), events, bus);

                dom.setContent('input-container', inputControl);
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

        function autoValidate() {
            return validate()
                .then(function (result) {
                    bus.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        // LIFECYCLE API

        function start() {
            return Promise.try(function () {
                bus.on('run', function (message) {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));                    
                    dom = Dom.make({node: container});

                    var events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents(container);
                    model.setItem('value', message.value);

                    bus.on('reset-to-defaults', function (message) {
                        resetModelValue();
                    });
                    bus.on('update', function (message) {
                        model.setItem('value', message.value);
                    });
                    bus.on('stop', function () {
                        bus.stop();
                    })
                    bus.emit('sync');
                });

            });
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