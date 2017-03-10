/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    '../validators/text',
    'common/events',
    'common/ui',
    'common/props',
    'common/runtime',
    '../inputUtils',
    './customInputs/petInput',

    'bootstrap',
    'css!font-awesome'
], function (
    Promise,
    html,
    Validation,
    Events,
    UI,
    Props,
    Runtime,
    inputUtils,
    PetInput
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        var spec = config.parameterSpec,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            parent,
            container,
            ui,
            model,
            inputWidget;

        // CONTROL

        function getControlValue() {
            return ui.getElement('input-container.input').value;
        }

        function setControlValue(newValue) {
            ui.getElement('input-container.input').value = newValue;
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
        }

        function resetModelValue() {
            setModelValue(spec.data.defaultValue);
        }

        // sync the dom to the model.
        function syncModelToControl() {
            console.log('syncing...', inputWidget, model.getItem('value', null));
            // if (inputWidget) {
            //     inputWidget.setValue(model.getItem('value', null));
            // }
            // setControlValue(model.getItem('value', null));
        }



        // VALIDATION

        function importControlValue() {
            return Promise.try(function () {
                return Validation.importString(getControlValue());
            });
        }

        function validate(value) {
            return Promise.try(function () {
                return Validation.validate(value, spec);
            });
        }

        function autoValidate() {
            return validate(model.getItem('value'))
                .then(function (result) {
                    channel.emit('validation', result);
                });
        }


        // DOM & RENDERING

        var autoChangeTimer;

        function cancelTouched() {
            if (autoChangeTimer) {
                window.clearTimeout(autoChangeTimer);
                autoChangeTimer = null;
            }
        }

        function handleTouched(interval) {
            var editPauseInterval = interval || 100;
            return {
                type: 'keyup',
                handler: function (e) {
                    channel.emit('touched');
                    cancelTouched();
                    autoChangeTimer = window.setTimeout(function () {
                        autoChangeTimer = null;
                        e.target.dispatchEvent(new Event('change'));
                    }, editPauseInterval);
                }
            };
        }

        function handleChanged() {
            return {
                type: 'change',
                handler: function () {
                    cancelTouched();
                    importControlValue()
                        .then(function (value) {
                            model.setItem('value', value);
                            channel.emit('changed', {
                                newValue: value
                            });
                            return validate(value);
                        })
                        .then(function (result) {
                            if (result.isValid) {
                                if (config.showOwnMessages) {
                                    ui.setContent('input-container.message', '');
                                }
                            } else if (result.diagnosis === 'required-missing') {
                                // nothing??
                            } else {
                                if (config.showOwnMessages) {
                                    // show error message -- new!
                                    var message = inputUtils.buildMessageAlert({
                                        title: 'ERROR',
                                        type: 'danger',
                                        id: result.messageId,
                                        message: result.errorMessage
                                    });
                                    ui.setContent('input-container.message', message.content);
                                    message.events.attachEvents();
                                }
                            }
                            channel.emit('validation', result);
                        })
                        .catch(function (err) {
                            channel.emit('validation', {
                                isValid: false,
                                diagnosis: 'invalid',
                                errorMessage: err.message
                            });
                        });
                }
            };
        }

        function makeInputControl(events) {
            return input({
                id: events.addEvents({
                    events: [handleTouched(), handleChanged()]
                }),
                class: 'form-control',
                dataElement: 'input'
            });
        }

        function render(node, arg) {
            inputWidget = PetInput.make({
                runtime: runtime
            });

            inputWidget.channel.on('changed', function (message) {
                model.setItem('value', message.newValue);
                channel.emit('changed', {
                    newValue: message.newValue
                });
            });

            return inputWidget.attach(node)
                .then(function () {
                    inputWidget.start(arg);
                });
        }

        // EVENT HANDLERS

        /*
            Focus the input control.
        */
        function doFocus() {
            var node = ui.getElement('input-container.input');
            if (node) {
                node.focus();
            }
        }


        // LIFECYCLE API

        function start(arg) {
            return Promise.try(function () {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                return render(container, {
                        initialValue: model.getItem('value', null)
                    })
                    .then(function () {
                        // model.setItem('value', config.initialValue);
                        // syncModelToControl();
                        // autoValidate();

                        channel.on('reset-to-defaults', function () {
                            resetModelValue();
                        });
                        channel.on('update', function (message) {
                            setModelValue(message.value);
                            syncModelToControl();
                            autoValidate();
                        });
                        channel.on('focus', function () {
                            doFocus();
                        });
                        // channel.emit('sync');
                    })
                    .catch(function (err) {
                        console.error('ERROR', err);
                    });
            });
        }

        function stop() {
            return Promise.try(function () {
                if (container) {
                    parent.removeChild(container);
                }
                busConnection.stop();
            });
        }

        // INIT

        model = Props.make({
            data: {
                value: null
            },
            onUpdate: function () {
                //syncModelToControl();
                //autoValidate();
            }
        });

        setModelValue(config.initialValue);

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});