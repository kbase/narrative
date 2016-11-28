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
    inputUtils) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        textarea = t('textarea');

    function factory(config) {
        var spec = config.parameterSpec,
            container,
            bus = config.bus,
            model = {
                value: undefined
            },
            ui,
            constraints = config.parameterSpec.data.constraints,
            options = {
                enabled: true,
                rowCount: spec.ui.nRows || 5
            };

        // CONTROL

        function getControlValue() {
            return ui.getElement('input-container.input').value;
        }

        function setControlValue(newValue) {
            ui.getElement('input-container.input').value = newValue;
        }

        // MODEL

        // NB this is a trusted method. The value had better be valid,
        // since it won't (can't) be validated. Validation is an event 
        // which sits between the control and the model.
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
            if (spec.data.defaultValue) {
                setModelValue(spec.data.defaultValue);
            } else {
                unsetModelValue();
            }
        }

        function validate() {
            return Promise.try(function () {
                var rawValue = getControlValue(),
                    validationResult = Validation.validateTextString(rawValue, constraints);

                return validationResult;
            });
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
                handler: function () {
                    cancelTouched();
                    validate()
                        .then(function (result) {
                            if (result.isValid) {
                                setModelValue(result.value);
                                bus.emit('changed', {
                                    newValue: result.value
                                });
                            } else if (result.diagnosis === 'required-missing') {
                                setModelValue(result.value);
                                bus.emit('changed', {
                                    newValue: result.value
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

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeInputControl(events) {
            return textarea({
                id: events.addEvents({
                    events: [handleChanged(), handleTouched()]
                }),
                class: 'form-control',
                dataElement: 'input',
                rows: options.rowCount
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

        // LIFECYCLE API
        function start() {
            return Promise.try(function () {
                bus.on('run', function (message) {
                    // parent = message.node;
                    container = message.node.appendChild(document.createElement('div'));
                    ui = UI.make({ node: container });

                    var events = Events.make(),
                        theLayout = render(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents(container);
                    setModelValue(message.value);

                    bus.on('reset-to-defaults', function (message) {
                        resetModelValue();
                    });
                    bus.on('update', function (message) {
                        setModelValue(message.value);
                    });
                    bus.on('stop', function () {
                        bus.stop();
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