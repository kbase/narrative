define([
    'bluebird',
    'base/js/namespace',
    'kb_common/html',
    '../validation',
    'common/events',
    'common/ui',
    'bootstrap',
    'css!font-awesome',
], (Promise, Jupyter, html, Validation, Events, UI) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        input = t('input'),
        label = t('label');

    function factory(config) {
        let spec = config.parameterSpec,
            bus = config.bus,
            parent,
            container,
            ui,
            model = {
                updates: 0,
                value: undefined,
            };

        // MODEL

        function setModelValue(value) {
            if (model.value !== value) {
                model.value = value;
                bus.emit('changed', {
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
            const control = ui.getElement('input-control.input');
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
                bus.emit('validation', {
                    errorMessage: result.errorMessage,
                    diagnosis: result.diagnosis,
                });
            });
        }

        // RENDERING

        function makeViewControl() {
            // CONTROL
            let checked = false;
            if (model.value === 1) {
                checked = true;
            }
            return label([
                input({
                    type: 'checkbox',
                    dataElement: 'input',
                    checked: checked,
                    value: 1,
                    disabled: true,
                    readonly: true,
                }),
            ]);
        }

        function render(events) {
            return div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' }, makeViewControl(events, bus))]
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

                setModelValue(config.initialValue);
                container.innerHTML = render(events);
                events.attachEvents();

                autoValidate();

                // Listen for events from the containing environment.

                bus.on('reset-to-defaults', () => {
                    resetModelValue();
                });

                bus.on('update', (message) => {
                    setModelValue(message.value);
                    syncModelToControl();
                });

                return null;
            });
        }

        function stop() {
            if (container) {
                parent.removeChild(container);
            }
        }

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
