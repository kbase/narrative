define([
    'bluebird',
    'common/html',
    'common/events',
    'common/ui',
    'common/props',
    '../inputUtils',

    'bootstrap',
], (Promise, html, Events, UI, Props, InputUtils) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        const spec = config.parameterSpec,
            bus = config.bus,
            model = Props.make({
                data: {
                    value: spec.data.nullValue,
                },
                onUpdate: function () {},
            });

        let parent, container, ui;

        // MODEL

        function setModelValue(value) {
            // If a model value needs resetting, that should be done
            // by resetModelValue
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

        function makeViewControl(currentValue) {
            // CONTROL
            const initialControlValue = String(currentValue),
                min = spec.data.constraints.min,
                max = spec.data.constraints.max;

            return div({ style: { width: '100%' }, dataElement: 'input-wrapper' }, [
                div({ class: 'input-group', style: { width: '100%' } }, [
                    typeof min === 'number' ? InputUtils.numericalBoundaryDiv(min, true) : '',
                    input({
                        class: 'form-control',
                        dataElement: 'input',
                        dataType: 'int',
                        readonly: true,
                        value: initialControlValue,
                        style: {
                            textAlign: 'right',
                        },
                    }),
                    typeof max === 'number' ? InputUtils.numericalBoundaryDiv(max, false) : '',
                ]),
                div({ dataElement: 'message', style: { backgroundColor: 'red', color: 'white' } }),
            ]);
        }

        function render() {
            return Promise.try(() => {
                const events = Events.make(),
                    inputControl = makeViewControl(model.getItem('value'), events);

                ui.setContent('input-container', inputControl);
                events.attachEvents(container);
            });
        }

        function layout() {
            const content = div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' })]
            );
            return {
                content: content,
            };
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                const theLayout = layout();

                container.innerHTML = theLayout.content;

                bus.on('reset-to-defaults', () => {
                    resetModelValue();
                });
                bus.on('update', (message) => {
                    model.setItem('value', message.value);
                });

                return render();
            });
        }

        function stop() {
            return Promise.try(() => {
                if (container) {
                    parent.removeChild(container);
                }
                return null;
            });
        }

        // INIT

        setModelValue(config.initialValue);

        return {
            start,
            stop,
            bus,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
