define([
    'bluebird',
    'kb_common/html',
    '../validators/text',
    'common/events',
    'common/ui',
    'common/props',
    '../inputUtils',

    'bootstrap',
    'css!font-awesome',
], (Promise, html, Validation, Events, UI, Props, inputUtils) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        let spec = config.parameterSpec,
            bus = config.bus,
            parent,
            container,
            ui,
            model;

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

        // DOM & RENDERING

        function makeViewControl(events) {
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
                // model.setItem('value', config.initialValue);
                syncModelToControl();

                bus.on('reset-to-defaults', () => {
                    resetModelValue();
                });
                bus.on('focus', () => {
                    doFocus();
                });
                // bus.emit('sync');
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
