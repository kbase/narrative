define(['bluebird', 'common/html', 'common/ui', 'common/props', 'bootstrap', 'css!font-awesome'], (
    Promise,
    html,
    UI,
    Props
) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        const spec = config.parameterSpec,
            bus = config.bus,
            model = Props.make({
                data: {
                    value: null,
                },
                onUpdate: () => {},
            });
        let parent, container, ui;

        // CONTROL

        function setControlValue(newValue) {
            ui.getElement('input-container.input')[0].text = newValue;
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
            syncModelToControl();
        }

        function resetModelValue() {
            setModelValue(spec.data.defaultValue);
            syncModelToControl();
        }

        // sync the dom to the model.
        function syncModelToControl() {
            setControlValue(model.getItem('value', null));
        }

        // DOM & RENDERING

        function makeViewControl() {
            return select(
                {
                    class: 'form-control',
                    readonly: true,
                    dataElement: 'input',
                    disabled: true,
                },
                [option({})]
            );
        }

        function render() {
            return div(
                {
                    dataElement: 'input-container',
                },
                [makeViewControl()]
            );
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                container.innerHTML = render();
                setModelValue(config.initialValue);
                syncModelToControl();

                bus.on('reset-to-defaults', () => {
                    resetModelValue();
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
