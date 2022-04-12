define([
    'bluebird',
    'common/html',
    'common/events',
    'common/ui',
    'common/runtime',
    'common/props',
    '../validation',

    'bootstrap',
], (Promise, html, Events, UI, Runtime, Props, Validation) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        const spec = config.parameterSpec,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            model = Props.make({
                data: {
                    value: null,
                },
                onUpdate: function () {},
            });
        let hostNode, container, ui;

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

        // CONTROL

        function setControlValue(newValue) {
            ui.getElement('input-container.input').value = newValue;
        }

        // VALIDATION

        function validate(value) {
            return Promise.try(() => {
                return Validation.validateTextString(value, spec.data.constraints);
            });
        }

        function autoValidate() {
            return validate(model.getItem('value')).then((result) => {
                channel.emit('validation', result);
            });
        }

        function makeViewControl(currentValue) {
            return input({
                class: 'form-control',
                readonly: true,
                dataElement: 'input',
                value: currentValue,
            });
        }

        function render() {
            Promise.try(() => {
                const events = Events.make(),
                    inputControl = makeViewControl(model.value, events);

                ui.setContent('input-container', inputControl);
                events.attachEvents(container);
            }).then(() => {
                return autoValidate();
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

        function start(arg) {
            return Promise.try(() => {
                hostNode = arg.node;
                container = hostNode.appendChild(document.createElement('div'));
                ui = UI.make({ node: arg.node });

                const events = Events.make(),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents(container);

                setModelValue(config.initialValue);

                render();
                autoValidate();
                syncModelToControl();

                channel.on('reset-to-defaults', () => {
                    resetModelValue();
                });
                channel.on('update', (message) => {
                    setModelValue(message.value);
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                if (container) {
                    hostNode.removeChild(container);
                }
                busConnection.stop();
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
