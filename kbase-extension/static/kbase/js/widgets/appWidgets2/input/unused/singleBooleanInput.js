/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'jquery',
    'base/js/namespace',
    'kb_common/html',
    '../validation',
    'common/events',
    'bootstrap',
    'css!font-awesome'
], function(Promise, $, Jupyter, html, Validation, Events) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            parent,
            container,
            $container,
            bus = config.bus,
            valueChecked = spec.spec.checkbox_options.checked_value,
            valueUnchecked = spec.spec.checkbox_options.unchecked_value;

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
            var checkbox = container.querySelector('[data-element="input-container"] [data-element="input"]');
            if (checkbox.checked) {
                return valueChecked;
            }
            return valueUnchecked;
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

        function copyProps(from, props) {
            var newObj = {};
            props.forEach(function(prop) {
                newObj[prop] = from[prop];
            });
            return newObj;
        }

        function validate() {
            return Promise.try(function() {
                if (!options.enabled) {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: 'disabled'
                    };
                }

                var rawValue = getInputValue(),
                    // TODO should actually create the set of checkbox values and
                    // make this a validation option, although not specified as 
                    // such in the spec.
                    validationOptions = {
                        required: spec.required(),
                        values: [valueChecked, valueUnchecked]
                    },
                    validationResult;

                console.log('VALIDATING', rawValue);
                // validationResult = Validation.validateInteger(rawValue, validationOptions);
                validationResult = Validation.validateSet(rawValue, validationOptions);

                return {
                    isValid: validationResult.isValid,
                    validated: true,
                    diagnosis: validationResult.diagnosis,
                    errorMessage: validationResult.errorMessage,
                    value: validationResult.parsedValue
                };
            });
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */

        function makeInputControl(currentValue, data, events, bus) {
            var selectOptions = [
                option({
                    value: 'yes',
                    selected: (currentValue === 'yes' ? true : false)
                }, 'Yes'),
                option({
                    value: 'no',
                    selected: (currentValue === 'no' ? true : false)
                }, 'No')
            ];

            // CONTROL
            return select({
                id: events.addEvent({
                    type: 'change',
                    handler: function(e) {
                        validate()
                            .then(function(result) {
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
                    }
                }),
                class: 'form-control',
                dataElement: 'input'
            }, [option({ value: '' }, '')].concat(selectOptions));
        }

        function render(params) {
            var events = Events.make(),
                inputControl = makeInputControl(params.value || config.initialValue, events, bus);

            $container.find('[data-element="input-container"]').html(inputControl);
            events.attachEvents(container);
        }

        function layout(events) {
            var content = div({
                dataElement: 'main-panel'
            }, [
                div({ dataElement: 'input-container' })
            ]);
            return {
                content: content,
                events: events
            };
        }

        function autoValidate() {
            return validate()
                .then(function(result) {
                    bus.send({
                        type: 'validation',
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        // LIFECYCLE API

        function init() {}

        function attach(node) {
            return Promise.try(function() {
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
            return Promise.try(function() {});
        }

        function run(params) {
            return Promise.try(function() {
                    return render(params);
                })
                .then(function() {
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
        make: function(config) {
            return factory(config);
        }
    };
});