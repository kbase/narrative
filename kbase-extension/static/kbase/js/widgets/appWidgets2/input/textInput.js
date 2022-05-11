define([
    'bluebird',
    'common/html',
    'widgets/appWidgets2/validation',
    'common/events',
    'common/ui',
    'common/props',
    'common/runtime',
    '../inputUtils',
    'widgets/appWidgets2/validators/constants',
    'bootstrap',
], (Promise, html, Validation, Events, UI, Props, Runtime, inputUtils, Constants) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        input = t('input'),
        model = Props.make({
            data: {
                value: null,
            },
            onUpdate: function () {
                //syncModelToControl();
                //autoValidate();
            },
        });

    function factory(config) {
        const spec = config.parameterSpec,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName);
        let parent, container, ui;

        // CONTROL

        function getControlValue() {
            return ui.getElement('input-container.input').value;
        }

        function setControlValue(newValue) {
            ui.getElement('input-container.input').value = newValue;
        }

        // MODEL

        function setModelValue(value) {
            if (value === undefined) {
                return;
            }
            if (model.getItem('value') === value) {
                return;
            }
            model.setItem('value', value);
        }

        function resetModelValue() {
            setModelValue(spec.data.defaultValue);
        }

        // sync the dom to the model.
        function syncModelToControl() {
            setControlValue(model.getItem('value', null));
        }

        // VALIDATION

        function importControlValue() {
            return Promise.try(() => {
                return Validation.importTextString(getControlValue());
            });
        }

        function validate(value) {
            return Promise.try(() => {
                return Validation.validateTextString(value, spec.data.constraints);
            });
        }

        function autoValidate() {
            return validate(model.getItem('value')).then((result) => {
                channel.emit('validation', result);
            });
        }

        // DOM & RENDERING

        let autoChangeTimer;

        function cancelTouched() {
            if (autoChangeTimer) {
                window.clearTimeout(autoChangeTimer);
                autoChangeTimer = null;
            }
        }

        function handleTouched(interval) {
            const editPauseInterval = interval || 100;
            return {
                type: 'keyup',
                handler: function (e) {
                    channel.emit('touched');
                    cancelTouched();
                    autoChangeTimer = window.setTimeout(() => {
                        autoChangeTimer = null;
                        if (e.target) {
                            e.target.dispatchEvent(new Event('change'));
                        }
                    }, editPauseInterval);
                },
            };
        }

        function handleChanged() {
            return {
                type: 'change',
                handler: function () {
                    cancelTouched();
                    importControlValue()
                        .then((value) => {
                            model.setItem('value', value);
                            channel.emit('changed', {
                                newValue: value,
                            });
                            return validate(value);
                        })
                        .then((result) => {
                            if (result.isValid) {
                                if (config.showOwnMessages) {
                                    ui.setContent('input-container.message', '');
                                }
                            } else if (result.diagnosis === Constants.DIAGNOSIS.REQUIRED_MISSING) {
                                // nothing??
                            } else {
                                if (config.showOwnMessages) {
                                    // show error message -- new!
                                    const message = inputUtils.buildMessageAlert({
                                        title: 'ERROR',
                                        type: 'danger',
                                        id: result.messageId,
                                        message: result.errorMessage,
                                    });
                                    ui.setContent('input-container.message', message.content);
                                    message.events.attachEvents();
                                }
                            }
                            channel.emit('validation', result);
                        })
                        .catch((err) => {
                            channel.emit('validation', {
                                isValid: false,
                                diagnosis: Constants.DIAGNOSIS.INVALID,
                                errorMessage: err.message,
                            });
                        });
                },
            };
        }

        function makeInputControl(events) {
            return input({
                id: events.addEvents({
                    events: [handleTouched(), handleChanged()],
                }),
                class: 'form-control',
                dataElement: 'input',
            });
        }

        function render(events) {
            return div(
                {
                    dataElement: 'input-container',
                },
                [makeInputControl(events)]
            );
        }

        // EVENT HANDLERS

        /*
            Focus the input control.
        */
        function doFocus() {
            const node = ui.getElement('input-container.input');
            if (node) {
                node.focus();
            }
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                const events = Events.make();
                container.innerHTML = render(events);
                events.attachEvents(container);
                // model.setItem('value', config.initialValue);
                syncModelToControl();
                autoValidate();

                channel.on('reset-to-defaults', () => {
                    resetModelValue();
                });
                channel.on('update', (message) => {
                    setModelValue(message.value);
                    syncModelToControl();
                    autoValidate();
                });
                channel.on('focus', () => {
                    doFocus();
                });
                // channel.emit('sync');
            });
        }

        function stop() {
            return Promise.try(() => {
                if (container) {
                    parent.removeChild(container);
                }
                busConnection.stop();
            });
        }

        // INIT

        setModelValue(config.initialValue);

        return {
            start,
            stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
