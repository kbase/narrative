define(['bluebird', 'kb_common/html', 'common/dom', 'bootstrap', 'css!font-awesome'], (
    Promise,
    html,
    Dom
) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        const options = {},
            spec = config.parameterSpec,
            bus = config.bus,
            model = {
                value: config.initialValue ? config.initialValue : undefined,
            };
        let parent, container, dom;

        options.enabled = true;

        function setModelValue(value) {
            if (model.value !== value) {
                model.value = value;
            }
            render();
        }

        function unsetModelValue() {
            model.value = undefined;
            render();
        }

        function resetModelValue() {
            if (spec.data.defaultValue) {
                return setModelValue(spec.data.defaultValue);
            } else {
                return unsetModelValue();
            }
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeInputControl(currentValue) {
            return input({
                class: 'form-control',
                dataElement: 'input',
                value: currentValue,
                readonly: true,
                disabled: true,
            });
        }

        function render() {
            dom.setContent('input-container', makeInputControl(model.value));
        }

        function layout() {
            const content = div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' })]
            );
            return {
                content,
            };
        }

        // LIFECYCLE API

        function start() {
            return Promise.try(() => {
                bus.on('run', (message) => {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    dom = Dom.make({ node: container });

                    const theLayout = layout();

                    container.innerHTML = theLayout.content;

                    bus.on('reset-to-defaults', () => {
                        resetModelValue();
                    });
                    bus.on('update', (message) => {
                        setModelValue(message.value);
                    });
                    bus.on('refresh', () => {});

                    render();
                    bus.emit('sync');
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
