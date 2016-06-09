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
        div = t('div'), input = t('input'), span = t('span'), button = t('button'),
        textarea = t('textarea');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            parent,
            container,
            $container,
            bus = config.bus,
            model = {
                value: undefined
            };
            
        console.log('TEXTAREA', spec);

        // Validate configuration.
        // Nothing to do...

        options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
        options.multiple = spec.multipleItems();
        options.required = spec.required();
        options.enabled = true;
        options.nRows = spec.spec.textarea_options.n_rows;


        /*
         * If the parameter is optional, and is empty, return null.
         * If it allows multiple values, wrap single results in an array
         * There is a weird twist where if it ...
         * well, hmm, the only consumer of this, isValid, expects the values
         * to mirror the input rows, so we shouldn't really filter out any
         * values.
         */

        function getInputValue() {
            return $container.find('[data-element="input-container"] [data-element="input"]').val();
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
                    validationResult = Validation.validateTextString(rawValue, {
                        required: options.required
                    });

                return {
                    isValid: validationResult.isValid,
                    validated: true,
                    diagnosis: validationResult.diagnosis,
                    errorMessage: validationResult.errorMessage,
                    value: validationResult.parsedValue
                };
            });
        }

        function changeOnPause() {
            var editPauseTime = 0,
                editPauseTimer,
                editPauseInterval = 2000;

            return {
                type: 'keyup',
                handler: function (e) {
                    editPauseTime = new Date().getTime();
                    if (editPauseTimer) {
                        window.clearTimeout(editPauseTimer);
                    }
                    editPauseTimer = window.setTimeout(function () {
                        var now = new Date().getTime();
                        if ((now - editPauseTime) > editPauseInterval) {
                            editPauseTimer = null;
                            e.target.dispatchEvent(new Event('change'));
                        }
                    }, 2500);
                }
            };
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeInputControl(currentValue, events, bus) {
            // CONTROL

            return textarea({
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
                                        } else if (result.diagnosis === 'required-missing') {
                                            bus.send({
                                                type: 'changed',
                                                newValue: result.value
                                            });
                                        }
                                        setModelValue(result.value);
                                        bus.send({
                                            type: 'validation',
                                            errorMessage: result.errorMessage,
                                            diagnosis: result.diagnosis
                                        });
                                    });
                            }
                        }, changeOnPause(),
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
                rows: options.nRows || 5
            }, currentValue);
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
                bus.on('reset-to-defaults', function (message) {
                    resetModelValue();
                });
                bus.on('update', function (message) {
                    setModelValue(message.value);
                });
                bus.emit('sync');
                return null;
            });
        }

        function run(params) {
            return Promise.try(function () {
                return setModelValue(params.value);
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