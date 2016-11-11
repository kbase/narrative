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
], function (Promise, $, Jupyter, html, Validation, Events) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        input = t('input'),
        label = t('label');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            container,
            $container,
            bus = config.bus,
            model = {
                updates: 0,
                value: undefined
            };

        // Validate configuration.
        // Nothing to do...

        // validate
        //if (!spec.spec.checkbox_options) {
        //    throw new Error('Checkbox control does not have checkbox_options configured');
        //}
        // checkboxOptions = spec.spec.checkbox_options;
        // if (spec.trueValue === undefined) {
        //     throw new Error('Checkbox spec option checked_value is not configured');
        // }
        // if (spec.falseValue === undefined) {
        //     throw new Error('Checkbox spec option unchecked_value is not configured');
        // }

        options.enabled = true;

        // constraints = {
        //     valueChecked: checkboxOptions.checked_value,
        //     valueUnchecked: checkboxOptions.unchecked_value
        // };

        // Is this a valid spec?

        //if (spec.required() && spec.defaultValue() === null) {
        //    // console.log('CHECK', spec.defaultValue(), spec.nullValue(), spec.dataType());
        //    throw new Error('This checkbox is required yet has an undefined default value');
        /// }


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
                return 1;
            }
            return 0;
        }

        /*
         * 
         * Sets the value in the model and then refreshes the widget.
         * 
         */
        function setModelValue(value) {
            return Promise.try(function () {
                    if (model.value !== value) {
                        model.value = value;
                        return true;
                    }
                    return false;
                })
                .then(function (changed) {
                    render();
                });
        }

        function unsetModelValue() {
            return Promise.try(function () {
                    model.value = undefined;
                })
                .then(function (changed) {
                    render();
                });
        }

        function meansChecked(value) {
            if (!value) {
                return false;
            }
            switch (value.trim()) {
            case '1':
            case 'true':
                return true;
            case '0':
            case 'false':
            case '':
                return false;
            }
        }

        function resetModelValue() {
            if (spec.spec.default_values && spec.spec.default_values.length > 0) {
                if (meansChecked(spec.spec.default_values[0])) {
                    setModelValue(1);
                } else {
                    setModelValue(0);
                }
            } else {
                // NOTE: we set the checkbox explicitly to the "unchecked value" 
                // if no default value is provided.
                // unsetModelValue();
                setModelValue(0);
            }
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
                    // TODO should actually create the set of checkbox values and
                    // make this a validation option, although not specified as 
                    // such in the spec.
                    validationOptions = {
                        required: spec.data.constraints.required,
                        values: [0, 1]
                    },
                    validationResult;

                validationResult = Validation.validateSet(rawValue, validationOptions);

                return validationResult;
            });
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeInputControl(currentValue, events, bus) {
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
                            handler: function (e) {
                                validate()
                                    .then(function (result) {
                                        if (result.isValid) {
                                            bus.emit('changed', {
                                                newValue: result.value
                                            });
                                            setModelValue(result.value);
                                        }
                                        bus.emit('validation', {
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

        function autoValidate() {
            return validate()
                .then(function (result) {
                    bus.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        function render() {
            Promise.try(function () {
                    var events = Events.make(),
                        inputControl = makeInputControl(model.value, events, bus);

                    $container.find('[data-element="input-container"]').html(inputControl);
                    events.attachEvents(container);
                })
                .then(function () {
                    return autoValidate();
                });
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


        // LIFECYCLE API

        function init() {}

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
                bus.on('reset-to-defaults', function (message) {
                    resetModelValue();
                });
                // shorthand for a test of the message type.
                bus.on('update', function (message) {
                    setModelValue(message.value);
                });

                bus.emit('sync');
                return null;
                // return resetModelValue();
            });
        }

        function run(params) {
            return Promise.try(function () {
                return setModelValue(params.value);
            });
            //.then(function () {
            //    return autoValidate();
            //});
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