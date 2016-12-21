define([
    'bluebird',
    'kb_common/html',
    'common/events',
    'common/ui',
    'common/runtime',
    '../validation',

    'bootstrap',
    'css!font-awesome'
], function(
    Promise,
    html,
    Events,
    UI,
    Runtime,
    Validation
) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        input = t('input'),
        label = t('label');

    function factory(config) {
        var spec = config.parameterSpec,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            parent, container,
            ui,
            model = {
                updates: 0,
                value: undefined
            };

        // MODEL

        function setModelValue(value) {
            if (model.value !== value) {
                model.value = value;
                channel.emit('changed', {
                    newValue: model.value
                });
            }
        }

        function resetModelValue() {
            setModelValue(spec.data.defaultValue);
        }

        // CONTROL

        function getControlValue() {
            var checkbox = ui.getElement('input-container.input');
            if (checkbox.checked) {
                return 1;
            }
            return 0;
        }

        function syncModelToControl() {
            var control = ui.getElement('input-control.input');
            if (model.value === 1) {
                control.checked = true;
            } else {
                control.checked = false;
            }
        }

        // VALIDATION

        function validate() {
            return Promise.try(function() {
                var rawValue = getControlValue(),
                    validationOptions = {
                        required: spec.data.constraints.required,
                        values: [0, 1]
                    };
                return Validation.validateSet(rawValue, validationOptions);
            });
        }

        function autoValidate() {
            return validate()
                .then(function(result) {
                    channel.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        // RENDERING

        function makeInputControl(events) {
            // CONTROL
            var checked = false;
            if (model.value === 1) {
                checked = true;
            }
            return label([
                input({
                    id: events.addEvents({
                        events: [{
                            type: 'change',
                            handler: function() {
                                validate()
                                    .then(function(result) {
                                        if (config.showOwnMessages) {
                                            ui.setContent('input-container.message', '');
                                        }
                                        if (result.diagnosis === 'optional-empty') {
                                            setModelValue(result.parsedValue);
                                        } else {
                                            setModelValue(result.parsedValue);
                                        }
                                        channel.emit('validation', {
                                            errorMessage: result.errorMessage,
                                            diagnosis: result.diagnosis
                                        });
                                    });
                            }
                        }]
                    }),
                    type: 'checkbox',
                    dataElement: 'input',
                    checked: checked,
                    value: 1
                })
            ]);
        }

        function render(events) {
            return div({
                dataElement: 'main-panel'
            }, [
                div({ dataElement: 'input-container' },
                    makeInputControl(events)
                )
            ]);
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(function() {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));

                ui = UI.make({
                    node: container
                });

                var events = Events.make({
                    node: container
                });

                setModelValue(config.initialValue);
                container.innerHTML = render(events);
                events.attachEvents();

                autoValidate();

                // Listen for events from the containing environment.

                channel.on('reset-to-defaults', function() {
                    resetModelValue();
                });

                channel.on('update', function(message) {
                    setModelValue(message.value);
                    syncModelToControl();
                });


                // bus.emit('sync');
                return null;
            });
        }

        function stop() {
            return Promise.try(function() {
                if (container) {
                    parent.removeChild(container);
                }
                busConnection.stop();
            });
        }


        // INIT

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});