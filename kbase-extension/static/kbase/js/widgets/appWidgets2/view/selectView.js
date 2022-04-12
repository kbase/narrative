define(['bluebird', 'common/html', 'common/ui', 'bootstrap'], (Promise, html, UI) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        const spec = config.parameterSpec,
            bus = config.bus,
            model = {
                availableValues: config.availableValues || spec.data.constraints.options || [],
                value: config.initialValue || null,
            };
        let parent, ui, container;

        function makeViewControl() {
            const selectOptions = model.availableValues.map((item) => {
                return option(
                    {
                        value: item.value,
                        selected: item.value === model.value,
                        disabled: true,
                    },
                    item.display
                );
            });

            // CONTROL
            return select(
                {
                    class: 'form-control',
                    dataElement: 'input',
                    readonly: true,
                },
                [option({ value: '' }, '')].concat(selectOptions)
            );
        }

        function syncModelToControl() {
            // assuming the model has been modified...
            const control = ui.getElement('input-container.input');
            [...control.querySelectorAll(`option`)].forEach((option) => {
                option.removeAttribute('selected');
            });
            control.querySelector(`option[value="${model.value}"]`).setAttribute('selected', true);
        }

        function layout() {
            return div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' }, makeViewControl())]
            );
        }

        function setModelValue(value) {
            if (model.value !== value) {
                model.value = value;
                syncModelToControl();
            }
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                container.innerHTML = layout();

                bus.on('reset-to-defaults', () => {
                    setModelValue(spec.data.defaultValue);
                });
                bus.on('update', (message) => {
                    setModelValue(message.value);
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
