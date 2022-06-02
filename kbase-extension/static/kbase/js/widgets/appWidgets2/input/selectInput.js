define([
    'jquery',
    'bluebird',
    'common/html',
    'common/ui',
    'common/runtime',
    'common/events',
    'widgets/appWidgets2/validation',
    'widgets/appWidgets2/common',
    '../inputUtils',
    'widgets/appWidgets2/validators/constants',
    'select2',
    'bootstrap',
], ($, Promise, html, UI, Runtime, Events, Validation, WidgetCommon, inputUtils, Constants) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        select = t('select'),
        MAX_OPTIONS = 20;

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
            },
            devMode = config.devMode || false;
        let useMultiselect = false;
        try {
            if (spec.original.dropdown_options.multiselection) {
                useMultiselect = true;
            }
        } catch (err) {
            // no op
        }

        let parent, ui, container;
        model.availableValuesSet = new Set(model.availableValues.map((valueObj) => valueObj.value));

        // VALIDATION
        function importControlValue() {
            const control = ui.getElement('input-container.input'),
                selected = $(control).val();
            const importFn = useMultiselect ? 'importTextStringArray' : 'importTextString';
            return Validation[importFn](selected);
        }

        function validate(value) {
            return Promise.try(() => {
                const defaultInvalidMessage = `Invalid ${spec.ui.label}: ${value}. Please select a value from the dropdown.`;

                const validationFn = useMultiselect ? 'validateTextSet' : 'validateTextString';
                const validation = Validation[validationFn](value || '', spec.data.constraints, {
                    invalidValues: model.invalidValues,
                    invalidError: invalidError || defaultInvalidMessage,
                    validValues: model.availableValuesSet,
                });
                if (validation.diagnosis === Constants.DIAGNOSIS.REQUIRED_MISSING) {
                    validation.errorMessage = 'A value is required.';
                }
                if (validation.messageId === 'value-not-array') {
                    validation.errorMessage = 'Invalid format: ' + validation.errorMessage;
                } else if (validation.messageId === 'value-not-found') {
                    validation.errorMessage =
                        'Invalid value. Please select a value from the dropdown.';
                }
                return validation;
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
            return select({
                class: 'form-control',
                dataElement: 'input',
            });
        }

        function layout() {
            return div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' })]
            );
        }

        function setModelValue(value) {
            // This might be a bit of a cheat. I'm not sure what'll happen if we just
            // remove the current value from disabled values before updating.
            // WE'LL SEE!
            if (model.disabledValues.has(model.value)) {
                model.disabledValues.delete(model.value);
            }
            model.value = value;
            if (value) {
                model.disabledValues.add(value);
            }
            setDisabledValuesFromModel();
            $(ui.getElement('input-container.input')).val(value);
            if (devMode) {
                channel.emit('set-value', value);
            }
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
                const opt = control.querySelector(`option[value="${value}"]`);
                if (opt) {
                    if (model.disabledValues.has(value) && value !== model.value) {
                        opt.setAttribute('disabled', true);
                    } else {
                        opt.removeAttribute('disabled');
                    }
                }
            });
        }

        /**
         * Retrieves the user-facing value of the selected input value(s)
         *
         * If the input has multiselection enabled, selected values are returned as a comma-separated string
         *
         * @returns {string} text version of the current input value
         */

        function getCopyString() {
            const data = $(ui.getElement('input-container.input')).select2('data');
            if (!data || !data.length || !data[0].text) {
                return '';
            }
            if (!useMultiselect) {
                return data[0].text;
            }
            return Array.from(data)
                .map((item) => {
                    return item.text;
                })
                .filter((item) => {
                    return item.length;
                })
                .join(', ');
        }

        // LIFECYCLE API

        function buildAllOptions() {
            return model.availableValues.map((item) => buildOption(item));
        }

        function buildOption(item = {}) {
            return {
                value: item.value,
                id: item.value,
                text: item.display,
                disabled: model.disabledValues.has(item.value),
            };
        }

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });
                container.innerHTML = layout();
                const events = Events.make();
                const content = WidgetCommon.containerContent(
                    div,
                    t('button'),
                    events,
                    ui,
                    ui.getElement('input-container'),
                    makeInputControl(),
                    getCopyString
                );
                ui.setContent('input-container', content);

                const selectData = [];
                if (model.availableValues.length <= MAX_OPTIONS) {
                    selectData.push(...buildAllOptions());
                } else {
                    const displayItem = model.availableValues.find(
                        (item) => item.value === model.value
                    );
                    if (displayItem) {
                        selectData.push(buildOption(displayItem));
                    }
                }

                let ajaxCommand = undefined;
                if (model.availableValues.length > MAX_OPTIONS) {
                    ajaxCommand = {
                        transport: function (_params, success) {
                            success({ results: buildAllOptions() });
                        },
                    };
                }

                $(ui.getElement('input-container.input'))
                    .select2({
                        allowClear: true,
                        placeholder: 'select an option',
                        width: '100%',
                        multiple: useMultiselect,
                        data: selectData,
                        ajax: ajaxCommand,
                    })
                    .val(model.value)
                    .trigger('change') // this goes first so we don't trigger extra unnecessary bus messages
                    .on('change', () => {
                        handleChanged();
                    })
                    .on('select2:clear', () => {
                        handleChanged();
                    });

                events.attachEvents(container);

                channel.on('reset-to-defaults', () => {
                    setModelValue(spec.data.defaultValue);
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

                return validate(model.value).then((result) => {
                    channel.emit('validation', result);
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                const control = ui.getElement('input-container.input');
                if (control) {
                    $(control).select2('destroy').html('');
                }
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
