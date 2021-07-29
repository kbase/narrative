define([
    'bluebird',
    'base/js/namespace',
    'kb_common/html',
    'common/events',
    'common/ui',
    'common/props',

    'bootstrap',
    'css!font-awesome',
], (Promise, Jupyter, html, Events, UI, Props) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        let spec = config.parameterSpec,
            bus = config.bus,
            parent,
            container,
            model,
            ui;

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

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */

        function makeViewControl(currentValue) {
            // CONTROL
            let initialControlValue,
                min = spec.data.constraints.min,
                max = spec.data.constraints.max;
            if (typeof currentValue === 'number') {
                initialControlValue = String(currentValue);
            }
            return div({ style: { width: '100%' }, dataElement: 'input-wrapper' }, [
                div({ class: 'input-group', style: { width: '100%' } }, [
                    typeof min === 'number'
                        ? div(
                              {
                                  class: 'input-group-addon kb-input-group-addon',
                                  fontFamily: 'monospace',
                              },
                              String(min) + ' &#8804; '
                          )
                        : '',
                    input({
                        class: 'form-control',
                        dataElement: 'input',
                        dataType: 'float',
                        style: {
                            textAlign: 'right',
                        },
                        value: initialControlValue,
                        readonly: true,
                    }),
                    typeof max === 'number'
                        ? div(
                              {
                                  class: 'input-group-addon kb-input-group-addon',
                                  fontFamily: 'monospace',
                              },
                              ' &#8804; ' + String(max)
                          )
                        : '',
                ]),
                div({ dataElement: 'message', style: { backgroundColor: 'red', color: 'white' } }),
            ]);
        }

        function render() {
            return Promise.try(() => {
                const inputControl = makeViewControl(model.getItem('value'));
                ui.setContent('input-container', inputControl);
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
            });
        }

        // INIT

        model = Props.make({
            data: {
                value: spec.data.nullValue,
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
