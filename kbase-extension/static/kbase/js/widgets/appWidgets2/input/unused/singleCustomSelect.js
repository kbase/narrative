/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    '../validation',
    'common/events',
    'common/dom',
    'bootstrap',
    'css!font-awesome'
], function (Promise, html, Validation, Events, Dom) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), select = t('select'), option = t('option');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            parent,
            dom,
            container,
            bus = config.bus,
            model = {
                availableValues: null,
                value: null
            };

        // Validate configuration.
        // Nothing to do...

        options.enabled = true;

        model.availableValues = spec.spec.dropdown_options.options;


        /*
         * If the parameter is optional, and is empty, return null.
         * If it allows multiple values, wrap single results in an array
         * There is a weird twist where if it ...
         * well, hmm, the only consumer of this, isValid, expects the values
         * to mirror the input rows, so we shouldn't really filter out any
         * values.
         */

        function getInputValue() {
            var control = dom.getElement('input-container.input'),
                selected = control.selectedOptions;
            
            if (selected.length === 0) {
                return;
            }
            
            // we are modeling a single string value, so we always just get the 
            // first selected element, which is all there should be!
            return selected.item(0).value;
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
                    
                return validationResult;
            });
        }

        function makeInputControl(events) {
            var selected,
                selectOptions = model.availableValues.map(function (item) {
                    selected = false;
                    if (item.value === model.value) {
                        selected = true;
                    }

                    return option({
                        value: item.value,
                        selected: selected
                    }, item.display);
                });

            // CONTROL
            return select({
                id: events.addEvent({type: 'change', handler: function () {
                        validate()
                            .then(function (result) {
                                if (result.isValid) {
                                    bus.emit('changed', {
                                        newValue: result.value
                                    });
                                }
                                bus.emit('validation', {
                                    errorMessage: result.errorMessage,
                                    diagnosis: result.diagnosis
                                });
                            });
                    }}),
                class: 'form-control',
                dataElement: 'input'
            }, [option({value: ''}, '')].concat(selectOptions));
        }

        function render(input) {
            Promise.try(function () {
                var events = Events.make(),
                    inputControl = makeInputControl(events);
                    
                dom.setContent('input-container', inputControl);
                events.attachEvents(container);
            })
                .then(function () {
                    autoValidate();
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
            validate()
                .then(function (result) {
                    bus.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
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

                    bus.on('reset-to-defaults', function () {
                        resetModelValue();
                    });
                    bus.on('update', function (message) {
                        setModelValue(message.value);
                    });
                    bus.emit('sync');
                });
            });
        }

//        function run(input) {
//            return Promise.try(function () {
//                return render(input);
//            })
//            .then(function () {
//                return autoValidate();
//            });
//        }

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