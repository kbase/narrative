define([
    'bluebird',
    'common/html',
    '../validation',
    'common/events',
    'common/ui',
    'common/props',

    'bootstrap',
], (Promise, html, Validation, Events, UI, Props) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        const spec = config.parameterSpec,
            bus = config.bus,
            model = Props.make({
                data: {
                    value: null,
                },
                onUpdate: function () {},
            });

        let parent, container, ui;

        // CONTROL

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

        // DOM & RENDERING

        function makeViewControl() {
            return input({
                class: 'form-control',
                readonly: true,
                dataElement: 'input',
            });
        }

        function render(events) {
            return div(
                {
                    dataElement: 'input-container',
                },
                [makeViewControl(events)]
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
                syncModelToControl();
                autoValidate();

                bus.on('reset-to-defaults', () => {
                    resetModelValue();
                });
                bus.on('update', (message) => {
                    setModelValue(message.value);
                    syncModelToControl();
                    autoValidate();
                });
                bus.on('focus', () => {
                    doFocus();
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                if (container) {
                    parent.removeChild(container);
                }
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
