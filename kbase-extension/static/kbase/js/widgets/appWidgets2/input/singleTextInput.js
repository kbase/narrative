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
], function (
    Promise,
    html,
    Validation,
    Events,
    UI,
    inputUtils
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        var constraints = config.parameterSpec.data.constraints,
            parent,
            container,
            bus = config.bus,
            ui,
            model = {
                value: undefined
            };

        // CONTROL

        function getControlValue() {
            return ui.getElement('input-container.input').value;
        }

        function setControlValue(newValue) {
            ui.getElement('input-container.input').value = newValue;
        }

        // MODEL

        function setModelValue(value) {
            if (model.value === value) {
                return;
            }
            model.value = value;
            setControlValue(value);
            autoValidate();
        }

        function unsetModelValue() {
            model.value = undefined;
            setControlValue(model.value);
            autoValidate();
        }

        function resetModelValue() {
            if (constraints.defaultValue) {
                setModelValue(constraints.defaultValue);
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
                var rawValue = getControlValue(),
                    validationResult = Validation.validateTextString(rawValue, constraints);

                return validationResult;
            });
        }

        // DOM

        var autoChangeTimer;

        function cancelTouched() {
            if (autoChangeTimer) {
                window.clearTimeout(autoChangeTimer);
                autoChangeTimer = null;
            }
        }

        function handleTouched(interval) {
            var editPauseInterval = interval || 2000;
            return {
                type: 'keyup',
                handler: function (e) {
                    bus.emit('touched');
                    cancelTouched();
                    autoChangeTimer = window.setTimeout(function () {
                        autoChangeTimer = null;
                        e.target.dispatchEvent(new Event('change'));
                    }, editPauseInterval);
                }
            };
        }

        function handleChanged() {
            return {
                type: 'change',
                handler: function (e) {
                    cancelTouched();
                    validate()
                        .then(function (result) {
                            if (result.isValid) {
                                setModelValue(result.parsedValue);
                                bus.emit('changed', {
                                    newValue: result.parsedValue
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
            };
        }

        function makeInputControl(events) {
            return input({
                id: events.addEvents({
                    events: [handleTouched(), handleChanged()]
                }),
                class: 'form-control',
                dataElement: 'input'
            });
        }

        function render(events) {
            var content = div({
                dataElement: 'main-panel'
            }, [
                div({ dataElement: 'input-container' }, [
                    makeInputControl(events)
                ])
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
                    ui = UI.make({ node: message.node });

                    var events = Events.make(),
                        theLayout = render(events);

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

        function stop() {
            return Promise.try(function () {
                // nothing to do. 
            });
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});