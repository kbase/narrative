define([
    'bluebird',
    'kb_common/html',
    '../validators/text',
    'common/events',
    'common/ui',

    'bootstrap',
    'css!font-awesome',
], (Promise, html, Validation, Events, UI) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        let options = {},
            spec = config.parameterSpec,
            bus = config.bus,
            parent,
            ui,
            container,
            model = {
                availableValues: null,
                value: null,
            };

        options.enabled = true;

        model.availableValues = spec.data.constraints.options;

        model.availableValuesMap = {};
        model.availableValues.forEach((item, index) => {
            item.index = index;
            model.availableValuesMap[item.value] = item;
        });

        function makeViewControl(events) {
            let selected,
                selectOptions = model.availableValues.map((item) => {
                    selected = false;
                    if (item.value === model.value) {
                        selected = true;
                    }

                    return option(
                        {
                            value: item.value,
                            selected: selected,
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
            const control = ui.getElement('input-control.input');
            // loop through the options, selecting the one with the value.
            // unselect
            if (control.selectedIndex >= 0) {
                control.options.item(control.selectedIndex).selected = false;
            }
            const selectedItem = model.availableValuesMap[model.value];
            if (selectedItem) {
                control.options.item(selectedItem.index + 1).selected = true;
            }
        }

        function layout(events) {
            const content = div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' }, makeViewControl(events))]
            );
            return {
                content: content,
                events: events,
            };
        }

        function setModelValue(value) {
            if (model.value !== value) {
                model.value = value;
            }
        }

        function resetModelValue() {
            setModelValue(spec.data.defaultValue);
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                const events = Events.make({ node: container }),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents();

                bus.on('reset-to-defaults', () => {
                    resetModelValue();
                });
                bus.on('update', (message) => {
                    setModelValue(message.value);
                });
                // bus.emit('sync');

                setModelValue(config.initialValue);
                syncModelToControl();
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
