/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'jquery',
    'base/js/namespace',
    'kb_common/html',
    '../../validation',
    '../../events',
    'bootstrap',
    'css!font-awesome'
], function (Promise, $, Jupyter, html, Validation, Events) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), input = t('input'), label = t('label');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            container,
            $container,
            bus = config.bus,
            valueChecked = spec.spec.checkbox_options.checked_value,
            valueUnchecked = spec.spec.checkbox_options.unchecked_value,
            model = {
                updates: 0,
                value: undefined
            };

        // Validate configuration.
        // Nothing to do...

        options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
        options.multiple = spec.multipleItems();
        options.required = spec.required();
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
            var checkbox = container.querySelector('[data-element="input-container"] [data-element="input"]');
            if (checkbox.checked) {
                return valueChecked;
            }
            return valueUnchecked;
        }

        /*
         * 
         * Sets the value in the model and then refreshes the widget.
         * 
         */
        function setModelValue(value) {
            return Promise.try(function () {
                if (model.value !== value) {
                    model.value = value;
                    return true;
                }
                return false;
            })
                .then(function (changed) {
                    render();
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

        function meansChecked(value) {
            if (!value) {
                return false;
            }
            switch (value.trim()) {
                case '1':
                case 'true':
                    return true;
                case '0':
                case 'false':
                case '':
                    return false;
            }
        }

        function resetModelValue() {
            if (spec.spec.default_values && spec.spec.default_values.length > 0) {
                if (meansChecked(spec.spec.default_values[0])) {
                    setModelValue(valueChecked);
                } else {
                    setModelValue(valueUnchecked);
                }
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
                    // TODO should actually create the set of checkbox values and
                    // make this a validation option, although not specified as 
                    // such in the spec.
                    validationOptions = {
                        required: spec.required(),
                        values: [valueChecked, valueUnchecked]
                    },
                validationResult;

                validationResult = Validation.validateSet(rawValue, validationOptions);

                return {
                    isValid: validationResult.isValid,
                    validated: true,
                    diagnosis: validationResult.diagnosis,
                    errorMessage: validationResult.errorMessage,
                    value: validationResult.parsedValue
                };
            });
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeInputControl(currentValue, events, bus) {
            // CONTROL
            var checked = false,
                booleanString = 'no';
            if (model.value === valueChecked) {
                checked = true;
                booleanString = 'yes';
            }
            return label({class: 'checkbox-inline'}, [
                input({
                    id: events.addEvents({
                        events: [
                            {
                                type: 'change',
                                handler: function (e) {
                                    validate()
                                        .then(function (result) {
                                            if (result.isValid) {
                                                bus.send({
                                                    type: 'changed',
                                                    newValue: result.value
                                                });
                                                setModelValue(result.value);
                                            }
                                            bus.send({
                                                type: 'validation',
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
                    type: 'checkbox',
                    dataElement: 'input',
                    checked: checked,
                    value: valueChecked
                })]);
        }
        function autoValidate() {
            return validate()
                .then(function (result) {
                    bus.send({
                        type: 'validation',
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }
        function render() {
            Promise.try(function () {
                var events = Events.make(),
                    inputControl = makeInputControl(model.value, events, bus);

                $container.find('[data-element="input-container"]').html(inputControl);
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

        function init() {
        }

        function attach(node) {
            return Promise.try(function () {
                parent = node;
                container = node.appendChild(document.createElement('div'));
                $container = $(container);

                var events = Events.make(),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents(container);
            });
        }

        function start() {
            return Promise.try(function () {
                bus.listen({
                    test: function (message) {
                        return (message.type === 'reset-to-defaults');
                    },
                    handle: function () {
                        resetModelValue();
                    }
                });

                // shorthand for a test of the message type.
                bus.on('update', function (message) {
                    setModelValue(message.value);
                });

                bus.emit('sync');
                return null;
                // return resetModelValue();
            });
        }

        function run(params) {
            return Promise.try(function () {
                return setModelValue(params.value);
            });
            //.then(function () {
            //    return autoValidate();
            //});
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