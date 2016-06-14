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
        div = t('div'), input = t('input'), button = t('button');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            parent,
            container,
            bus = config.bus,
            dom,
            model = [];

        // Validate configuration.
        // Nothing to do...

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
                        model.value.splice(index, 1);
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
                })
                    .catch(function (err) {
                        console.error('Error setting model value', err);
                });
        }


        function normalizeModel() {
            var newModel = model.filter(function (item) {
                return item ? true : false;
            });
            model = newModel;
        }
        function syncModel(value) {
            model = [];
            value.forEach(function (item) {
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
                return Validation.validateIntString(rawValue, validationOptions);
            });
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

                                                bus.emit('changed', {
                                                    newValue: model
                                                });
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
                                handler: function () {
                                    Jupyter.keyboard_manager.disable();
                                }
                            },
                            {
                                type: 'blur',
                                handler: function () {
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
                    id: events.addEvent({type: 'click', handler: function () {
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

            dom.setContent('input-container', content);
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
                return validate(rawValue);
            }))
                .then(function (results) {
                    // a bit of a hack -- we need to handle the 
                    // validation here, and update the individual rows
                    // for now -- just create one mega message.
                    var errorMessages = [],
                        message;
                    results.forEach(function (result, index) {
                        if (result.errorMessage) {
                            errorMessages.push(result.errorMessage + ' in item ' + index);
                        }
                    });
                    if (errorMessages.length) {
                        message = {
                            diagnosis: 'invalid',
                            errorMessage: errorMessages.join('<br/>')
                        };
                    } else {
                        message = {
                            diagnosis: 'valid'
                        };
                    }
                    bus.emit('validation', message);
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
                    
                    bus.on('changed', function (message) {
                        render();
                    });
                    
                    bus.on('update', function (message) {
                        setModelValue(message.value);
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