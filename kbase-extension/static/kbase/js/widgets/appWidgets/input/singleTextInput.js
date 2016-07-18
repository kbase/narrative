/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'base/js/namespace',
    'kb_common/html',
    'common/validation',
    'common/events',
    'common/dom',
    '../inputUtils',

    'bootstrap',
    'css!font-awesome'
], function (
    Promise,
    Jupyter,
    html,
    Validation,
    Events,
    Dom,
    inputUtils
    ) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), input = t('input'), span = t('span'), button = t('button');

    function factory(config) {
        var options = {},
            constraints,
            parent,
            container,
            bus = config.bus,
            dom,
            model = {
                value: undefined
            };

        if (config.parameterSpec) {
            constraints = config.parameterSpec.getConstraints();
        } else {
            constraints = config.constraints;
        }

        // 
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
                if (!options.enabled) {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: 'disabled'
                    };
                }

                var rawValue = getInputValue(),
                    validationResult = Validation.validateTextString(rawValue, {
                        required: constraints.required
                    });

                return validationResult;
            });
        }

        var editPauseTimer;
        function changeOnPause() {
            var editPauseTime = 0,
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

            return input({
                id: events.addEvents({
                    events: [
                        {
                            type: 'change',
                            handler: function (e) {
                                if (editPauseTimer) {
                                    window.clearTimeout(editPauseTimer);
                                    editPauseTimer = null;
                                }
                                validate()
                                    .then(function (result) {
                                        if (result.isValid) {
                                            setModelValue(result.parsedValue);
                                            bus.emit('changed', {
                                                newValue: result.parsedValue
                                            });
                                        } else if (result.diagnosis === 'required-missing') {
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
                                                dom.setContent('input-container.message', message.content);
                                                message.events.attachEvents();
                                            }
                                        }

                                        bus.emit('validation', {
                                            errorMessage: result.errorMessage,
                                            diagnosis: result.diagnosis
                                        });
                                    });
                            }
                        },
                        // changeOnPause(),
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
                value: currentValue
            });
        }

        function render() {
            Promise.try(function () {
                var events = Events.make(),
                    inputControl = makeInputControl(model.value, events, bus);

                dom.setContent('input-container', inputControl);
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
                    dom = Dom.make({node: message.node});

                    var events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents(container);

                    bus.on('reset-to-defaults', function (message) {
                        resetModelValue();
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