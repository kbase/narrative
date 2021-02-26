define([
    'bluebird',
    'kb_common/html',
    '../validation',
    'common/events',
    'common/runtime',
    'common/dom',
    'bootstrap',
    'css!font-awesome',
], (Promise, html, Validation, Events, Runtime, Dom) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        let options = {},
            spec = config.parameterSpec,
            parent,
            container,
            bus = config.bus,
            model = {
                value: undefined,
            },
            dom;

        options.enabled = true;

        function setModelValue(value) {
            return Promise.try(() => {
                if (model.value !== value) {
                    model.value = value;
                    return true;
                }
                return false;
            }).then((changed) => {
                render();
            });
        }

        function unsetModelValue() {
            return Promise.try(() => {
                model.value = undefined;
            }).then((changed) => {
                render();
            });
        }

        function resetModelValue() {
            if (spec.data.defaultValue) {
                setModelValue(spec.data.defaultValue);
            } else {
                unsetModelValue();
            }
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeInputControl(currentValue, events, bus) {
            return input({
                class: 'form-control',
                dataElement: 'input',
                value: currentValue,
                readonly: true,
                disabled: true,
            });
        }

        function render() {
            Promise.try(() => {
                const events = Events.make(),
                    inputControl = makeInputControl(model.value, events, bus);

                dom.setContent('input-container', inputControl);
                events.attachEvents(container);
            });
        }

        function layout(events) {
            const content = div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' })]
            );
            return {
                content: content,
                events: events,
            };
        }

        // LIFECYCLE API

        function start() {
            return Promise.try(() => {
                bus.on('run', (message) => {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    dom = Dom.make({ node: container });

                    const events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents(container);

                    bus.on('reset-to-defaults', (message) => {
                        resetModelValue();
                    });
                    bus.on('update', (message) => {
                        setModelValue(message.value);
                    });
                    bus.on('refresh', () => {});

                    bus.emit('sync');
                });
            });
        }

        return {
            start: start,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
