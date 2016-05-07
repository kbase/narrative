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
            parent,
            container,
            $container,
            bus = config.bus,
            model = [];

        // Validate configuration.
        // Nothing to do...

        options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
        options.multiple = spec.multipleItems();
        options.required = spec.required();
        options.enabled = true;


        function normalizeModel() {
            var newModel = model.filter(function (item) {
                return item ? true : false;
            });
            model = newModel;
        }
        function syncModel(value) {
            model = [];
            config.initialValue.forEach(function (item) {
                model.push(item);
            });
            normalizeModel();
        }

        if (config.initialValue) {
            syncModel(config.initialValue);
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

                var validationOptions = copyProps(spec.spec.text_options, ['min_int', 'max_int']);

                validationOptions.required = spec.required();
                return Validation.validateInteger(rawValue, validationOptions);
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
                                                    model.push(result.parsedValue);
                                                } else {
                                                    index = parseInt(index);
                                                    model[index] = result.parsedValue;
                                                }
                                                normalizeModel();

                                                bus.send({
                                                    type: 'changed',
                                                    newValue: model
                                                });
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
                    type: 'text',
                    class: 'form-control',
                    dataElement: 'input',
                    dataIndex: String(index),
                    value: currentValue
                });
            if (index === 'add') {
                preButton = div({class: 'input-group-addon', style: {width: '10ex'}}, 'Add');
                postButton = div({class: 'input-group-addon'}, button({
                    class: 'btn btn-primary btn-xs',
                    type: 'button',
                    style: {width: '4ex'},
                    id: events.addEvent({type: 'click', handler: function (e) {
                            // alert('add me');
                        }})
                }, '+'));
            } else {
                preButton = div({class: 'input-group-addon', style: {width: '10ex'}}, index + '.');
                postButton = div({class: 'input-group-addon'}, button({
                    class: 'btn btn-danger btn-xs',
                    type: 'button',
                    style: {width: '4ex'},
                    dataIndex: String(index),
                    id: events.addEvent({type: 'click', handler: function (e) {
                            var index = e.target.getAttribute('data-index');
                            var control = container.querySelector('input[data-index="' + index + '"]');
                            control.value = '';
                            control.dispatchEvent(new Event('change'));

                            // alert('delete me ' + control.value);
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
                items = model.map(function (value, index) {
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
            return Promise.all(model.map(function (value, index) {
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
                bus.listen({
                    test: function (message) {
                        return (message.type === 'changed');
                    },
                    handle: function (message) {
                        render();
                    }
                });
            });
        }

        function run(input) {
            return Promise.try(function () {
                if (input.value) {
                    syncModel(input.value);
                }
                return render(input);
            })
                .then(function () {
                    return autoValidate();
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