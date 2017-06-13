/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'require',
    'kb_common/html',
    '../validators/text',
    'common/events',
    'common/ui',
    'common/props',
    'common/runtime',

    'bootstrap',
    'css!font-awesome'
], function (
    Promise,
    require,
    html,
    Validation,
    Events,
    UI,
    Props,
    Runtime
) {
    'use strict';

    function factory(config) {
        var spec = config.parameterSpec,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            subtype = spec.data.constraints.type,
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

        function prequire(module) {
            return new Promise(function (resolve, reject) {
                require([module], function (Module) {
                    resolve(Module);
                }, function (err) {
                    reject(err);
                });
            });
        }

        function makeCustomWidget(arg) {

            // For now all custom inputs live in the 
            // customInputs directory of the input collection directory
            // and are named like <type>Input.js
            return prequire('./customInputs/' + subtype + 'Input')
                .then(function (Module) {
                    var inputWidget = Module.make({
                        runtime: runtime
                    });

                    inputWidget.channel.on('changed', function (message) {
                        model.setItem('value', message.newValue);
                        channel.emit('changed', {
                            newValue: message.newValue
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

                return makeCustomWidget()
                    .then(function (customWidget) {
                        inputWidget = customWidget;
                        return customWidget.start({
                            node: container,
                            initialValue: model.getItem('value', null)
                        });
                    })
                    .then(function () {

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
                        UI.showErrorDialog({
                            title: 'Error',
                            error: {
                                name: 'Error',
                                message: err.message,
                                detail: 'detail here',
                                resolution: 'how to resolve here.'
                            }
                        });
                        console.error('ERROR', err);
                    });
            });
        }

        function stop() {
            return inputWidget.stop()
            .then(function () {
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
            onUpdate: function () {}
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