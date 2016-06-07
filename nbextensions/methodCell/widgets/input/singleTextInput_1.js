/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'jquery',
    'base/js/namespace',
    'kb_common/html',
    '../validation',
    '../events',
    'bootstrap',
    'css!font-awesome'
], function (Promise, $, Jupyter, html, Validation, Events) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), input = t('input'), span = t('span'), button = t('button');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            parent,
            container,
            $container,
            bus = config.bus;

        // Validate configuration.
        // Nothing to do...

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
            if (!options.enabled) {
                return {
                    isValid: true,
                    validated: false,
                    diagnosis: 'disabled'
                };
            }

            var rawValue = getInputValue(),
                validationResult = Validation.validateTextString(rawValue, {
                    required: options.required
                });

            return {
                isValid: validationResult.isValid,
                validated: true,
                diagnosis: validationResult.diagnosis,
                errorMessage: validationResult.errorMessage,
                value: validationResult.parsedValue
            };
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeInputControl(currentValue, events, bus) {
            // CONTROL
            return input({
                id: events.addEvents({
                    events: [
                        {
                            type: 'change',
                            handler: function (e) {
                                var result = validate();
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
                            }
                        },
                        {
                            type: 'focus',
                            handler: function (e) {
                                Jupyter.keyboard_manager.disable();
                            }
                        },
                        {
                            type: 'blur',
                            handler: function (e) {
                                Jupyter.keyboard_manager.disable();
                            }
                        }
                    ]}),
                class: 'form-control',
                dataElement: 'input',
                value: currentValue
            });
        }

        function render(params) {
            var events = Events.make(),
                inputControl = makeInputControl(params.value, events, bus);

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


        // LIFECYCLE API

        function init() {
            // Normalize the parameter specification settings.
            // TODO: much of this is just silly, we should be able to use the spec 
            //   directly in most places.
            options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
            options.multiple = spec.multipleItems();
            options.required = spec.required();
            options.enabled = true;
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

        function run(params) {
            return Promise.try(function () {
                return render(params);
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