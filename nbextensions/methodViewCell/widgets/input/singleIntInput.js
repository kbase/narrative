/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'jquery',
    'base/js/namespace',
    'kb_common/html',
    'common/validation',
    'common/events',
    'common/dom',
    'bootstrap',
    'css!font-awesome'
], function (Promise, $, Jupyter, html, Validation, Events, Dom) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), input = t('input'), span = t('span'), button = t('button');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            parent,
            container,
            $container,
            bus = config.bus,
            model = {
                value: undefined
            },
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
                    validationOptions = copyProps(spec.spec.text_options, ['min_int', 'max_int']),
                    validationResult;

                validationOptions.required = spec.required();
                validationResult = Validation.validateIntString(rawValue, validationOptions);

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
            var initialControlValue,
                min = spec.spec.text_options.min_int,
                max = spec.spec.text_options.max_int;
            if (currentValue) {
                initialControlValue = String(currentValue);
            }
            return div({class: 'input-group', style: {width: '100%'}}, [
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
                                                bus.emit('changed', {
                                                    newValue: result.value
                                                });
                                                setModelValue(result.value);
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
            ]);
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

        function start() {
            return Promise.try(function () {
                bus.on('run', function (message) {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    $container = $(container);
                    dom = Dom.make({node: container});

                    var events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents(container);
                    setModelValue(message.value);
                    
                    bus.emit('sync');
                });
                bus.on('reset-to-defaults', function (message) {
                    resetModelValue();
                });
                bus.on('update', function (message) {
                    setModelValue(message.value);
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