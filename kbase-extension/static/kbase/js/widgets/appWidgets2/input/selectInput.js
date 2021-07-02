define([
    'jquery',
    'bluebird',
    'kb_common/html',
    'common/ui',
    'common/runtime',
    '../validators/text',
    '../inputUtils',

    'select2',
    'bootstrap',
    'css!font-awesome',
], ($, Promise, html, UI, Runtime, Validation, inputUtils) => {
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
     *  - availableValues - optional Array of objects - if given, this supercedes the list of values given in the parameterSpec.
     *      as in the parameterSpec.data.constraints.options, each should be an object with structure:
     *      {
     *        display: string - the string to display as an option
     *        value: string - the value to set when selected
     *      }
     *  - initialValue - string - the value that should be selected when started
     *  - disabledValues - array - the values that should be disabled at start (if initialValue is here, it's ignored)
     *  - channelName - string - the bus channel to use
     *  - showOwnMessages - boolean - if true, this widget shows its own messages (better description to come)
     * @returns
     */
    function factory(config) {
        const spec = config.parameterSpec,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            model = {
                availableValues: config.availableValues || spec.data.constraints.options,
                value: config.initialValue,
                disabledValues: new Set(config.disabledValues || []),
            };
        let parent, ui, container;
        model.availableValuesSet = new Set(model.availableValues.map(valueObj => valueObj.value));

        function getControlValue() {
            const control = ui.getElement('input-container.input'),
                selected = $(control).val();

            return selected;
        }

        // VALIDATION

        function importControlValue() {
            return Promise.try(() => {
                return Validation.importString(getControlValue());
            });
        }

        function validate(value) {
            return Promise.try(() => {
                return Validation.validate(value, spec);
            });
        }

        function autoValidate() {
            return validate(model.value).then((result) => {
                channel.emit('validation', result);
            });
        }

        // DOM EVENTS

        function handleChanged() {
            importControlValue()
                .then((value) => {
                    setModelValue(value);
                    channel.emit('changed', {
                        newValue: value,
                    });
                    return validate(value);
                })
                .then((result) => {
                    if (result.isValid) {
                        if (config.showOwnMessages) {
                            ui.setContent('input-container.message', '');
                        }
                    } else if (result.diagnosis === 'required-missing') {
                        // nothing??
                    } else {
                        if (config.showOwnMessages) {
                            // show error message -- new!
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
                        diagnosis: 'invalid',
                        errorMessage: err.message,
                    });
                });
        }

        function makeInputControl() {
            const selectOptions = model.availableValues.map((item) => {
                const attribs = {
                    value: item.value,
                };
                if (item.value === model.value) {
                    attribs.selected = true;
                }
                else if (model.disabledValues.has(item.value)) {
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
            setValuesEnabled([value], true);
            setValuesEnabled([oldValue], !model.disabledValues.has(oldValue))
        }

        function resetModelValue() {
            setModelValue(spec.data.defaultValue);
        }

        function setValuesEnabled(values, enabled) {
            const control = ui.getElement('input-container.input');
            values.forEach((value) => {
                if (value !== model.value && model.availableValuesSet.has(value)) {
                    const option = control.querySelector(`option[value="${value}"]`);
                    if (enabled) {
                        option.removeAttribute('disabled');
                    }
                    else {
                        option.setAttribute('disabled', true);
                    }
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
                        placeholder: {
                            id: 'select an option',
                        },
                        width: '100%',
                    })
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

                channel.on('disable-values', (message) => {
                    setValuesEnabled(message.values, false);
                });

                channel.on('enable-values', (message) => {
                    setValuesEnabled(message.values, true);
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
