define([
    'bluebird',
    'common/html',
    '../validation',
    'common/events',
    'common/ui',
    'common/props',
    '../validators/constants',

    'bootstrap',
], (Promise, html, Validation, Events, UI, Props, Constants) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        input = t('input'),
        label = t('label');

    function factory(config) {
        const options = {},
            spec = config.parameterSpec,
            bus = config.bus,
            model = Props.make({
                data: {
                    value: null,
                },
                onUpdate: () => render(),
            });
        let parent, container, ui;

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
            const input = ui.getElement('input-container.input'),
                checked = input.checked;

            if (checked) {
                return input.value;
            }
            // Bad -- checkboxes do not let us represent a "positive" false
            // state. We should explore a better control.
            return 'false';
        }

        /*
         *
         * Sets the value in the model and then refreshes the widget.
         *
         */
        function setModelValue(value) {
            model.setItem('value', value);
        }

        function resetModelValue() {
            setModelValue(spec.defaultValue());
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
            return Promise.try(() => {
                if (!options.enabled) {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: Constants.DIAGNOSIS.DISABLED,
                    };
                }

                const rawValue = getInputValue(),
                    // TODO should actually create the set of checkbox values and
                    // make this a validation option, although not specified as
                    // such in the spec.
                    validationOptions = {
                        required: spec.required(),
                    };

                return Validation.validateBoolean(rawValue, validationOptions);
            });
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeInputControl(events, bus) {
            const value = model.getItem('value'),
                isChecked = value ? true : false;

            return label([
                input({
                    type: 'checkbox',
                    dataElement: 'input',
                    value: 'true',
                    checked: isChecked,
                    id: events.addEvents({
                        events: [
                            {
                                type: 'change',
                                handler: () => {
                                    validate().then((result) => {
                                        if (result.isValid) {
                                            bus.emit('changed', {
                                                newValue: result.parsedValue,
                                            });
                                            setModelValue(result.parsedValue);
                                        }
                                        bus.emit('validation', {
                                            errorMessage: result.errorMessage,
                                            diagnosis: result.diagnosis,
                                        });
                                    });
                                },
                            },
                        ],
                    }),
                }),
            ]);
        }
        function autoValidate() {
            return validate().then((result) => {
                bus.emit('validation', {
                    errorMessage: result.errorMessage,
                    diagnosis: result.diagnosis,
                });
            });
        }
        function render() {
            return Promise.try(() => {
                const events = Events.make(),
                    inputControl = makeInputControl(events, bus);

                ui.setContent('input-container', inputControl);
                events.attachEvents(container);
                return autoValidate();
            });
        }

        function layout(events) {
            const content = div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' })]
            );
            return {
                content: content,
                events: events,
            };
        }

        // LIFECYCLE API
        function start() {
            return Promise.try(() => {
                bus.on('run', (message) => {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));

                    const events = Events.make({ node: container }),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents();

                    ui = UI.make({ node: container });

                    bus.on('reset-to-defaults', () => {
                        resetModelValue();
                    });

                    // shorthand for a test of the message type.
                    bus.on('update', (message) => {
                        setModelValue(message.value);
                    });

                    bus.emit('sync');
                });
            });
        }

        function stop() {
            // TODO: detach all events.
            return Promise.resolve();
        }

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
