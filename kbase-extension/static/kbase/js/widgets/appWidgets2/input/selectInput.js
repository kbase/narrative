define([
    'bluebird',
    'kb_common/html',
    'common/events',
    'common/ui',
    'common/runtime',
    '../validators/text',
    '../inputUtils',

    'bootstrap',
    'css!font-awesome',
], (Promise, html, Events, UI, Runtime, Validation, inputUtils) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        let spec = config.parameterSpec,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            parent,
            ui,
            container,
            model = {
                availableValues: null,
                value: null,
            };

        model.availableValues = spec.data.constraints.options;

        model.availableValuesMap = {};
        model.availableValues.forEach((item, index) => {
            item.index = index;
            model.availableValuesMap[item.value] = item;
        });

        function getControlValue() {
            const control = ui.getElement('input-container.input'),
                selected = control.selectedOptions;

            if (selected.length === 0) {
                return spec.data.nullValue;
            }

            // we are modeling a single string value, so we always just get the
            // first selected element, which is all there should be!
            return selected.item(0).value;
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
            return {
                type: 'change',
                handler: function () {
                    importControlValue()
                        .then((value) => {
                            model.value = value;
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
                },
            };
        }

        function makeInputControl(events) {
            let selected,
                selectOptions = model.availableValues.map((item) => {
                    selected = false;
                    if (item.value === model.value) {
                        selected = true;
                    }

                    return option(
                        {
                            value: item.value,
                            selected: selected,
                        },
                        item.display
                    );
                });

            // CONTROL
            return select(
                {
                    id: events.addEvents({ events: [handleChanged()] }),
                    class: 'form-control',
                    dataElement: 'input',
                },
                [option({ value: '' }, '')].concat(selectOptions)
            );
        }

        function syncModelToControl() {
            // assuming the model has been modified...
            const control = ui.getElement('input-container.input');
            // loop through the options, selecting the one with the value.
            // unselect
            if (control.selectedIndex >= 0) {
                control.options.item(control.selectedIndex).selected = false;
            }
            const selectedItem = model.availableValuesMap[model.value];
            if (selectedItem) {
                control.options.item(selectedItem.index + 1).selected = true;
            }
        }

        function layout(events) {
            const content = div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' }, makeInputControl(events))]
            );
            return {
                content: content,
                events: events,
            };
        }

        function setModelValue(value) {
            if (model.value !== value) {
                model.value = value;
            }
        }

        function resetModelValue() {
            setModelValue(spec.data.defaultValue);
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                const events = Events.make({ node: container }),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents();

                channel.on('reset-to-defaults', () => {
                    resetModelValue();
                });
                channel.on('update', (message) => {
                    setModelValue(message.value);
                });
                // bus.emit('sync');

                setModelValue(config.initialValue);
                autoValidate();
                syncModelToControl();
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
