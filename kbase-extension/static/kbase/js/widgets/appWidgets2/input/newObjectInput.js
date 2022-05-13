define([
    'bluebird',
    'common/html',
    'widgets/appWidgets2/validation',
    'common/events',
    'common/runtime',
    'common/ui',
    'widgets/appWidgets2/validators/constants',
    'bootstrap',
], (Promise, html, Validation, Events, Runtime, UI, Constants) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        const options = {},
            spec = config.parameterSpec,
            workspaceId = config.workspaceId,
            bus = config.bus,
            model = {
                value: undefined,
            },
            runtime = Runtime.make(),
            otherOutputParams = config.closeParameters
                ? config.closeParameters.filter((value) => value !== spec.id)
                : [];
        let container, ui, autoChangeTimer;

        // Validate configuration.
        // Nothing to do...

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
            return ui.getElement('input-container.input').value;
        }

        function setModelValue(value) {
            if (model.value !== value) {
                model.value = value;
            }
            ui.getElement('input-container.input').value = value;
        }

        /*
         * Text fields can occur in multiples.
         * We have a choice, treat single-text fields as a own widget
         * or as a special case of multiple-entry --
         * with a min-items of 1 and max-items of 1.
         */

        function validate() {
            if (!options.enabled) {
                return Promise.resolve({
                    isValid: true,
                    validated: false,
                    diagnosis: Constants.DIAGNOSIS.DISABLED,
                });
            }
            const rawValue = getInputValue();
            return validateUniqueOutput(rawValue)
                .then((isUnique) => {
                    if (!isUnique) {
                        return {
                            isValid: false,
                            diagnosis: Constants.DIAGNOSIS.INVALID,
                            errorMessage:
                                'Every output object from a single app run must have a unique name.',
                        };
                    } else {
                        const validationOptions = {
                            shouldNotExist: true,
                            workspaceId,
                            authToken: runtime.authToken(),
                            workspaceServiceUrl: runtime.config('services.workspace.url'),
                        };
                        return Validation.validateWorkspaceObjectName(
                            rawValue,
                            spec.data.constraints,
                            validationOptions
                        );
                    }
                })
                .then((validationResult) => {
                    bus.emit('validation', validationResult);
                    return validationResult;
                })
                .catch((error) => {
                    const validationResult = {
                        errorMessage: error.message,
                        diagnosis: Constants.DIAGNOSIS.ERROR,
                        messageId: Constants.DIAGNOSIS.ERROR,
                    };
                    bus.emit('validation', validationResult);
                    return validationResult;
                });
        }

        /* Validate that this is a unique value among all output parameters */
        function validateUniqueOutput(rawValue) {
            return bus
                .request(
                    {
                        parameterNames: otherOutputParams,
                    },
                    {
                        key: {
                            type: 'get-parameters',
                        },
                    }
                )
                .then((paramValues) => {
                    const duplicates = Object.values(paramValues).filter(
                        (value) => rawValue === value && !!value
                    );
                    return !duplicates.length;
                });
        }

        function handleTouched(interval) {
            const editPauseInterval = interval || 500;
            return {
                type: 'keyup',
                handler: function (e) {
                    bus.emit('touched');
                    if (autoChangeTimer) {
                        clearTimeout(autoChangeTimer);
                        autoChangeTimer = null;
                    }
                    autoChangeTimer = window.setTimeout(() => {
                        autoChangeTimer = null;
                        e.target.dispatchEvent(new Event('change'));
                    }, editPauseInterval);
                },
            };
        }

        function handleChanged() {
            return {
                type: 'change',
                handler: function () {
                    if (getInputValue() === model.value) {
                        console.error('value is not changed! not validating!');
                        return;
                    }
                    validate().then((result) => {
                        const changeMsg = {
                            newValue: result.parsedValue,
                        };
                        if (result.diagnosis === Constants.DIAGNOSIS.INVALID) {
                            changeMsg.isError = true;
                        }
                        if (
                            result.isValid ||
                            result.diagnosis === Constants.DIAGNOSIS.REQUIRED_MISSING ||
                            result.diagnosis === Constants.DIAGNOSIS.INVALID
                        ) {
                            model.value = result.parsedValue;
                            bus.emit('changed', changeMsg);
                        }
                    });
                },
            };
        }

        function render() {
            const events = Events.make(),
                inputControl = input({
                    id: events.addEvents({
                        events: [handleChanged(), handleTouched()],
                    }),
                    class: 'form-control',
                    dataElement: 'input',
                    value: model.value,
                });

            ui.setContent('input-container', inputControl);
            events.attachEvents(container);
        }

        function layout() {
            return div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' })]
            );
        }

        // LIFECYCLE API

        function start(args) {
            return Promise.try(() => {
                container = args.node;
                ui = UI.make({ node: container });

                container.innerHTML = layout();
                render();

                bus.on('reset-to-defaults', () => {
                    setModelValue(spec.data.defaultValue || '');
                    return validate();
                });
                bus.on('update', (message) => {
                    setModelValue(message.value);
                    return validate();
                });
                setModelValue(config.initialValue);
                return config.skipAutoValidate ? Promise.resolve() : validate();
            });
        }

        function stop() {
            if (container) {
                container.innerHTML = '';
            }
            return Promise.resolve();
        }

        return {
            start,
            stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
