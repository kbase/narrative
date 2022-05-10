define(['bluebird', 'common/html', 'common/ui', 'bootstrap'], (Promise, html, UI) => {
    'use strict';

    const div = html.tag('div'),
        input = html.tag('input');

    function factory(config) {
        const spec = config.parameterSpec,
            bus = config.bus;
        let container,
            ui,
            value = config.initialValue;

        function setModelValue(newValue) {
            value = newValue;
            const inputField = ui.getElement('input');
            if (value === null || value === undefined) {
                inputField.removeAttribute('value');
            } else {
                inputField.setAttribute('value', newValue);
            }
        }

        function resetModelValue() {
            setModelValue(spec.data.defaultValue);
        }

        function render(value) {
            const inputControl = input({
                class: 'form-control',
                dataElement: 'input',
                value,
                readonly: true,
                disabled: true,
            });
            ui.setContent('input-container', inputControl);
        }

        function layout() {
            return div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' })]
            );
        }

        // LIFECYCLE API

        function start() {
            return Promise.try(() => {
                bus.on('run', (message) => {
                    container = message.node;
                    ui = UI.make({ node: container });

                    container.innerHTML = layout();

                    bus.on('reset-to-defaults', () => {
                        resetModelValue();
                    });
                    bus.on('update', (message) => {
                        setModelValue(message.value);
                    });

                    render(config.initialValue);
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                container.innerHTML = '';
            });
        }

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
