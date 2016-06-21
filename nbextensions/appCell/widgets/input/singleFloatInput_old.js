/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'base/js/namespace',
    'kb_common/html',
    'common/validation',
    'common/events',
    'common/dom',
    'bootstrap',
    'css!font-awesome'
], function (Promise, Jupyter, html, Validation, Events, Dom) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), input = t('input'), span = t('span'), button = t('button');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            // constraints = config.parameterSpec.getConstraints(),
            parent,
            container,
            bus = config.bus,
            dom,
            model = {
                value: undefined
            };

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

        function setModelValue(value) {
            return Promise.try(function () {
                if (model.value !== value) {
                    model.value = value;
                    return true;
                }
                return false;
            })
                .then(function (changed) {
                    return render();
                });
        }

        function unsetModelValue() {
            return Promise.try(function () {
                model.value = undefined;
            })
                .then(function (changed) {
                    render();
                });
        }

        function resetModelValue() {
            if (spec.spec.default_values && spec.spec.default_values.length > 0) {
                setModelValue(spec.spec.default_values[0]);
            } else {
                unsetModelValue();
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

                return {
                    isValid: validationResult.isValid,
                    validated: true,
                    diagnosis: validationResult.diagnosis,
                    errorMessage: validationResult.errorMessage,
                    value: validationResult.parsedValue
                };
            });
        }
        
        function makeInputControl(currentValue, events, bus) {
            // CONTROL
            var initialControlValue,
                min = spec.spec.text_options.min_int,
                max = spec.spec.text_options.max_int;
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
                                                    // show error message -- new!
                                                    dom.setContent('input-container.message', result.errorMessage);
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
                        dataType: 'int',
                        value: initialControlValue
                    }),
                    (max ? div({class: 'input-group-addon', fontFamily: 'monospace'}, ' &#8804; ' + String(max)) : '')
                ]),
                div({dataElement: 'message', style: {backgroundColor: 'red', color: 'white'}})
            ]);
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeInputControl(currentValue, events, bus) {
            // CONTROL
            var initialControlValue;
            if (currentValue) {
                initialControlValue = String(currentValue);
            }
            return input({
                id: events.addEvents({
                    events: [
                        {
                            type: 'change',
                            handler: function (e) {
                                validate()
                                    .then(function (result) {
                                        if (result.isValid) {
                                            // model.setItem('value', result.value);
                                            setModelValue(result.value);
                                            bus.emit('changed', {
                                                newValue: result.value
                                            });
                                        } else if (result.diagnosis === 'required-missing') {
                                            // model.setItem('value', result.value);
                                            setModelValue(result.value);

                                            bus.emit('changed', {
                                                newValue: result.value
                                            });
                                        } else {
                                            // show error message -- new!
                                            dom.setContent('input-container.message', result.errorMessage);
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
                value: initialControlValue
            });
        }

        function render() {
            Promise.try(function () {
                var events = Events.make(),
                    inputControl = makeInputControl(model.value, events, bus);

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
                    bus.send('validation', {
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

                    // TODO: this should default here, no?
                    setModelValue(message.value);

                    bus.on('reset-to-defaults', function (message) {
                        resetModelValue();
                    });
                    bus.on('update', function (message) {
                        ß                        setModelValue(message.value);
                    });
                    bus.emit('sync');

                });
            });
        }

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