/*global define, document*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'jquery',
    'common/validation',
    'css!font-awesome'
], function(
    Promise,
    $,
    Validation
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

        /*
         * If the parameter is optional, and is empty, return null.
         * If it allows multiple values, wrap single results in an array
         * There is a weird twist where if it ...
         * well, hmm, the only consumer of this, isValid, expects the values
         * to mirror the input rows, so we shouldn't really filter out any
         * values.
         */
        //  function render() {
        //      Promise.try(function () {
        //          var events = Events.make(),
        //              inputControl = makeInputControl(model.getItem('value'), events, bus);
         //
        //          dom.setContent('input-container', inputControl);
        //          events.attachEvents(container);
        //      })
        //      .then(function () {
        //          return autoValidate();
        //      });
        //  }

        function getInputValue() {
            return 'my-value';
        }

        function resetModelValue() {
            if (spec.spec.default_values && spec.spec.default_values.length > 0) {
                model.setItem('value', spec.spec.default_values[0]);
            } else {
                model.setItem('value', undefined);
            }
        }

        // function autoValidate() {
        //     return validate()
        //         .then(function (result) {
        //             bus.send({
        //                 type: 'validation',
        //                 errorMessage: result.errorMessage,
        //                 diagnosis: result.diagnosis
        //             });
        //         });
        // }

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

                    $(container).append('<input type="text">');
                    // container.innerHTML = "<b>YEAH WOO EDITOR!</b>";
                    bus.on('reset-to-defaults', function () {
                        resetModelValue();
                    });
                    bus.on('update', function (message) {
                        model.setItem('value', message.value);
                    });
                    bus.on('stop', function () {
                        bus.stop();
                    })
                    bus.emit('sync');
                });
            });
        }

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
