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
        div = t('div'), input = t('input'), button = t('button');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            container,
            $container,
            bus = config.bus,
            model = {
                value: []
            };

        // Validate configuration.
        // Nothing to do...

        options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
        options.multiple = spec.multipleItems();
        options.required = spec.required();
        options.enabled = true;


        function normalizeModel() {
            var newModel = model.value.filter(function (item) {
                return item ? true : false;
            });
            model.value = newModel;
        }

        function setModelValue(value, index) {
            return Promise.try(function () {
                if (index !== undefined) {
                    if (value) {
                        model.value[index] = value;
                    } else {
                        delete model.value[index];
                    }
                } else {
                    if (value) {
                        model.value = value.map(function (item) {
                            return item;
                        });
                    } else {
                        unsetModelValue();
                    }
                }
                normalizeModel();
            })
                .then(function () {
                    render();
                });
        }

        function addModelValue(value) {
            return Promise.try(function () {
                model.value.push(value);
            })
                .then(function () {
                    render();
                });

        }

        function unsetModelValue() {
            return Promise.try(function () {
                model.value = [];
            })
                .then(function (changed) {
                    render();
                });
        }

        function resetModelValue() {
            if (spec.spec.default_values && spec.spec.default_values.length > 0) {
                setModelValue(spec.spec.default_values);
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
            return $container.find('[data-element="input-container"] [data-element="input"]').val();
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
                if (!options.enabled) {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: 'disabled'
                    };
                }

                var validationOptions = copyProps(spec.spec.text_options, ['regexp_constraint', 'min_length', 'max_length']);

                validationOptions.required = spec.required();
                return Validation.validateText(rawValue, validationOptions);
            });
        }

        function updateValue() {

        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeInputControl(currentValue, index, events, bus) {
            // CONTROL
            var preButton, postButton,
                control = input({
                    id: events.addEvents({
                        events: [
                            {
                                type: 'change',
                                handler: function (e) {
                                    var control = e.target,
                                        value = control.value,
                                        index = control.getAttribute('data-index');
                                    validate(value)
                                        .then(function (result) {
                                            if (result.isValid) {
                                                if (index === 'add') {
                                                    addModelValue(result.parsedValue);
                                                } else {
                                                    index = parseInt(index, 10);
                                                    setModelValue(result.parsedValue, index);
                                                }
                                                normalizeModel();

                                                bus.send({
                                                    type: 'changed',
                                                    newValue: model.value
                                                });
                                            }
                                            bus.send({
                                                type: 'validation',
                                                errorMessage: result.errorMessage,
                                                diagnosis: result.diagnosis
                                            });
                                            return null;
                                        })
                                        .catch(function (err) {
                                            console.error(err);
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
                    type: 'text',
                    class: 'form-control',
                    dataElement: 'input',
                    dataIndex: String(index),
                    value: currentValue
                });
            if (index === 'add') {
                preButton = div({class: 'input-group-addon', style: {width: '5ex', padding: '0'}}, '');
                postButton = div({class: 'input-group-addon', style: {padding: '0'}}, button({
                    class: 'btn btn-primary btn-link btn-xs',
                    type: 'button',
                    style: {width: '4ex'},
                    id: events.addEvent({type: 'click', handler: function (e) {
                            // alert('add me');
                        }})
                }, '+'));
            } else {
                preButton = div({class: 'input-group-addon', style: {width: '5ex', padding: '0'}}, String(index + 1) + '.');
                postButton = div({class: 'input-group-addon', style: {padding: '0'}}, button({
                    class: 'btn btn-danger btn-link btn-xs',
                    type: 'button',
                    style: {width: '4ex'},
                    dataIndex: String(index),
                    id: events.addEvent({type: 'click', handler: function (e) {
                            var index = e.target.getAttribute('data-index'),
                                control = container.querySelector('input[data-index="' + index + '"]');
                            control.value = '';
                            control.dispatchEvent(new Event('change'));
                        }})
                }, 'x'));
            }
            return div({class: 'input-group'}, [
                preButton,
                control,
                postButton
            ]);
        }

        function render(input) {
            var events = Events.make(),
                items = model.value.map(function (value, index) {
                    return makeInputControl(value, index, events, bus);
                });

            items = items.concat(makeInputControl('', 'add', events, bus));

            var content = items.join('\n');

            $container.find('[data-element="input-container"]').html(content);
            events.attachEvents(container);
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
            return Promise.all(model.value.map(function (value, index) {
                // could get from DOM, but the model is the same.
                var rawValue = container.querySelector('[data-index="' + index + '"]').value;
                // console.log('VALIDATE', value);
                return validate(rawValue);
            }))
                .then(function (results) {
                    // a bit of a hack -- we need to handle the 
                    // validation here, and update the individual rows
                    // for now -- just create one mega message.
                    var errorMessages = [],
                        validation;
                    results.forEach(function (result, index) {
                        if (result.errorMessage) {
                            errorMessages.push(result.errorMessage + ' in item ' + index);
                        }
                    });
                    if (errorMessages.length) {
                        validation = {
                            type: 'validation',
                            diagnosis: 'invalid',
                            errorMessage: errorMessages.join('<br/>')
                        };
                    } else {
                        validation = {
                            type: 'validation',
                            diagnosis: 'valid'
                        };
                    }
                    bus.send(validation);
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
                bus.on('refresh', function () {

                });
                bus.send({type: 'sync'});
            });
        }

        function run(params) {
            return Promise.try(function () {
                // nothing to do now... we are ... reactive.
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