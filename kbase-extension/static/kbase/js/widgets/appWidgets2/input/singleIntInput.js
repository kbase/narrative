/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    '../validation',
    'common/events',
    'common/ui',
    'common/props',
    '../inputUtils',

    'bootstrap',
    'css!font-awesome'
], function (
    Promise,
    html,
    Validation,
    Events,
    UI,
    Props,
    inputUtils) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        var enabled,
            spec = config.parameterSpec,
            parent,
            container,
            bus = config.bus,
            model,
            ui;

        // Validate configuration.
        // Nothing to do...

        enabled = config.enabled || true;

        function doEnable() {
            if (enabled === false) {
                // do something.
                enabled = true;
                var control = ui.getElement('input-container.input');
                if (control) {
                    control.disabled = false;
                    control.readonly = false;
                }
            }
        }

        function doDisable() {
            if (enabled === true) {
                // do something
                enabled = false;
                var control = ui.getElement('input-container.input');
                if (control) {
                    control.disabled = true;
                    control.readonly = true;
                }
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
            return ui.getElement('input-container.input').value;
        }

        function resetModelValue() {
            if (spec.defaultValue) {
                model.setItem('value', spec.defaultValue);
            } else {
                model.setItem('value', undefined);
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
                // if (!enabled) {
                //     return {
                //         isValid: true,
                //         validated: false,
                //         diagnosis: 'disabled'
                //     };
                // }

                return Validation.validateIntString(getInputValue(), spec.data.constraints);
            });
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */

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
                                model.setItem('value', result.parsedValue);
                                bus.emit('changed', {
                                    newValue: result.parsedValue
                                });
                            } else if (result.diagnosis === 'required-missing') {
                                model.setItem('value', result.parsedValue);
                                bus.emit('changed', {
                                    newValue: result.parsedValue
                                });
                            } else {
                                if (config.showOwnMessages) {
                                    // show error message -- new!
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

        function makeInputControl(currentValue, events) {
            // CONTROL
            var initialControlValue,
                min = spec.data.constraints.min,
                max = spec.data.constraints.max;
            if (currentValue) {
                initialControlValue = String(currentValue);
            }
            return div({ style: { width: '100%' }, dataElement: 'input-wrapper' }, [
                div({ class: 'input-group', style: { width: '100%' } }, [
                    (typeof min === 'number' ? div({ class: 'input-group-addon', fontFamily: 'monospace' }, String(min) + ' &#8804; ') : ''),
                    input({
                        id: events.addEvents({
                            events: [handleChanged(), handleTouched()]
                        }),
                        class: 'form-control',
                        dataElement: 'input',
                        dataType: 'int',
                        value: initialControlValue
                    }),
                    (typeof max === 'number' ? div({ class: 'input-group-addon', fontFamily: 'monospace' }, ' &#8804; ' + String(max)) : '')
                ]),
                div({ dataElement: 'message', style: { backgroundColor: 'red', color: 'white' } })
            ]);
        }

        function render() {
            Promise.try(function () {
                    var events = Events.make(),
                        inputControl = makeInputControl(model.getItem('value'), events, bus);

                    ui.setContent('input-container', inputControl);
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
                div({ dataElement: 'input-container' })
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
                    ui = UI.make({ node: container });

                    var events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents(container);
                    model.setItem('value', message.value);

                    bus.on('reset-to-defaults', function () {
                        resetModelValue();
                    });
                    bus.on('update', function (message) {
                        model.setItem('value', message.value);
                    });
                    bus.on('stop', function () {
                        bus.stop();
                    });
                    bus.on('enable', function () {
                        doEnable();
                    });
                    bus.on('disable', function () {
                        doDisable();
                    });

                    bus.emit('sync');
                });

            });
        }

        model = Props.make({
            data: {
                value: null
            },
            onUpdate: function (props) {
                render();
            }
        });

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