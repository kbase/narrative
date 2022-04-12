define([
    'bluebird',
    'common/html',
    '../validation',
    'common/events',
    'common/ui',
    'common/props',
    '../inputUtils',
    '../validators/constants',
    'bootstrap',
], (Promise, html, Validation, Events, UI, Props, inputUtils, Constants) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        textarea = t('textarea');

    function factory(config) {
        const spec = config.parameterSpec,
            bus = config.bus,
            options = {
                enabled: true,
                rowCount: spec.ui.nRows || 5,
            };
        let parent,
            container,
            model = {
                value: undefined,
            },
            ui;

        // CONTROL

        function getControlValue() {
            return ui.getElement('input-container.input').value;
        }

        function setControlValue(newValue) {
            if (newValue === null) {
                newValue = '';
            }
            ui.getElement('input-container.input').value = newValue;
        }

        // MODEL

        // NB this is a trusted method. The value had better be valid,
        // since it won't (can't) be validated. Validation is an event
        // which sits between the control and the model.
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
            setModelValue(spec.data.constraints.defaultValue);
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
                bus.emit('validation', result);
            });
        }

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
                    bus.emit('touched');
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
                            bus.emit('changed', {
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
                            bus.emit('validation', result);
                        })
                        .catch((err) => {
                            bus.emit('validation', {
                                isValid: false,
                                diagnosis: Constants.DIAGNOSIS.INVALID,
                                errorMessage: err.message,
                            });
                        });
                },
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
                    events: [handleChanged(), handleTouched()],
                }),
                class: 'form-control',
                dataElement: 'input',
                rows: options.rowCount,
            });
        }

        function render(events) {
            const content = div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' }, [makeInputControl(events)])]
            );
            return {
                content: content,
                events: events,
            };
        }

        // LIFECYCLE API
        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                const events = Events.make(),
                    theLayout = render(events);

                setModelValue(config.initialValue);

                container.innerHTML = theLayout.content;
                events.attachEvents(container);

                bus.on('reset-to-defaults', () => {
                    resetModelValue();
                });
                bus.on('update', (message) => {
                    setModelValue(message.value);
                });
                // bus.emit('sync');
                syncModelToControl();
                autoValidate();
            });
        }

        function stop() {
            return Promise.try(() => {
                if (parent && container) {
                    parent.removeChild(container);
                }
            });
        }

        // INIT

        model = Props.make({
            data: {
                value: null,
            },
            onUpdate: function () {},
        });

        setModelValue(config.initialValue);

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
