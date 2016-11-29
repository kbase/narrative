/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    '../validation',
    'common/events',
    'common/ui',
    '../inputUtils',

    'bootstrap',
    'css!font-awesome'
], function(
    Promise,
    html,
    Validation,
    Events,
    UI,
    inputUtils) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            parent,
            ui,
            container,
            bus = config.bus,
            model = {
                availableValues: null,
                value: null
            };

        // Validate configuration.
        // Nothing to do...

        options.enabled = true;

        model.availableValues = spec.data.constraints.options;

        model.availableValuesMap = {};
        model.availableValues.forEach(function(item, index) {
            item.index = index;
            model.availableValuesMap[item.value] = item;
        });


        /*
         * If the parameter is optional, and is empty, return null.
         * If it allows multiple values, wrap single results in an array
         * There is a weird twist where if it ...
         * well, hmm, the only consumer of this, isValid, expects the values
         * to mirror the input rows, so we shouldn't really filter out any
         * values.
         */

        function getInputValue() {
            var control = ui.getElement('input-container.input'),
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
            return Promise.try(function() {
                if (!options.enabled) {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: 'disabled'
                    };
                }

                var rawValue = getInputValue(),
                    validationResult = Validation.validateTextString(rawValue, spec.data.constraints);

                return validationResult;
            });
        }

        function handleChanged() {
            return {
                type: 'change',
                handler: function() {
                    validate()
                        .then(function(result) {
                            if (result.isValid) {
                                bus.emit('changed', {
                                    newValue: result.value
                                });
                            } else if (result.diagnosis === 'required-missing') {
                                // If a field is "made empty", causing a required-missing state,
                                // we still want to store and propagate the changes.
                                setModelValue(result.parsedValue);
                                bus.emit('changed', {
                                    newValue: result.parsedValue
                                });
                            } else {
                                if (config.showOwnMessages) {
                                    var message = inputUtils.buildMessageAlert({
                                        title: 'ERROR',
                                        type: 'danger',
                                        id: result.messageId,
                                        message: result.errorMessage
                                    });
                                    ui.setContent('input-container.message', message.content);
                                    message.events.attachEvents();
                                }
                            }
                            bus.emit('validation', {
                                errorMessage: result.errorMessage,
                                diagnosis: result.diagnosis
                            });
                        });
                }
            }
        }

        function makeInputControl(events) {
            var selected,
                selectOptions = model.availableValues.map(function(item) {
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
                id: events.addEvents({ events: [handleChanged()] }),
                class: 'form-control',
                dataElement: 'input'
            }, [option({ value: '' }, '')].concat(selectOptions));
        }

        // function render(input) {
        //     Promise.try(function () {
        //         var events = Events.make(),
        //             inputControl = makeInputControl(events);

        //         dom.setContent('input-container', inputControl);
        //         events.attachEvents(container);
        //     })
        //         .then(function () {
        //             autoValidate();
        //         });
        // }

        function updateDisplay() {
            // assuming the model has been modified...
            var control = ui.getElement('input-control.input');
            // loop through the options, selecting the one with the value.
            // unselect
            if (control.selectedIndex >= 0) {
                control.options.item(control.selectedIndex).selected = false;
            }
            var selectedItem = model.availableValuesMap[model.value];
            if (selectedItem) {
                control.options.item(selectedItem.index + 1).selected = true;
            }
        }

        function layout(events) {
            var content = div({
                dataElement: 'main-panel'
            }, [
                div({ dataElement: 'input-container' },
                    makeInputControl(events)
                )
            ]);
            return {
                content: content,
                events: events
            };
        }

        function autoValidate() {
            validate()
                .then(function(result) {
                    bus.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        function setModelValue(value) {
            return Promise.try(function() {
                    if (model.value !== value) {
                        model.value = value;
                        return true;
                    }
                    return false;
                })
                .then(function(changed) {
                    updateDisplay();
                    autoValidate();
                });
        }

        function unsetModelValue() {
            return Promise.try(function() {
                    model.value = undefined;
                })
                .then(function(changed) {
                    updateDisplay();
                    autoValidate();
                });
        }

        function resetModelValue() {
            if (spec.data.defaultValue) {
                setModelValue(spec.data.defaultValue);
            } else {
                unsetModelValue();
            }
        }


        // LIFECYCLE API

        function start() {
            return Promise.try(function() {
                bus.on('run', function(message) {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    ui = UI.make({ node: container });

                    var events = Events.make({ node: container }),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents();

                    bus.on('reset-to-defaults', function() {
                        resetModelValue();
                    });
                    bus.on('update', function(message) {
                        setModelValue(message.value);
                    });
                    bus.emit('sync');
                });
            });
        }

        function stop() {
            return Promise.try(function() {
                // nothing to do. 
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
            start: start,
            stop: stop
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});