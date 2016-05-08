/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'jquery',
    'base/js/namespace',
    'kb_common/html',
    '../../validation',
    '../../events',
    'bootstrap',
    'css!font-awesome'
], function (Promise, $, Jupyter, html, Validation, Events) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), select = t('select'), option = t('option');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            parent,
            container,
            $container,
            bus = config.bus;

        // Validate configuration.
        // Nothing to do...
        
        options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
        options.multiple = spec.multipleItems();
        options.required = spec.required();
        options.enabled = true;


        /*
         * If the parameter is optional, and is empty, return null.
         * If it allows multiple values, wrap single results in an array
         * There is a weird twist where if it ...
         * well, hmm, the only consumer of this, isValid, expects the values
         * to mirror the input rows, so we shouldn't really filter out any
         * values.
         */

        function getInputValue() {
            return $container.find('[data-element="input-container"] [data-element="input"]').val();
        }

        /*
         *
         * Text fields can occur in multiples.
         * We have a choice, treat single-text fields as a own widget
         * or as a special case of multiple-entry -- 
         * with a min-items of 1 and max-items of 1.
         * 
         *
         */

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
                    validationResult = Validation.validateText(rawValue, {
                        required: options.required
                    });

                return {
                    isValid: validationResult.isValid,
                    validated: true,
                    diagnosis: validationResult.diagnosis,
                    errorMessage: validationResult.errorMessage,
                    value: validationResult.parsedValue
                };
            });
        }

         function makeInputControl(currentValue, data, events, bus) {
            var selected;
            // There is an input control, and a dropdown,
            // TODO select2 after we get a handle on this...
            var selectOptions = data.map(function (item) {
                selected = false;
                if (item.value === currentValue) {
                    selected = true;
                }

                return option({
                    value: item.value,
                    selected: selected
                }, item.display);
            });

            // CONTROL
            return select({
                id: events.addEvent({type: 'change', handler: function (e) {
                        validate()
                            .then(function (result) {
                                if (result.isValid) {
                                    bus.send({
                                        type: 'changed',
                                        newValue: result.value
                                    });
                                }
                                bus.send({
                                    type: 'validation',
                                    errorMessage: result.errorMessage,
                                    diagnosis: result.diagnosis
                                });
                            });
                    }}),
                class: 'form-control',
                dataElement: 'input'
            }, [option({value: ''}, '')].concat(selectOptions));
        }

        function render(input) {
            var events = Events.make(),                
                initialValue = input.value || config.initialValue,
                inputControl = makeInputControl(initialValue, spec.spec.dropdown_options.options, events, bus);

            $container.find('[data-element="input-container"]').html(inputControl);
            events.attachEvents(container);
        }

        function layout(events) {
            var content = div({
                dataElement: 'main-panel'
            }, [
                div({dataElement: 'input-container'})
            ]);
            return {
                content: content,
                events: events
            };
        }
        
        function autoValidate() {
            validate()
                .then(function (result) {
                    bus.send({
                        type: 'validation',
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }


        // LIFECYCLE API

        function init() {
            // Normalize the parameter specification settings.
            // TODO: much of this is just silly, we should be able to use the spec 
            //   directly in most places.
        }

        function attach(node) {
            return Promise.try(function () {
                parent = node;
                container = node.appendChild(document.createElement('div'));
                $container = $(container);

                var events = Events.make(),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents(container);
            });
        }

        function start() {
            return Promise.try(function () {
            });
        }

        function run(input) {
            return Promise.try(function () {
                return render(input);
            })
            .then(function () {
                return autoValidate();
            });
        }

        return {
            init: init,
            attach: attach,
            start: start,
            run: run
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});