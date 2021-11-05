define([
    'bluebird',
    '../validators/text',
    'common/lang',
    'common/ui',
    'common/props',
    'common/runtime',

    'bootstrap',
], (Promise, Validation, Lang, UI, Props, Runtime) => {
    'use strict';

    function factory(config) {
        const spec = config.parameterSpec,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            subtype = spec.data.constraints.type;
        let parent, container, ui, inputWidget;

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
            console.log('syncing...', inputWidget, model.getItem('value', null));
        }

        // VALIDATION

        function validate(value) {
            return Promise.try(() => {
                return Validation.validate(value, spec);
            });
        }

        function autoValidate() {
            return validate(model.getItem('value')).then((result) => {
                channel.emit('validation', result);
            });
        }

        // DOM & RENDERING

        function makeCustomWidget() {
            // For now all custom inputs live in the
            // customInputs directory of the input collection directory
            // and are named like <type>Input.js
            return Lang.pRequire(['./customInputs/' + subtype + 'Input']).spread((Module) => {
                const inputWidget = Module.make({
                    runtime: runtime,
                });

                inputWidget.channel.on('changed', (message) => {
                    model.setItem('value', message.newValue);
                    channel.emit('changed', {
                        newValue: message.newValue,
                    });
                });

                return inputWidget;
            });
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

                return makeCustomWidget()
                    .then((customWidget) => {
                        inputWidget = customWidget;
                        return customWidget.start({
                            node: container,
                            initialValue: model.getItem('value', null),
                        });
                    })
                    .then(() => {
                        channel.on('reset-to-defaults', () => {
                            resetModelValue();
                        });
                        channel.on('update', (message) => {
                            setModelValue(message.value);
                            syncModelToControl();
                            autoValidate();
                        });
                        channel.on('focus', () => {
                            doFocus();
                        });
                        // channel.emit('sync');
                    })
                    .catch((err) => {
                        UI.showErrorDialog({
                            title: 'Error',
                            error: {
                                name: 'Error',
                                message: err.message,
                                detail: 'detail here',
                                resolution: 'how to resolve here.',
                            },
                        });
                        console.error('ERROR', err);
                    });
            });
        }

        function stop() {
            return inputWidget.stop().then(() => {
                if (container) {
                    parent.removeChild(container);
                }
                busConnection.stop();
            });
        }

        // INIT

        const model = Props.make({
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
