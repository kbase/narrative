define([
    'jquery',
    'bluebird',
    'common/html',
    'common/ui',
    'common/runtime',
    '../validators/text',
    '../inputUtils',
    '../validators/constants',
    'select2',
    'bootstrap',
], ($, Promise, html, UI, Runtime, Validation, Constants, inputUtils) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        select = t('select'),
        option = t('option');

    /**
     *
     * @param {object} config has fields:
     *  - parameterSpec - object - the spec object with parameter info as built by the Spec object
     *  - availableValues - optional Array of objects - if given, this supercedes the list of
     *    values given in the parameterSpec.
     *      as in the parameterSpec.data.constraints.options, each should be an object with the
     *      structure:
     *      {
     *        display: string - the string to display as an option
     *        value: string - the value to set when selected
     *      }
     *  - initialValue - string - the value that should be selected when started
     *  - disabledValues - array - the values that should be disabled at start (if initialValue is
     *    here, it's ignored)
     *  - channelName - string - the bus channel to use
     *  - showOwnMessages - boolean - if true, this widget shows its own messages
     *    (better description to come)
     *  - invalidError - optional string - if present, this will be used for an error if an invalid
     *    value is somehow selected (typically bad initialization)
     * @returns
     */
    function factory(config) {
        const spec = config.parameterSpec,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            invalidError = config.invalidError,
            model = {
                availableValues: config.availableValues || spec.data.constraints.options || [],
                value: config.initialValue,
                disabledValues: new Set(config.disabledValues || []),
                invalidValues: new Set(config.invalidValues || []),
            };
        let parent, ui, container;
        model.availableValuesSet = new Set(model.availableValues.map((valueObj) => valueObj.value));

        function getControlValue() {
            const control = ui.getElement('input-container.input'),
                selected = $(control).val();

            return selected;
        }

        // VALIDATION

        function importControlValue() {
            return Validation.importString(getControlValue());
        }

        function validate(value) {
            return Validation.validate(value, spec, {
                invalidValues: model.invalidValues,
                invalidError,
            });
        }

        function autoValidate() {
            return validate(model.value).then((result) => {
                channel.emit('validation', result);
            });
        }

        // DOM EVENTS

        function handleChanged() {
            const value = importControlValue();
            setModelValue(value);
            channel.emit('changed', {
                newValue: value,
            });
            return validate(value)
                .then((result) => {
                    if (config.showOwnMessages) {
                        if (result.isValid) {
                            ui.setContent('input-container.message', '');
                        } else {
                            const message = inputUtils.buildMessageAlert({
                                title: 'ERROR',
                                type: 'danger',
                                id: result.messageId,
                                message: result.errorMessage,
                            });
                            ui.setContent('input-container.message', message.content);
                            message.events.attachEvents();
                        }
                    }
                    channel.emit('validation', result);
                })
                .catch((err) => {
                    channel.emit('validation', {
                        isValid: false,
                        diagnosis: Constants.DIAGNOSIS.INVALID,
                        errorMessage: err.message,
                    });
                });
        }

        function makeInputControl() {
            const selectOptions = model.availableValues.map((item) => {
                const attribs = {
                    value: item.value,
                };
                if (model.disabledValues.has(item.value)) {
                    attribs.disabled = true;
                }
                return option(attribs, item.display);
            });

            // CONTROL
            return select(
                {
                    class: 'form-control',
                    dataElement: 'input',
                },
                selectOptions
            );
        }

        function layout() {
            return div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' }, makeInputControl())]
            );
        }

        function setModelValue(value) {
            const oldValue = model.value;
            if (oldValue !== value) {
                model.value = value;
            }
            setDisabledValuesFromModel();
        }

        function resetModelValue() {
            setModelValue(spec.data.defaultValue);
        }

        /**
         * Sets which options should be disabled based on the set of values currently
         * in the model.disabledValues set.
         *
         * Any options not in that set are enabled, all others set disabled. This doesn't
         * include the currently selected option, which is always enabled.
         */
        function setDisabledValuesFromModel() {
            const control = ui.getElement('input-container.input');
            model.availableValuesSet.forEach((value) => {
                const option = control.querySelector(`option[value="${value}"]`);
                if (model.disabledValues.has(value) && value !== model.value) {
                    option.setAttribute('disabled', true);
                } else {
                    option.removeAttribute('disabled');
                }
            });
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                container.innerHTML = layout();
                $(ui.getElement('input-container.input'))
                    .select2({
                        allowClear: true,
                        placeholder: 'select an option',
                        width: '100%',
                    })
                    .val(model.value)
                    .trigger('change') // this goes first so we don't trigger extra unnecessary bus messages
                    .on('change', () => {
                        handleChanged();
                    })
                    .on('select2:clear', () => {
                        handleChanged();
                    });

                channel.on('reset-to-defaults', () => {
                    resetModelValue();
                });

                channel.on('update', (message) => {
                    setModelValue(message.value);
                });

                // this replaces the disabledValues set in the model
                // and updates the view to match
                channel.on('set-disabled-values', (message) => {
                    model.disabledValues = new Set(message.values);
                    setDisabledValuesFromModel();
                });

                autoValidate();
            });
        }

        function stop() {
            return Promise.try(() => {
                if (container) {
                    parent.removeChild(container);
                }
                busConnection.stop();
            });
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
