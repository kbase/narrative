define([
    'bluebird',
    'common/html',
    'common/events',
    'common/ui',
    'common/runtime',
    '../validation',

    'bootstrap',
], (Promise, html, Events, UI, Runtime, Validation) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        span = t('span'),
        strong = t('strong'),
        button = t('button'),
        iTag = t('i'),
        input = t('input'),
        cssBaseClass = 'kb-appInput__checkbox',
        cssErrorClass = `${cssBaseClass}_error_container`;

    function factory(config) {
        const spec = config.parameterSpec,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            model = {
                value: undefined,
                hasInitialValueError: false,
            };
        let parent, container, ui;

        // MODEL

        function setModelValue(value) {
            if (model.value !== value) {
                model.value = value;
                channel.emit('changed', {
                    newValue: model.value,
                });
            }
        }

        function resetModelValue() {
            setModelValue(spec.data.defaultValue);
        }

        // CONTROL

        function getControlValue() {
            const checkbox = ui.getElement('input-container.input');
            if (checkbox.checked) {
                return 1;
            }
            return 0;
        }

        function syncModelToControl() {
            const control = ui.getElement('input-container.input');
            if (model.value === 1) {
                control.checked = true;
            } else {
                control.checked = false;
            }
        }

        // VALIDATION

        function validate() {
            return Promise.try(() => {
                const rawValue = getControlValue(),
                    validationOptions = {
                        required: spec.data.constraints.required,
                        values: [0, 1],
                    };
                return Validation.validateSet(rawValue, validationOptions);
            });
        }

        function autoValidate() {
            return validate().then((result) => {
                channel.emit('validation', result);
            });
        }

        // RENDERING

        function clearInitialValueError() {
            const inputContainer = container.querySelector(`.${cssBaseClass}_container`);
            inputContainer.classList.remove(cssErrorClass);
            inputContainer.querySelector(`.${cssBaseClass}_error`).remove();
            model.hasInitialValueError = false;
        }

        function renderInitialValueError(events) {
            const defaultVal =
                config.parameterSpec.data.defaultValue === 1 ? 'checked' : 'unchecked';
            return div(
                {
                    class: `${cssBaseClass}_error`,
                },
                [
                    div(
                        {
                            class: `${cssBaseClass}_error_container__title`,
                        },
                        [
                            iTag({
                                class: 'fa fa-exclamation-triangle',
                            }),
                            strong(' Error: '),
                        ]
                    ),
                    `Invalid value of "${config.initialValue}" for parameter ${spec.ui.label}. Default value ${defaultVal} used.`,
                    button(
                        {
                            class: `${cssBaseClass}_error__close_button btn btn-default btn-xs`,
                            type: 'button',
                            title: 'close',
                            id: events.addEvents({
                                events: [
                                    {
                                        type: 'click',
                                        handler: clearInitialValueError,
                                    },
                                ],
                            }),
                        },
                        span({
                            class: 'fa fa-times',
                        })
                    ),
                ]
            );
        }

        function makeInputControl(events) {
            // CONTROL
            const cssBaseClass = 'kb-appInput__checkbox';
            let checked = false;
            if (model.value === 1) {
                checked = true;
            }

            return div(
                {
                    class: `${cssBaseClass}_container ${
                        model.hasInitialValueError ? cssErrorClass : ''
                    }`,
                },
                [
                    input({
                        id: events.addEvents({
                            events: [
                                {
                                    type: 'change',
                                    handler: function () {
                                        if (model.hasInitialValueError) {
                                            clearInitialValueError();
                                        }
                                        validate().then((result) => {
                                            setModelValue(result.parsedValue);
                                            channel.emit('validation', result);
                                        });
                                    },
                                },
                            ],
                        }),
                        type: 'checkbox',
                        dataElement: 'input',
                        checked,
                        value: 1,
                    }),
                    model.hasInitialValueError ? renderInitialValueError(events) : '',
                ]
            );
        }

        function render(events) {
            return div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' }, makeInputControl(events))]
            );
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));

                ui = UI.make({
                    node: container,
                });

                const events = Events.make({
                    node: container,
                });

                // initialize based on config.initialValue. If it's not 0 or 1, then
                // note that we have an initial value error, and set to the default.
                let initValue = config.initialValue;
                if (initValue !== 0 && initValue !== 1) {
                    initValue = config.parameterSpec.data.defaultValue;
                    model.hasInitialValueError = true;
                }

                setModelValue(initValue);
                container.innerHTML = render(events);
                events.attachEvents();

                // Listen for events from the containing environment.

                channel.on('reset-to-defaults', () => {
                    resetModelValue();
                    syncModelToControl();
                });

                channel.on('update', (message) => {
                    setModelValue(message.value);
                    syncModelToControl();
                });

                return autoValidate();
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
