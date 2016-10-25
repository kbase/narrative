/*global define, document*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'jquery',
    '../validation',
    'common/props',
    '../inputUtils',
    'css!font-awesome'
], function(
    Promise,
    $,
    Validation,
    Props,
    inputUtils
) {
    'use strict';

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            parent,
            container,
            bus = config.bus,
            model;

        options.enabled = true;

        function getInputValue() {
            return $(container).find('input').val();
        }

        function resetModelValue() {
            if (spec.spec.default_values && spec.spec.default_values.length > 0) {
                model.setItem('value', spec.spec.default_values[0]);
            } else {
                model.setItem('value', undefined);
            }
        }

        function validate() {
            return Promise.try(function () {
                if (!options.enabled) {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: 'disabled'
                    };
                }

                var rawValue = getInputValue(),
                    validationOptions = {};

                validationOptions.required = spec.required();
                return Validation.validateText(rawValue, validationOptions);
            });
        }

        function start() {
            return Promise.try(function () {
                bus.on('run', function(message) {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));

                    var $input = $('<input type="text" placeholder="I am a reads group editor" style="width:100%">')
                        .on('change', function() {
                            validate()
                            .then(function(result) {
                                if (result.isValid) {
                                    model.setItem('value', result.parsedValue);
                                    bus.emit('changed', {
                                        newValue: result.parsedValue
                                    });
                                } else if (result.diagnosis === 'required-missing') {
                                    model.setItem('value', result.parsedValue);
                                    bus.emit('changed', {
                                        newValue: result.parsedValue
                                    });
                                } else {
                                    if (config.showOwnMessage) {
                                        var message = inputUtils.buildMessageAlert({
                                            title: 'ERROR',
                                            type: 'danger',
                                            id: result.messageId,
                                            message: result.errorMessage
                                        });
                                        $message.html(message.content);
                                        message.events.attachEvents();
                                    }
                                }
                            });
                        });
                    var $message = $('<div>');
                    $(container).append($input).append($message);
                    bus.on('reset-to-defaults', function () {
                        resetModelValue();
                    });
                    bus.on('update', function (message) {
                        model.setItem('value', message.value);
                    });
                    bus.on('stop', function () {
                        bus.stop();
                    });
                    bus.emit('sync');
                });
            });
        }

        function render() {

        }

        model = Props.make({
            data: {
                value: null
            },
            onUpdate: function(props) {
                render();
            }
        });
        // function run(params) {
        //     return Promise.try(function () {
        //         return render(params);
        //     })
        //     .then(function () {
        //         return autoValidate();
        //     });
        // }
        //
        return {
            start: start
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    }
});
